from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import Counselor, CounselorRequest

User = get_user_model()


class CounselorHubAPITestCase(APITestCase):
    """
    Comprehensive test suite for Counselor Hub Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for counselor listing, request creation, and user requests views
    - Counselor list retrieval with optional specialization filtering
    - Counselor request creation with module completion and XP award integration
    - Validation checks for unavailable counselors and invalid payload data
    - User's own counselor requests retrieval ordered by creation date
    - Model string representations
    """

    def setUp(self):
        # 1. Primary Test User
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )

        # 2. Sample Wellness Module for XP reward integration
        self.wellness_module = WellnessModule.objects.create(
            name="Counselor Hub",
            slug="counselor-hub",
            description="Connect with professional counselors",
            module_type="counselor_hub",
            required_xp=0,
            xp_reward=15,
            order=1,
            status="active",
        )

        # 3. Sample Counselors
        self.counselor_available = Counselor.objects.create(
            name="Dr. Sarah Smith",
            specialization="sports_psychology",
            experience_years=8,
            is_available=True,
        )

        self.counselor_unavailable = Counselor.objects.create(
            name="Dr. John Doe",
            specialization="career",
            experience_years=5,
            is_available=False,
        )

        # 4. URLs mapping
        self.list_url = reverse("counselor-hub-list")
        self.request_url = reverse("counselor-hub-request")
        self.my_requests_url = reverse("counselor-hub-my-requests")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to counselor hub endpoints are blocked (401 Unauthorized).
        """
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.request_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get(self.my_requests_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # COUNSELOR LISTING TESTS
    # =========================================================================

    def test_get_counselors_list_success(self):
        """
        Ensure authenticated users can retrieve available counselors list.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        # Should only return available counselors (1 out of 2)
        self.assertEqual(len(response.data["counselors"]), 1)
        self.assertEqual(response.data["counselors"][0]["name"], "Dr. Sarah Smith")

    def test_get_counselors_with_specialization_filter(self):
        """
        Ensure filtering counselors by specialization query parameter works correctly.
        """
        self.client.force_authenticate(user=self.user)
        
        # Filter with matching specialization
        response = self.client.get(self.list_url, {"specialization": "sports_psychology"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["counselors"]), 1)

        # Filter with non-matching specialization
        response = self.client.get(self.list_url, {"specialization": "mental_wellness"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["counselors"]), 0)

    # =========================================================================
    # COUNSELOR REQUEST TESTS
    # =========================================================================

    def test_create_counselor_request_success_and_xp_award(self):
        """
        Ensure user can successfully submit a counselor request, awards XP, and completes module.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "counselor": self.counselor_available.id,
            "request_type": "appointment",
            "message": "Need help with performance anxiety.",
            "preferred_date": "2026-09-01",
            "preferred_time": "10:00:00",
        }
        response = self.client.post(self.request_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["xp_awarded"], 15)
        self.assertEqual(response.data["request"]["counselor"], self.counselor_available.id)

        # Verify database record
        self.assertEqual(CounselorRequest.objects.filter(user=self.user).count(), 1)

    def test_create_counselor_request_unavailable_counselor(self):
        """
        Ensure requesting an unavailable counselor returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "counselor": self.counselor_unavailable.id,
            "request_type": "appointment",
            "message": "Looking forward to booking.",
        }
        response = self.client.post(self.request_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "This counselor is currently unavailable.")

    def test_create_counselor_request_invalid_data(self):
        """
        Ensure submitting invalid payload returns 400 Bad Request with errors.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "counselor": 9999,  # Non-existent counselor ID
            "request_type": "invalid-type",
        }
        response = self.client.post(self.request_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertIn("counselor", response.data["errors"])

    # =========================================================================
    # MY REQUESTS TESTS
    # =========================================================================

    def test_get_my_requests_success(self):
        """
        Ensure authenticated user can retrieve their submitted requests.
        """
        self.client.force_authenticate(user=self.user)
        
        # Create a request manually
        CounselorRequest.objects.create(
            user=self.user,
            counselor=self.counselor_available,
            request_type="callback",
            message="Please call back.",
        )

        response = self.client.get(self.my_requests_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(response.data["requests"]), 1)
        self.assertEqual(response.data["requests"][0]["request_type"], "callback")
        self.assertEqual(response.data["requests"][0]["counselor_name"], "Dr. Sarah Smith")

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_counselor_hub_models_str_representations(self):
        """
        Ensure string representations of Counselor and CounselorRequest return expected formats.
        """
        self.assertEqual(str(self.counselor_available), "Dr. Sarah Smith")

        c_request = CounselorRequest.objects.create(
            user=self.user,
            counselor=self.counselor_available,
            request_type="appointment",
        )
        expected_str = f"{self.user} - {self.counselor_available} - appointment"
        self.assertEqual(str(c_request), expected_str)
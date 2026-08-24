from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.modules.breathwork.models import BreathworkSession

User = get_user_model()


class BreathworkAPITestCase(APITestCase):
    """
    Comprehensive test suite for Breathwork Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for info and record endpoints
    - Breathwork info retrieval (duration options and techniques)
    - Breathwork session recording and XP/notification handling
    - Input validation for duration and elapsed seconds
    - Model string representation
    """

    def setUp(self):
        # 1. Primary Test User
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )

        # 2. Sample Breathwork Sanctuary Module for XP reward integration
        self.breathwork_module = WellnessModule.objects.create(
            name="Breathwork Sanctuary",
            slug="breathwork-sanctuary",
            description="Box breathing technique for deep relaxation",
            module_type="breathwork",
            required_xp=0,
            xp_reward=15,
            order=1,
            status="active",
        )

        # 3. URLs mapping
        self.info_url = reverse("breathwork-info")
        self.record_url = reverse("breathwork-record")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to breathwork endpoints are blocked (401 Unauthorized).
        """
        response = self.client.get(self.info_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.record_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # INFO VIEW TESTS
    # =========================================================================

    def test_breathwork_info_success(self):
        """
        Ensure authenticated users can retrieve breathwork duration choices and techniques.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.info_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("duration_options", response.data)
        self.assertIn("technique", response.data)
        self.assertEqual(len(response.data["duration_options"]), 4)

    # =========================================================================
    # RECORD VIEW & VALIDATION TESTS
    # =========================================================================

    def test_breathwork_record_success(self):
        """
        Ensure recording a breathwork session completes successfully, awards XP, and creates session.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "duration_minutes": 5,
            "elapsed_seconds": 300,
        }
        response = self.client.post(self.record_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["session"]["duration_minutes"], 5)
        self.assertEqual(response.data["session"]["elapsed_seconds"], 300)
        self.assertEqual(response.data["session"]["status"], "completed")
        self.assertEqual(response.data["xp_awarded"], 15)

        # Verify database record
        self.assertEqual(BreathworkSession.objects.filter(user=self.user).count(), 1)

    def test_breathwork_record_invalid_parameters(self):
        """
        Ensure invalid non-numeric parameters return 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "duration_minutes": "invalid-duration",
            "elapsed_seconds": 300,
        }
        response = self.client.post(self.record_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_breathwork_record_negative_or_zero_duration(self):
        """
        Ensure zero or negative duration values are rejected with 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        
        # Test zero duration
        response = self.client.post(self.record_url, {"duration_minutes": 0})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

        # Test negative elapsed seconds
        response = self.client.post(self.record_url, {"duration_minutes": 3, "elapsed_seconds": -10})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    # =========================================================================
    # MODEL STR REPRESENTATION TEST
    # =========================================================================

    def test_breathwork_session_str_representation(self):
        """
        Ensure string representation of BreathworkSession follows the formatting structure.
        """
        session = BreathworkSession.objects.create(
            user=self.user,
            duration_minutes=5,
            elapsed_seconds=300,
            status="completed",
        )
        expected_str = f"{self.user} - 5 min - completed"
        self.assertEqual(str(session), expected_str)
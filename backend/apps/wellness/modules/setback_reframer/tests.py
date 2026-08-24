from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import ReframeSession

User = get_user_model()


class SetbackReframerAPITestCase(APITestCase):
    """
    Comprehensive test suite for Setback Reframer Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for generate and history endpoints
    - Reframe generation with mock AI service integration, session creation, and XP awards
    - Validation checks for missing or empty negative thought input
    - User setback reframe history retrieval
    - Model string representations
    """

    def setUp(self):
        # 1. Primary Test User
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )

        # 2. Sample Wellness Module for Setback Reframer
        self.wellness_module = WellnessModule.objects.create(
            name="Setback Reframer",
            slug="setback-reframer",
            description="Reframe negative thoughts and setbacks constructively",
            module_type="setback_reframer",
            required_xp=0,
            xp_reward=20,
            order=1,
            status="active",
        )

        # 3. Sample Reframe Session for history testing
        self.session_1 = ReframeSession.objects.create(
            user=self.user,
            negative_thought="I failed my exam, so I am completely useless.",
            reframe="Failure is an event, not a definition of who you are.",
            safety_message="",
            status="completed",
        )

        # 4. URLs mapping
        self.generate_url = reverse("setback-reframer-generate")
        self.history_url = reverse("setback-reframer-history")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to setback reframer endpoints are blocked (401 Unauthorized).
        """
        response = self.client.post(self.generate_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # GENERATE REFRAME TESTS
    # =========================================================================

    @patch("apps.wellness.modules.setback_reframer.views.generate_setback_reframe")
    def test_generate_reframe_success_and_xp_award(self, mock_generate_service):
        """
        Ensure submitting a valid thought generates a reframe, creates session, and awards XP.
        """
        self.client.force_authenticate(user=self.user)
        
        mock_generate_service.return_value = {
            "reframe": "This setback is a learning opportunity to improve.",
            "action_step": "Identify one area to work on tomorrow.",
            "safety_message": "",
        }

        payload = {
            "negative_thought": "I messed up the presentation badly.",
            "category": "performance",
        }
        response = self.client.post(self.generate_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["reframe"], "This setback is a learning opportunity to improve.")
        self.assertEqual(response.data["xp_awarded"], 20)
        self.assertIn("session_id", response.data)

        # Verify database session record creation
        self.assertEqual(ReframeSession.objects.filter(user=self.user).count(), 2)

    def test_generate_reframe_missing_thought(self):
        """
        Ensure submitting empty or missing negative thought returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "negative_thought": "   ",
        }
        response = self.client.post(self.generate_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "Please describe the setback or thought.")

    # =========================================================================
    # HISTORY TESTS
    # =========================================================================

    def test_get_setback_reframe_history_success(self):
        """
        Ensure authenticated users can retrieve their past reframe sessions successfully.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIsInstance(response.data["history"], list)
        self.assertEqual(len(response.data["history"]), 1)
        self.assertEqual(response.data["history"][0]["negative_thought"], "I failed my exam, so I am completely useless.")

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_reframe_session_model_str_representation(self):
        """
        Ensure string representation of ReframeSession returns the expected format.
        """
        expected_str = f"{self.user} - Reframe"
        self.assertEqual(str(self.session_1), expected_str)
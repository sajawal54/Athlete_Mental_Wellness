from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import SelfTalkEntry

User = get_user_model()


class SelfTalkDetectiveAPITestCase(APITestCase):
    """
    Comprehensive test suite for Self-Talk Detective Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for analyze and history endpoints
    - Negative thought analysis with mock service integration, session creation, and XP rewards
    - Validation checks for missing or invalid thought input formats
    - User self-talk history retrieval
    - Model string representations
    """

    def setUp(self):
        # 1. Primary Test User
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )

        # 2. Sample Wellness Module for Self-Talk Detective
        self.wellness_module = WellnessModule.objects.create(
            name="Self-Talk Detective",
            slug="self-talk-detective",
            description="Identify and reframe unhelpful thoughts",
            module_type="self_talk_detective",
            required_xp=0,
            xp_reward=20,
            order=1,
            status="active",
        )

        # 3. Sample Self-Talk Entry for history testing
        self.entry_1 = SelfTalkEntry.objects.create(
            user=self.user,
            negative_thought="I always fail at everything.",
            distortion_type="overgeneralization",
            analysis="Using words like always is an overgeneralization.",
            suggested_rewrite="I have faced challenges, but I also succeed often.",
            actionable_tip="Look at specific instances instead of generalizing.",
        )

        # 4. URLs mapping
        self.analyze_url = reverse("self-talk-detective-analyze")
        self.history_url = reverse("self-talk-detective-history")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to self-talk detective endpoints are blocked (401 Unauthorized).
        """
        response = self.client.post(self.analyze_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # ANALYZE THOUGHT TESTS
    # =========================================================================

    @patch("apps.wellness.modules.self_talk_detective.views.analyze_self_talk")
    def test_analyze_thought_success_and_xp_award(self, mock_analyze_service):
        """
        Ensure submitting a valid negative thought triggers analysis, creates entry, and awards XP.
        """
        self.client.force_authenticate(user=self.user)
        
        mock_analyze_service.return_value = {
            "distortion_type": "catastrophizing",
            "distortion_label": "Catastrophizing",
            "analysis": "You are assuming the worst possible outcome.",
            "suggested_rewrite": "Things might turn out fine.",
            "actionable_tip": "Focus on controllable factors.",
        }

        payload = {
            "negative_thought": "This project is going to be a total disaster.",
        }
        response = self.client.post(self.analyze_url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["distortion_label"], "Catastrophizing")
        self.assertEqual(response.data["xp_awarded"], 20)
        self.assertIn("entry", response.data)

        # Verify database entry creation
        self.assertEqual(SelfTalkEntry.objects.filter(user=self.user).count(), 2)

    def test_analyze_thought_missing_input(self):
        """
        Ensure submitting empty or missing negative thought returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "negative_thought": "   ",
        }
        response = self.client.post(self.analyze_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "Please enter a self-talk statement.")

    # =========================================================================
    # HISTORY TESTS
    # =========================================================================

    def test_get_self_talk_history_success(self):
        """
        Ensure authenticated users can retrieve their past self-talk entries successfully.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIsInstance(response.data["history"], list)
        self.assertEqual(len(response.data["history"]), 1)
        self.assertEqual(response.data["history"][0]["negative_thought"], "I always fail at everything.")

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_self_talk_model_str_representation(self):
        """
        Ensure string representation of SelfTalkEntry returns the expected format.
        """
        expected_str = f"{self.user} - overgeneralization"
        self.assertEqual(str(self.entry_1), expected_str)
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import ReactionPrompt, ReactionGameSession

User = get_user_model()


class ReactionZoneAPITestCase(APITestCase):
    """
    Comprehensive test suite for Reaction Zone Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for prompts, submit-score, and leaderboard endpoints
    - Reaction prompts listing with active filtering and ordering
    - Score submission, validation of score values, session creation, and module XP reward response
    - Leaderboard ranking returning top unique user scores
    - Model string representations
    """

    def setUp(self):
        # 1. Test Users
        self.user_1 = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )
        self.user_2 = User.objects.create_user(
            username="janemember",
            email="jane@example.com",
            password="StrongPassword123!",
        )

        # 2. Sample Wellness Module for Reaction Zone
        self.wellness_module = WellnessModule.objects.create(
            name="Reaction Zone",
            slug="reaction-zone",
            description="Test your reaction speed and focus",
            module_type="reaction_zone",
            required_xp=0,
            xp_reward=25,
            order=1,
            status="active",
        )

        # 3. Sample Reaction Prompts
        self.prompt_1 = ReactionPrompt.objects.create(
            prompt="Click when green",
            correct_answer="green",
            difficulty="easy",
            is_active=True,
        )

        self.inactive_prompt = ReactionPrompt.objects.create(
            prompt="Old Prompt",
            correct_answer="red",
            is_active=False,
        )

        # 4. Sample Game Sessions for Leaderboard testing
        self.session_1 = ReactionGameSession.objects.create(
            user=self.user_1,
            score=80,
            total_prompts=5,
            correct_answers=4,
            duration_seconds=12,
            status="completed",
        )
        self.session_2 = ReactionGameSession.objects.create(
            user=self.user_1,
            score=150,
            total_prompts=5,
            correct_answers=5,
            duration_seconds=10,
            status="completed",
        )

        # 5. URLs mapping
        self.prompts_url = reverse("reaction-zone-prompts")
        self.submit_url = reverse("reaction-zone-submit")
        self.leaderboard_url = reverse("reaction-zone-leaderboard")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to reaction zone endpoints are blocked (401 Unauthorized).
        """
        response = self.client.get(self.prompts_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.submit_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get(self.leaderboard_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # PROMPTS LISTING TESTS
    # =========================================================================

    def test_get_prompts_list_success(self):
        """
        Ensure authenticated users can retrieve active reaction prompts.
        """
        self.client.force_authenticate(user=self.user_1)
        response = self.client.get(self.prompts_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        # Should only return active prompts (1 out of 2)
        self.assertEqual(len(response.data["prompts"]), 1)
        self.assertEqual(response.data["prompts"][0]["prompt"], "Click when green")

    # =========================================================================
    # SUBMIT SCORE TESTS
    # =========================================================================

    def test_submit_score_success(self):
        """
        Ensure valid game score submission creates a session and returns correct payload without awarding direct XP.
        """
        self.client.force_authenticate(user=self.user_1)
        payload = {
            "score": 120,
            "correct_answers": 5,
            "total_prompts": 5,
            "duration_seconds": 8,
        }
        response = self.client.post(self.submit_url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["score"], 120)
        self.assertEqual(response.data["correct_answers"], 5)
        self.assertEqual(response.data["total_prompts"], 5)
        self.assertEqual(response.data["module_xp_reward"], 25)
        self.assertEqual(response.data["xp_awarded"], 0)
        self.assertIn("session_id", response.data)

        # Verify database session record creation
        self.assertEqual(ReactionGameSession.objects.filter(user=self.user_1).count(), 3)

    def test_submit_score_invalid_types(self):
        """
        Ensure submitting non-numeric score values returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user_1)
        payload = {
            "score": "invalid-score",
        }
        response = self.client.post(self.submit_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "Score values must be valid numbers.")

    # =========================================================================
    # LEADERBOARD TESTS
    # =========================================================================

    def test_leaderboard_view_success(self):
        """
        Ensure leaderboard returns top scores successfully, filtering best session per user.
        """
        self.client.force_authenticate(user=self.user_2)
        response = self.client.get(self.leaderboard_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        # Should return list containing top scores
        self.assertIsInstance(response.data["leaderboard"], list)
        self.assertGreaterEqual(len(response.data["leaderboard"]), 1)
        # Verify user_1's best score (150) is prioritized over 80
        top_entry = response.data["leaderboard"][0]
        self.assertEqual(top_entry["username"], "sajawalkhan")
        self.assertEqual(top_entry["score"], 150)

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_reaction_models_str_representations(self):
        """
        Ensure string representations of ReactionPrompt and ReactionGameSession return expected formats.
        """
        self.assertEqual(str(self.prompt_1), "Click when green")

        expected_str = f"{self.user_1} - {self.session_1.score}"
        self.assertEqual(str(self.session_1), expected_str)
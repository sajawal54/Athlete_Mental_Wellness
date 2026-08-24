from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import MindfulMonsterStep, MindfulMonsterSession

User = get_user_model()


class MindfulMonstersAPITestCase(APITestCase):
    """
    Comprehensive test suite for Mindful Monsters Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for steps list and record session endpoints
    - Mindful monster steps listing with active filtering and ordering
    - Recording session progress, score calculation based on completed steps, session creation, and XP award integration
    - Validation checks for invalid completed_steps input formats
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
            name="Mindful Monsters",
            slug="mindful-monsters",
            description="Breathing exercises with mindful monsters",
            module_type="mindful_monsters",
            required_xp=0,
            xp_reward=20,
            order=1,
            status="active",
        )

        # 3. Sample Mindful Monster Steps
        self.step_1 = MindfulMonsterStep.objects.create(
            title="Deep Breath",
            instruction="Inhale slowly through your nose.",
            phase="inhale",
            duration_seconds=5,
            order=1,
            is_active=True,
        )

        self.step_2 = MindfulMonsterStep.objects.create(
            title="Exhale Out",
            instruction="Release air gently through your mouth.",
            phase="exhale",
            duration_seconds=5,
            order=2,
            is_active=True,
        )

        self.inactive_step = MindfulMonsterStep.objects.create(
            title="Old Step",
            instruction="Inactive instruction",
            phase="relax",
            is_active=False,
        )

        # 4. URLs mapping
        self.steps_url = reverse("mindful-monsters-steps")
        self.record_url = reverse("mindful-monsters-record")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to mindful monsters endpoints are blocked (401 Unauthorized).
        """
        response = self.client.get(self.steps_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.record_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # STEPS LISTING TESTS
    # =========================================================================

    def test_get_steps_list_success(self):
        """
        Ensure authenticated users can retrieve active mindful monster steps ordered correctly.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.steps_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        # Should only return active steps (2 out of 3)
        self.assertEqual(len(response.data["steps"]), 2)
        self.assertEqual(response.data["steps"][0]["title"], "Deep Breath")

    # =========================================================================
    # RECORD SESSION & XP AWARD TESTS
    # =========================================================================

    def test_record_session_success_and_xp_award(self):
        """
        Ensure recording a session with valid completed steps calculates score, creates session, and awards XP.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "completed_steps": 2,
        }
        response = self.client.post(self.record_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["completed_steps"], 2)
        self.assertEqual(response.data["total_steps"], 2)
        self.assertEqual(response.data["xp_awarded"], 20)
        self.assertIn("session_id", response.data)

        # Verify database record
        self.assertEqual(MindfulMonsterSession.objects.filter(user=self.user).count(), 1)
        session = MindfulMonsterSession.objects.get(user=self.user)
        self.assertEqual(session.status, "completed")
        self.assertEqual(session.completed_steps, 2)

    def test_record_session_invalid_completed_steps(self):
        """
        Ensure submitting non-integer completed_steps returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "completed_steps": "invalid-number",
        }
        response = self.client.post(self.record_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "completed_steps must be a valid number.")

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_mindful_monster_models_str_representations(self):
        """
        Ensure string representations of MindfulMonsterStep and MindfulMonsterSession return expected formats.
        """
        self.assertEqual(str(self.step_1), "Deep Breath")

        session = MindfulMonsterSession.objects.create(
            user=self.user,
            completed_steps=2,
            total_steps=2,
        )
        expected_str = f"{self.user} - Mindful Monsters"
        self.assertEqual(str(session), expected_str)
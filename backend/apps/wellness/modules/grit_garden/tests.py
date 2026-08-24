from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import GritGardenSession

User = get_user_model()


class GritGardenAPITestCase(APITestCase):
    """
    Comprehensive test suite for Grit Garden Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for save and history endpoints
    - Saving grit garden reflection, creating a completed session, and XP award integration
    - Retrieving user's latest grit garden history sessions
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
            name="Grit Garden",
            slug="grit-garden",
            description="Cultivate mental resilience through reflections",
            module_type="grit_garden",
            required_xp=0,
            xp_reward=15,
            order=1,
            status="active",
        )

        # 3. URLs mapping
        self.save_url = reverse("grit-garden-save")
        self.history_url = reverse("grit-garden-history")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to grit garden endpoints are blocked (401 Unauthorized).
        """
        response = self.client.post(self.save_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # SAVE REFLECTION & XP AWARD TESTS
    # =========================================================================

    def test_grit_garden_save_success_and_xp_award(self):
        """
        Ensure saving a grit garden reflection creates a completed session, awards XP, and returns success.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "exercise_type": "reflection",
            "journal_text": "Today was challenging, but I stayed consistent.",
            "exercise_response": "Feeling more grounded now.",
        }
        response = self.client.post(self.save_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["xp_awarded"], 15)
        self.assertIn("session_id", response.data)

        # Verify database record
        self.assertEqual(GritGardenSession.objects.filter(user=self.user).count(), 1)
        session = GritGardenSession.objects.get(user=self.user)
        self.assertEqual(session.status, "completed")
        self.assertEqual(session.exercise_type, "reflection")

    # =========================================================================
    # HISTORY TESTS
    # =========================================================================

    def test_grit_garden_history_success(self):
        """
        Ensure authenticated user can retrieve their latest grit garden sessions history.
        """
        self.client.force_authenticate(user=self.user)
        
        # Create a session manually
        GritGardenSession.objects.create(
            user=self.user,
            exercise_type="gratitude",
            journal_text="I am grateful for my team.",
            status="completed",
        )

        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(response.data["history"]), 1)
        self.assertEqual(response.data["history"][0]["exercise_type"], "gratitude")

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_grit_garden_model_str_representation(self):
        """
        Ensure string representation of GritGardenSession returns expected format.
        """
        session = GritGardenSession.objects.create(
            user=self.user,
            exercise_type="stress_release",
        )
        expected_str = f"{self.user} - stress_release"
        self.assertEqual(str(session), expected_str)
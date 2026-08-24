from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import EmpathyScenario, EmpathySession

User = get_user_model()


class EchoesOfEmpathyAPITestCase(APITestCase):
    """
    Comprehensive test suite for Echoes of Empathy Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for scenarios list and submit endpoints
    - Scenarios listing with active filtering and ordering
    - Empathy response submission, evaluation, session creation, and XP reward integration
    - Validation checks for missing scenario_id, non-existent scenario, and empty response text
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
            name="Echoes of Empathy",
            slug="echoes-of-empathy",
            description="Practice empathetic communication",
            module_type="echoes_of_empathy",
            required_xp=0,
            xp_reward=20,
            order=1,
            status="active",
        )

        # 3. Sample Empathy Scenarios
        self.scenario_1 = EmpathyScenario.objects.create(
            title="Teammate Burnout",
            situation="Your teammate is showing signs of extreme fatigue and low morale.",
            prompt="What would you say to them?",
            difficulty="beginner",
            order=1,
            is_active=True,
        )

        self.inactive_scenario = EmpathyScenario.objects.create(
            title="Archived Scenario",
            situation="Old situation",
            prompt="Old prompt",
            is_active=False,
        )

        # 4. URLs mapping
        self.scenarios_url = reverse("echoes-of-empathy-scenarios")
        self.submit_url = reverse("echoes-of-empathy-submit")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to echoes of empathy endpoints are blocked (401 Unauthorized).
        """
        response = self.client.get(self.scenarios_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.submit_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # SCENARIOS LISTING TESTS
    # =========================================================================

    def test_get_scenarios_list_success(self):
        """
        Ensure authenticated users can retrieve active empathy scenarios.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.scenarios_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        # Should only return active scenarios (1 out of 2)
        self.assertEqual(len(response.data["scenarios"]), 1)
        self.assertEqual(response.data["scenarios"][0]["title"], "Teammate Burnout")

    # =========================================================================
    # SUBMIT & EVALUATION TESTS
    # =========================================================================

    def test_submit_response_success_and_xp_award(self):
        """
        Ensure submitting a valid response creates a session, evaluates it, and awards XP.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "scenario_id": self.scenario_1.id,
            "response": "Hey, I noticed you have been looking tired lately. Do you want to talk about it?",
        }
        response = self.client.post(self.submit_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("score", response.data)
        self.assertIn("feedback", response.data)
        self.assertEqual(response.data["xp_awarded"], 20)

        # Verify database record
        self.assertEqual(EmpathySession.objects.filter(user=self.user).count(), 1)

    def test_submit_response_missing_scenario_id(self):
        """
        Ensure submitting without scenario_id returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "response": "Valid response text but no scenario id.",
        }
        response = self.client.post(self.submit_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "scenario_id is required.")

    def test_submit_response_scenario_not_found_or_inactive(self):
        """
        Ensure submitting to a non-existent or inactive scenario returns 404 Not Found.
        """
        self.client.force_authenticate(user=self.user)
        
        # Non-existent ID
        payload = {
            "scenario_id": 9999,
            "response": "Some response text.",
        }
        response = self.client.post(self.submit_url, payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Inactive scenario ID
        payload["scenario_id"] = self.inactive_scenario.id
        response = self.client.post(self.submit_url, payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_submit_response_empty_text(self):
        """
        Ensure submitting empty response text returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "scenario_id": self.scenario_1.id,
            "response": "   ",  # Whitespace only
        }
        response = self.client.post(self.submit_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "Please provide your response.")

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_echoes_models_str_representations(self):
        """
        Ensure string representations of EmpathyScenario and EmpathySession return expected formats.
        """
        self.assertEqual(str(self.scenario_1), "Teammate Burnout")

        session = EmpathySession.objects.create(
            user=self.user,
            scenario=self.scenario_1,
            response="Sample user response",
        )
        expected_str = f"{self.user} - Teammate Burnout"
        self.assertEqual(str(session), expected_str)
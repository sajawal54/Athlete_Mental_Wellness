from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import IntegrityScenario, IntegritySession

User = get_user_model()


class IntegrityCrossroadsAPITestCase(APITestCase):
    """
    Comprehensive test suite for Integrity Crossroads Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for scenarios list and submit endpoints
    - Scenarios listing with active filtering and ordering
    - Integrity submission, choice index evaluation, session creation, and XP award integration
    - Validation checks for missing scenario_id, invalid choice_index, non-existent scenario
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
            name="Integrity Crossroads",
            slug="integrity-crossroads",
            description="Navigate ethical dilemmas and fair play",
            module_type="integrity_crossroads",
            required_xp=0,
            xp_reward=20,
            order=1,
            status="active",
        )

        # 3. Sample Integrity Scenarios
        self.scenario_1 = IntegrityScenario.objects.create(
            title="The Found Wallet",
            category="Fair Play",
            dilemma="You find a wallet full of cash on the field. What do you do?",
            choices=[
                {"text": "Return it to management", "score": 100, "values_reflection": "Honesty is vital."},
                {"text": "Keep the cash", "score": 0, "values_reflection": "That breaches trust."},
            ],
            explanation="Always strive for honesty.",
            order=1,
            is_active=True,
        )

        self.inactive_scenario = IntegrityScenario.objects.create(
            title="Inactive Dilemma",
            category="Ethics",
            dilemma="Old scenario dilemma",
            is_active=False,
        )

        # 4. URLs mapping
        self.scenarios_url = reverse("integrity-crossroads-scenarios")
        self.submit_url = reverse("integrity-crossroads-submit")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to integrity crossroads endpoints are blocked (401 Unauthorized).
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
        Ensure authenticated users can retrieve active integrity scenarios.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.scenarios_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        # Should only return active scenarios (1 out of 2)
        self.assertEqual(len(response.data["scenarios"]), 1)
        self.assertEqual(response.data["scenarios"][0]["title"], "The Found Wallet")

    # =========================================================================
    # SUBMIT & EVALUATION TESTS
    # =========================================================================

    def test_submit_integrity_choice_success_and_xp_award(self):
        """
        Ensure submitting a valid choice index evaluates score, creates session, and awards XP.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "scenario_id": self.scenario_1.id,
            "choice_index": 0,
            "reflection": "It was the right thing to do.",
        }
        response = self.client.post(self.submit_url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["score"], 100)
        self.assertEqual(response.data["xp_awarded"], 20)
        self.assertIn("session_id", response.data)

        # Verify database record
        self.assertEqual(IntegritySession.objects.filter(user=self.user).count(), 1)

    def test_submit_missing_scenario_id(self):
        """
        Ensure submitting without scenario_id returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "choice_index": 0,
        }
        response = self.client.post(self.submit_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "scenario_id is required.")

    def test_submit_invalid_choice_index(self):
        """
        Ensure submitting out-of-range or invalid choice_index returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "scenario_id": self.scenario_1.id,
            "choice_index": 99,  # Out of range index
        }
        response = self.client.post(self.submit_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "Invalid choice_index.")

    def test_submit_scenario_not_found(self):
        """
        Ensure submitting to a non-existent or inactive scenario returns 404 Not Found.
        """
        self.client.force_authenticate(user=self.user)
        
        # Non-existent ID
        payload = {
            "scenario_id": 9999,
            "choice_index": 0,
        }
        response = self.client.post(self.submit_url, payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Inactive scenario ID
        payload["scenario_id"] = self.inactive_scenario.id
        response = self.client.post(self.submit_url, payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_integrity_models_str_representations(self):
        """
        Ensure string representations of IntegrityScenario and IntegritySession return expected formats.
        """
        self.assertEqual(str(self.scenario_1), "The Found Wallet")

        session = IntegritySession.objects.create(
            user=self.user,
            scenario=self.scenario_1,
            score=100,
        )
        expected_str = f"{self.user} - The Found Wallet (100%)"
        self.assertEqual(str(session), expected_str)
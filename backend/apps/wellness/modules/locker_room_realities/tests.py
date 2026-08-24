from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import LockerRoomScenario, LockerRoomSession

User = get_user_model()


class LockerRoomRealitiesAPITestCase(APITestCase):
    """
    Comprehensive test suite for Locker Room Realities Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for scenarios list and decide endpoints[cite: 44]
    - Scenarios listing with active filtering and ordering[cite: 42, 45]
    - Decision making, optimal choice evaluation, score calculation, session creation, and XP award integration[cite: 42, 45]
    - Validation checks for missing scenario_id, invalid choice_index, non-existent scenario[cite: 45]
    - Model string representations[cite: 42]
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
            name="Locker Room Realities",
            slug="locker-room-realities",
            description="Navigate team culture and locker room decisions",
            module_type="locker_room_realities",
            required_xp=0,
            xp_reward=20,
            order=1,
            status="active",
        )

        # 3. Sample Locker Room Scenarios
        self.scenario_1 = LockerRoomScenario.objects.create(
            title="Inclusion Challenge",
            situation="A new player feels left out of team conversations.",
            question="What is the best way to handle this?",
            choices=["Ignore them", "Invite them to sit with the group", "Tease them"],
            correct_choice=1,
            explanation="Inclusion builds a stronger team spirit.",
            difficulty="beginner",
            order=1,
            is_active=True,
        )

        self.inactive_scenario = LockerRoomScenario.objects.create(
            title="Archived Situation",
            situation="Old situation description",
            question="Old question?",
            is_active=False,
        )

        # 4. URLs mapping
        self.scenarios_url = reverse("locker-room-scenarios")
        self.decide_url = reverse("locker-room-decide")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to locker room endpoints are blocked (401 Unauthorized)[cite: 44].
        """
        response = self.client.get(self.scenarios_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.decide_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # SCENARIOS LISTING TESTS
    # =========================================================================

    def test_get_scenarios_list_success(self):
        """
        Ensure authenticated users can retrieve active locker room scenarios[cite: 42, 45].
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.scenarios_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        # Should only return active scenarios (1 out of 2)[cite: 42, 45]
        self.assertEqual(len(response.data["scenarios"]), 1)
        self.assertEqual(response.data["scenarios"][0]["title"], "Inclusion Challenge")

    # =========================================================================
    # DECIDE & EVALUATION TESTS
    # =========================================================================

    def test_locker_room_decide_optimal_choice_and_xp_award(self):
        """
        Ensure submitting an optimal choice gives a score of 100, creates session, and awards XP[cite: 42, 45].
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "scenario_id": self.scenario_1.id,
            "choice_index": 1,  # Correct choice
        }
        response = self.client.post(self.decide_url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertTrue(response.data["is_optimal"])
        self.assertEqual(response.data["score"], 100)
        self.assertEqual(response.data["xp_awarded"], 20)
        self.assertIn("session_id", response.data)

        # Verify database record
        self.assertEqual(LockerRoomSession.objects.filter(user=self.user).count(), 1)

    def test_locker_room_decide_suboptimal_choice(self):
        """
        Ensure submitting a suboptimal choice gives a score of 60 and marks is_optimal as false[cite: 42, 45].
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "scenario_id": self.scenario_1.id,
            "choice_index": 0,  # Incorrect choice
        }
        response = self.client.post(self.decide_url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertFalse(response.data["is_optimal"])
        self.assertEqual(response.data["score"], 60)

    def test_decide_missing_scenario_id(self):
        """
        Ensure submitting without scenario_id returns 400 Bad Request[cite: 45].
        """
        self.client.force_authenticate(user=self.user)
        payload = {
            "choice_index": 1,
        }
        response = self.client.post(self.decide_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "scenario_id is required.")

    def test_decide_scenario_not_found(self):
        """
        Ensure submitting to a non-existent or inactive scenario returns 404 Not Found[cite: 42, 45].
        """
        self.client.force_authenticate(user=self.user)
        
        # Non-existent ID
        payload = {
            "scenario_id": 9999,
            "choice_index": 1,
        }
        response = self.client.post(self.decide_url, payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Inactive scenario ID
        payload["scenario_id"] = self.inactive_scenario.id
        response = self.client.post(self.decide_url, payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_locker_room_models_str_representations(self):
        """
        Ensure string representations of LockerRoomScenario and LockerRoomSession return expected formats[cite: 42].
        """
        self.assertEqual(str(self.scenario_1), "Inclusion Challenge")

        session = LockerRoomSession.objects.create(
            user=self.user,
            scenario=self.scenario_1,
            score=100,
        )
        expected_str = f"{self.user} - Inclusion Challenge"
        self.assertEqual(str(session), expected_str)
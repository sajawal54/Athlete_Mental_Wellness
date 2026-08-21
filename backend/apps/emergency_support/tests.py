from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    EmergencyContact,
    Counselor,
    CallbackRequest,
    CrisisInformation,
    BreathingExercise,
)


User = get_user_model()


class EmergencySupportAPITests(APITestCase):
    """
    API tests for Emergency Support application.

    Covers:
    - Emergency contacts
    - Region filtering
    - Counselors
    - Crisis information
    - Breathing exercises
    - Callback request creation
    - Callback request validation
    - Callback request history
    - Authentication protection
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPassword123",
        )

        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="TestPassword123",
        )

        self.contact_global = EmergencyContact.objects.create(
            name="Global Crisis Support",
            region="global",
            phone="+10000000000",
            website_url="https://example.com",
            description="Global emergency support.",
            is_active=True,
            order=1,
        )

        self.contact_pakistan = EmergencyContact.objects.create(
            name="Pakistan Emergency Support",
            region="pakistan",
            phone="1166",
            website_url="https://example.pk",
            description="Pakistan emergency support.",
            is_active=True,
            order=2,
        )

        self.contact_inactive = EmergencyContact.objects.create(
            name="Inactive Contact",
            region="pakistan",
            phone="999999999",
            is_active=False,
            order=3,
        )

        self.counselor = Counselor.objects.create(
            name="Dr. Test Counselor",
            specialization="Sports Psychology",
            bio="Test counselor biography.",
            availability="Mon-Fri",
            contact_email="counselor@example.com",
            is_active=True,
            order=1,
        )

        self.inactive_counselor = Counselor.objects.create(
            name="Inactive Counselor",
            specialization="General Counseling",
            is_active=False,
            order=2,
        )

        self.crisis_info = CrisisInformation.objects.create(
            title="Crisis Support Information",
            content="Please contact emergency support when required.",
            is_active=True,
            order=1,
        )

        self.inactive_crisis_info = CrisisInformation.objects.create(
            title="Inactive Crisis Information",
            content="This information should not be displayed.",
            is_active=False,
            order=2,
        )

        self.breathing_exercise = BreathingExercise.objects.create(
            title="Calm Breathing",
            description="A simple breathing exercise.",
            duration_seconds=60,
            inhale_seconds=4,
            hold_seconds=2,
            exhale_seconds=6,
            instructions="Breathe in, hold, and breathe out.",
            is_active=True,
        )

        self.inactive_breathing = BreathingExercise.objects.create(
            title="Inactive Exercise",
            description="Inactive exercise.",
            duration_seconds=30,
            inhale_seconds=3,
            hold_seconds=1,
            exhale_seconds=4,
            is_active=False,
        )

    # =========================================================
    # EMERGENCY CONTACTS
    # =========================================================

    def test_emergency_contacts_endpoint_allows_unauthenticated_users(self):
        response = self.client.get(
            reverse("emergency-contacts")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(response.data["success"])

    def test_emergency_contacts_returns_only_active_contacts(self):
        response = self.client.get(
            reverse("emergency-contacts")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        contacts = response.data["contacts"]

        names = [contact["name"] for contact in contacts]

        self.assertIn(
            "Global Crisis Support",
            names,
        )

        self.assertIn(
            "Pakistan Emergency Support",
            names,
        )

        self.assertNotIn(
            "Inactive Contact",
            names,
        )

    def test_emergency_contacts_region_filter_returns_region_and_global(self):
        response = self.client.get(
            reverse("emergency-contacts"),
            {"region": "pakistan"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        contacts = response.data["contacts"]

        names = [contact["name"] for contact in contacts]

        self.assertIn(
            "Global Crisis Support",
            names,
        )

        self.assertIn(
            "Pakistan Emergency Support",
            names,
        )

        self.assertNotIn(
            "Inactive Contact",
            names,
        )

    def test_emergency_contacts_contains_expected_fields(self):
        response = self.client.get(
            reverse("emergency-contacts")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        contact = response.data["contacts"][0]

        expected_fields = {
            "id",
            "name",
            "region",
            "phone",
            "website_url",
            "description",
            "is_active",
            "order",
        }

        self.assertEqual(
            set(contact.keys()),
            expected_fields,
        )

    # =========================================================
    # COUNSELORS
    # =========================================================

    def test_counselors_endpoint_allows_unauthenticated_users(self):
        response = self.client.get(
            reverse("emergency-counselors")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(response.data["success"])

    def test_counselors_returns_only_active_counselors(self):
        response = self.client.get(
            reverse("emergency-counselors")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        counselors = response.data["counselors"]

        names = [
            counselor["name"]
            for counselor in counselors
        ]

        self.assertIn(
            "Dr. Test Counselor",
            names,
        )

        self.assertNotIn(
            "Inactive Counselor",
            names,
        )

    # =========================================================
    # CRISIS INFORMATION
    # =========================================================

    def test_crisis_information_endpoint_allows_unauthenticated_users(self):
        response = self.client.get(
            reverse("crisis-information")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(response.data["success"])

    def test_crisis_information_returns_only_active_information(self):
        response = self.client.get(
            reverse("crisis-information")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        information = response.data["information"]

        titles = [
            item["title"]
            for item in information
        ]

        self.assertIn(
            "Crisis Support Information",
            titles,
        )

        self.assertNotIn(
            "Inactive Crisis Information",
            titles,
        )

    # =========================================================
    # BREATHING EXERCISES
    # =========================================================

    def test_breathing_exercises_endpoint_allows_unauthenticated_users(self):
        response = self.client.get(
            reverse("breathing-exercises")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(response.data["success"])

    def test_breathing_exercises_returns_only_active_exercises(self):
        response = self.client.get(
            reverse("breathing-exercises")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        exercises = response.data["exercises"]

        titles = [
            exercise["title"]
            for exercise in exercises
        ]

        self.assertIn(
            "Calm Breathing",
            titles,
        )

        self.assertNotIn(
            "Inactive Exercise",
            titles,
        )

    def test_breathing_exercise_contains_expected_values(self):
        response = self.client.get(
            reverse("breathing-exercises")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        exercise = response.data["exercises"][0]

        self.assertEqual(
            exercise["duration_seconds"],
            60,
        )

        self.assertEqual(
            exercise["inhale_seconds"],
            4,
        )

        self.assertEqual(
            exercise["hold_seconds"],
            2,
        )

        self.assertEqual(
            exercise["exhale_seconds"],
            6,
        )

    # =========================================================
    # CALLBACK REQUEST
    # =========================================================

    def test_callback_creation_requires_authentication(self):
        response = self.client.post(
            reverse("callback-request-create"),
            {
                "name": "Test User",
                "contact": "03001234567",
                "reason": "Need counselor support",
                "urgency": "normal",
                "message": "Please contact me.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_authenticated_user_can_create_callback_request(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            reverse("callback-request-create"),
            {
                "name": "  Test User  ",
                "contact": "  03001234567  ",
                "reason": "  Need counselor support  ",
                "urgency": "urgent",
                "message": "  Please contact me.  ",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertIn(
            "request",
            response.data,
        )

        callback = CallbackRequest.objects.get(
            user=self.user
        )

        self.assertEqual(
            callback.name,
            "Test User",
        )

        self.assertEqual(
            callback.contact,
            "03001234567",
        )

        self.assertEqual(
            callback.reason,
            "Need counselor support",
        )

        self.assertEqual(
            callback.urgency,
            "urgent",
        )

        self.assertEqual(
            callback.status,
            "pending",
        )

    def test_callback_creation_requires_name(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            reverse("callback-request-create"),
            {
                "name": "   ",
                "contact": "03001234567",
                "reason": "Need support",
                "urgency": "normal",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"]
        )

        self.assertIn(
            "name",
            response.data["errors"],
        )

    def test_callback_creation_requires_contact(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            reverse("callback-request-create"),
            {
                "name": "Test User",
                "contact": "   ",
                "reason": "Need support",
                "urgency": "normal",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "contact",
            response.data["errors"],
        )

    def test_callback_creation_requires_reason(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            reverse("callback-request-create"),
            {
                "name": "Test User",
                "contact": "03001234567",
                "reason": "   ",
                "urgency": "normal",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "reason",
            response.data["errors"],
        )

    def test_callback_request_defaults_to_normal_urgency(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            reverse("callback-request-create"),
            {
                "name": "Test User",
                "contact": "03001234567",
                "reason": "Need support",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        callback = CallbackRequest.objects.get(
            user=self.user
        )

        self.assertEqual(
            callback.urgency,
            "normal",
        )

    # =========================================================
    # CALLBACK HISTORY
    # =========================================================

    def test_callback_history_requires_authentication(self):
        response = self.client.get(
            reverse("callback-request-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_authenticated_user_can_view_own_callback_history(self):
        self.client.force_authenticate(
            user=self.user
        )

        CallbackRequest.objects.create(
            user=self.user,
            name="User Callback",
            contact="03001234567",
            reason="Need help",
            urgency="normal",
        )

        CallbackRequest.objects.create(
            user=self.other_user,
            name="Other User Callback",
            contact="03111234567",
            reason="Other reason",
            urgency="urgent",
        )

        response = self.client.get(
            reverse("callback-request-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        requests = response.data["requests"]

        self.assertEqual(
            len(requests),
            1,
        )

        self.assertEqual(
            requests[0]["name"],
            "User Callback",
        )

    def test_callback_history_contains_expected_fields(self):
        self.client.force_authenticate(
            user=self.user
        )

        CallbackRequest.objects.create(
            user=self.user,
            name="Test User",
            contact="03001234567",
            reason="Need support",
            urgency="immediate",
            message="Urgent request.",
        )

        response = self.client.get(
            reverse("callback-request-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        callback = response.data["requests"][0]

        expected_fields = {
            "id",
            "name",
            "contact",
            "reason",
            "urgency",
            "message",
            "status",
            "created_at",
        }

        self.assertEqual(
            set(callback.keys()),
            expected_fields,
        )
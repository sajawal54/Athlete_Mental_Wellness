from datetime import date
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

# Explicit app imports matching your project layout
from apps.accounts.models import Profile
from apps.goals.models import DailyGoal
from apps.moods.models import MoodLog

User = get_user_model()


class DashboardOverviewAPITests(APITestCase):
    """
    Test suite for the DashboardOverviewAPIView endpoint.
    Verifies authentication, empty database fallbacks, active logs tracking,
    and systemic metric computations for quick modules.
    """

    def setUp(self):
        # Maps the exact URL namespace name from your path file
        self.dashboard_url = reverse("dashboard-overview")

        # Setup base credentials for authentication testing
        self.user_data = {
            "username": "dashuser",
            "email": "dashuser@example.com",
            "password": "SecurePassword123!",
            "first_name": "Test",
            "last_name": "User",
        }
        self.user = User.objects.create_user(**self.user_data)

        # Profile is expected to be fetched or created seamlessly
        self.profile, _ = Profile.objects.get_or_create(user=self.user)
        self.profile.xp = 1500
        self.profile.level = 5
        self.profile.streak = 3
        self.profile.save()

    # ==============================================================================
    # 1. SECURITY & PERMISSION TESTS
    # ==============================================================================
    def test_dashboard_unauthenticated_blocked(self):
        """Ensures non-logged-in requests fail immediately with a 401 Unauthorized status."""
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==============================================================================
    # 2. SEED-EMPTY STATE / FALLBACK DATA TESTS
    # ==============================================================================
    def test_dashboard_authenticated_with_empty_data_fallbacks(self):
        """Verifies default structural formats when no goal or mood entries are logged."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.dashboard_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Assert structural presence of user data matching database records
        self.assertEqual(response.data["user_summary"]["username"], "dashuser")
        self.assertEqual(response.data["user_summary"]["xp"], 1500)
        self.assertEqual(response.data["user_summary"]["level"], 5)

        # Assert goal baseline values when none are present
        self.assertIsNone(response.data["todays_goal"]["id"])
        self.assertEqual(response.data["todays_goal"]["title"], "No goal created for today")
        self.assertFalse(response.data["todays_goal"]["is_completed"])

        # Assert mood checkpoint baseline indicators
        self.assertFalse(response.data["mood_summary"]["today"]["checked_in"])
        self.assertIsNone(response.data["mood_summary"]["today"]["mood"])

        # Validate baseline Quick Modules progress mapping
        self.assertEqual(response.data["quick_modules"][0]["status"], "Pending")
        self.assertEqual(response.data["quick_modules"][0]["progress"], "0%")
        self.assertEqual(response.data["quick_modules"][1]["status"], "Pending")
        self.assertEqual(response.data["quick_modules"][1]["progress"], "0%")

    # ==============================================================================
    # 3. POPULATED DATA & ACTIVE COMPUTATION TESTS
    # ==============================================================================
    def test_dashboard_populated_active_data_tracking(self):
        """Verifies parsing of active metrics when records exist for the current date."""
        self.client.force_authenticate(user=self.user)

        today_date = timezone.localdate()

        # Create active goal model instance directly tied to the current tracking date
        active_goal = DailyGoal.objects.create(
            user=self.user,
            title="Perform 20 Minutes Yoga",
            is_completed=True,
        )

        # Explicitly passing emoji and label to match expected backend mapping
        active_mood = MoodLog.objects.create(
            user=self.user,
            mood="great",
            emoji="🔥",
            energy_level=9,
            notes="Feeling highly ready",
        )

        # Query endpoint using active session state
        response = self.client.get(self.dashboard_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Assert goal retrieval calculations
        self.assertEqual(response.data["todays_goal"]["id"], active_goal.id)
        self.assertEqual(response.data["todays_goal"]["title"], "Perform 20 Minutes Yoga")
        self.assertTrue(response.data["todays_goal"]["is_completed"])

        # Assert today's explicit mood mappings
        self.assertTrue(response.data["mood_summary"]["today"]["checked_in"])
        self.assertEqual(response.data["mood_summary"]["today"]["mood"], "great")
        self.assertEqual(response.data["mood_summary"]["today"]["emoji"], "🔥")

        # Confirm chronological order of trends block tracking
        self.assertGreaterEqual(len(response.data["mood_summary"]["trend"]), 1)
        self.assertEqual(response.data["mood_summary"]["trend"][0]["mood"], "great")

        # Validate status logic calculation updates on modules arrays
        self.assertEqual(response.data["quick_modules"][0]["status"], "Completed")
        self.assertEqual(response.data["quick_modules"][0]["progress"], "100%")
        self.assertEqual(response.data["quick_modules"][1]["status"], "Completed")
        self.assertEqual(response.data["quick_modules"][1]["progress"], "100%")

    # ==============================================================================
    # 4. TREND LENGTH LIMIT LIMITATION TEST
    # ==============================================================================
    def test_dashboard_mood_trend_max_slicing_limit(self):
        """Validates that history slicing restricts outputs to 5 objects ordered correctly."""
        self.client.force_authenticate(user=self.user)

        # Seed 7 history items inside the database layer
        moods_pool = ["exhausted", "anxious", "neutral", "good", "great", "good", "great"]
        for mood_type in moods_pool:
            MoodLog.objects.create(user=self.user, mood=mood_type, emoji="🔥")

        response = self.client.get(self.dashboard_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Slicing pattern must cap the total length at exactly 5 instances max
        self.assertEqual(len(response.data["mood_summary"]["trend"]), 5)
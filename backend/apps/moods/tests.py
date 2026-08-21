from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Profile
from .models import MoodLog
from .serializers import MoodLogSerializer

User = get_user_model()


class MoodLogAPITestCase(APITestCase):
    """
    Comprehensive test suite for Mood Log Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks
    - Mood log creation (with Profile XP/Streak progression & AI messages)
    - One check-in per day restriction logic
    - Energy level validation
    - Detail deletion & Bulk history clear endpoints
    - User data isolation
    """

    def setUp(self):
        # 1. Primary User setup
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
            first_name="Sajawal",
            last_name="Khan",
        )

        # 2. Secondary User setup (for isolation testing)
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="otheruser@example.com",
            password="StrongPassword123!",
        )

        # 3. Profile associated with user
        self.profile, _ = Profile.objects.get_or_create(user=self.user)

        # 4. API Endpoints Setup
        self.list_create_url = reverse("mood-list-create")
        self.clear_history_url = reverse("delete-mood")

    # AUTHENTICATION TESTS

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests are blocked across all mood endpoints.
        """
        # GET List
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # POST Create
        response = self.client.post(self.list_create_url, {"mood": "great"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # DELETE Clear History
        response = self.client.delete(self.clear_history_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # LIST & GET TESTS

    def test_get_mood_logs_list_success_and_paginated(self):
        """
        Ensure authenticated users retrieve only their own mood logs ordered by created_at descending.
        """
        self.client.force_authenticate(user=self.user)

        now = timezone.now()

        # Create logs for user
        log1 = MoodLog.objects.create(user=self.user, mood="great", energy_level=5)
        log2 = MoodLog.objects.create(user=self.user, mood="good", energy_level=4)
        log3 = MoodLog.objects.create(user=self.user, mood="neutral", energy_level=3)

        # Explicitly set distinct timestamps to avoid microsecond collision in tests
        MoodLog.objects.filter(pk=log1.pk).update(created_at=now - timezone.timedelta(hours=2))
        MoodLog.objects.filter(pk=log2.pk).update(created_at=now - timezone.timedelta(hours=1))
        MoodLog.objects.filter(pk=log3.pk).update(created_at=now)

        # Other user log (should not leak)
        MoodLog.objects.create(user=self.other_user, mood="exhausted", energy_level=1)

        response = self.client.get(self.list_create_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check pagination structure
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 3)
        # Page size is 2 according to MoodPagination
        self.assertEqual(len(response.data["results"]), 2)
        # Ensure ordering (-created_at)
        self.assertEqual(response.data["results"][0]["id"], log3.id)

    # SERIALIZER VALIDATION TESTS

    def test_energy_level_validation(self):
        """
        Ensure serializer enforces energy level boundaries (1 to 5).
        """
        # Test lower bound violation
        invalid_low = MoodLogSerializer(data={"mood": "good", "energy_level": 0})
        self.assertFalse(invalid_low.is_valid())
        self.assertIn("energy_level", invalid_low.errors)

        # Test upper bound violation
        invalid_high = MoodLogSerializer(data={"mood": "good", "energy_level": 6})
        self.assertFalse(invalid_high.is_valid())
        self.assertIn("energy_level", invalid_high.errors)

        # Test valid energy level
        valid_data = MoodLogSerializer(data={"mood": "good", "energy_level": 4})
        self.assertTrue(valid_data.is_valid())

    # CREATE MOOD LOG & REWARDS TESTS

    @patch.object(Profile, "update_streak")
    @patch.object(Profile, "add_xp")
    def test_create_mood_log_success_and_awards_xp(self, mock_add_xp, mock_update_streak):
        """
        Ensure mood log creation saves record, triggers profile rewards, and returns AI message.
        """
        self.client.force_authenticate(user=self.user)

        payload = {
            "mood": "great",
            "emoji": "🔥",
            "energy_level": 5,
            "notes": "Had a super productive coding day!",
        }

        response = self.client.post(self.list_create_url, data=payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["mood"], "great")
        self.assertEqual(response.data["user"], self.user.username)
        self.assertIn("Fantastic energy!", response.data["ai_message"])
        self.assertEqual(response.data["xp_gained"], 120)

        # Verify DB
        self.assertTrue(MoodLog.objects.filter(user=self.user, mood="great").exists())

        # Verify profile method calls
        mock_add_xp.assert_called_once_with(120)
        mock_update_streak.assert_called_once_with(timezone.localdate())

    def test_duplicate_check_in_same_day_fails(self):
        """
        Ensure user cannot submit more than one mood log on the same calendar date.
        """
        self.client.force_authenticate(user=self.user)

        # First check-in today
        MoodLog.objects.create(
            user=self.user,
            mood="good",
            created_at=timezone.now(),
        )

        # Attempt second check-in today
        payload = {"mood": "great", "energy_level": 4}
        response = self.client.post(self.list_create_url, data=payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertEqual(
            response.data["error"],
            "You have already completed your daily mood check-in for today!",
        )

    # DELETE SINGLE LOG & CLEAR HISTORY TESTS

    def test_delete_single_mood_log_success(self):
        """
        Ensure user can delete a specific mood log owned by them.
        """
        self.client.force_authenticate(user=self.user)
        log = MoodLog.objects.create(user=self.user, mood="anxious")

        delete_url = reverse("mood-delete", kwargs={"pk": log.pk})
        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MoodLog.objects.filter(pk=log.pk).exists())

    def test_delete_other_user_mood_log_fails(self):
        """
        Ensure user cannot delete a mood log belonging to another user (Returns 404).
        """
        self.client.force_authenticate(user=self.user)
        other_log = MoodLog.objects.create(user=self.other_user, mood="anxious")

        delete_url = reverse("mood-delete", kwargs={"pk": other_log.pk})
        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(MoodLog.objects.filter(pk=other_log.pk).exists())

    def test_clear_mood_history_success(self):
        """
        Ensure MoodHistoryClearView deletes all mood logs of the authenticated user only.
        """
        self.client.force_authenticate(user=self.user)

        # Create logs for both users
        MoodLog.objects.create(user=self.user, mood="great")
        MoodLog.objects.create(user=self.user, mood="good")
        other_log = MoodLog.objects.create(user=self.other_user, mood="exhausted")

        response = self.client.delete(self.clear_history_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Check primary user logs are wiped
        self.assertEqual(MoodLog.objects.filter(user=self.user).count(), 0)
        # Check other user log remains intact
        self.assertTrue(MoodLog.objects.filter(pk=other_log.pk).exists())

    # MODEL STR REPRESENTATION TEST

    def test_mood_log_str_representation(self):
        """
        Ensure string representation of MoodLog model returns expected string.
        """
        log = MoodLog.objects.create(user=self.user, mood="anxious")
        expected_str = f"{self.user.username} - anxious"
        self.assertEqual(str(log), expected_str)
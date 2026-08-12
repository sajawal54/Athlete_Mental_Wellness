from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Profile
from .models import DailyGoal

User = get_user_model()


class DailyGoalAPITestCase(APITestCase):
    """
    Comprehensive test suite for Daily Goal Endpoints:
    - List & Create Daily Goals
    - Toggle Goal Completion & XP calculations
    - Delete Daily Goals
    """

    def setUp(self):
        # 1. Primary Test User
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
            first_name="Sajawal",
            last_name="Khan",
        )

        # 2. Other User (for permission/isolation testing)
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="StrongPassword123!",
        )

        # 3. Profile Setup
        self.profile, _ = Profile.objects.get_or_create(user=self.user)

        # 4. Endpoints Setup
        self.list_create_url = reverse("daily-goals-list-create")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_fails(self):
        """
        Ensure unauthenticated requests receive 401 Unauthorized across all endpoints.
        """
        # GET List
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # POST Create
        response = self.client.post(self.list_create_url, {"title": "Test Goal"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # LIST & CREATE TESTS
    # =========================================================================

    def test_get_daily_goals_list_success(self):
        """
        Ensure user can retrieve goals created today and isolated from other users.
        """
        self.client.force_authenticate(user=self.user)
        today = timezone.localdate()

        # Today's Goal for Primary User
        goal1 = DailyGoal.objects.create(
            user=self.user,
            title="Read 10 pages",
            category="Mindfulness",
            created_at=today,
        )

        # Other User's Goal
        DailyGoal.objects.create(
            user=self.other_user,
            title="Other User Goal",
            created_at=today,
        )

        response = self.client.get(self.list_create_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], goal1.id)
        self.assertEqual(response.data[0]["title"], "Read 10 pages")

    def test_create_daily_goal_success(self):
        """
        Ensure user can successfully create a new goal.
        """
        self.client.force_authenticate(user=self.user)

        payload = {
            "title": "Morning Hydration",
            "category": "Recovery",
            "points": 15,
        }

        response = self.client.post(self.list_create_url, data=payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Morning Hydration")
        self.assertEqual(response.data["category"], "Recovery")
        self.assertFalse(response.data["is_completed"])

        # DB Check
        self.assertTrue(DailyGoal.objects.filter(user=self.user, title="Morning Hydration").exists())

    def test_create_daily_goal_validation_error(self):
        """
        Ensure validation fails when required fields are missing.
        """
        self.client.force_authenticate(user=self.user)

        # Empty payload
        response = self.client.post(self.list_create_url, data={})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    # =========================================================================
    # TOGGLE & XP REWARD TESTS
    # =========================================================================

    def test_toggle_goal_completion_rewards_xp(self):
        """
        Ensure completing an incomplete goal toggles state to True and adds 100 XP.
        """
        self.client.force_authenticate(user=self.user)

        goal = DailyGoal.objects.create(
            user=self.user,
            title="Meditate 10 mins",
            is_completed=False,
        )

        toggle_url = reverse("daily-goal-toggle", kwargs={"pk": goal.pk})

        initial_xp = self.profile.xp

        # First Toggle: Incomplete -> Complete
        response = self.client.patch(toggle_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_completed"])
        self.assertEqual(response.data["xp_gained"], 100)
        self.assertEqual(response.data["new_total_xp"], initial_xp + 100)

        # DB Verification
        goal.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertTrue(goal.is_completed)
        self.assertEqual(self.profile.xp, initial_xp + 100)

    def test_untoggle_goal_reverts_xp(self):
        """
        Ensure untoggling a completed goal toggles state to False and subtracts 100 XP.
        """
        self.client.force_authenticate(user=self.user)

        # Set initial profile XP
        self.profile.xp = 200
        self.profile.save()

        goal = DailyGoal.objects.create(
            user=self.user,
            title="Evening Walk",
            is_completed=True,
        )

        toggle_url = reverse("daily-goal-toggle", kwargs={"pk": goal.pk})

        # Second Toggle: Complete -> Incomplete
        response = self.client.patch(toggle_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_completed"])
        self.assertEqual(response.data["xp_gained"], -100)
        self.assertEqual(response.data["new_total_xp"], 100)

        # DB Verification
        goal.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertFalse(goal.is_completed)
        self.assertEqual(self.profile.xp, 100)

    def test_toggle_other_user_goal_fails(self):
        """
        Ensure user cannot toggle another user's goal (404 Not Found).
        """
        self.client.force_authenticate(user=self.user)

        other_goal = DailyGoal.objects.create(
            user=self.other_user,
            title="Secret Goal",
        )

        toggle_url = reverse("daily-goal-toggle", kwargs={"pk": other_goal.pk})

        response = self.client.patch(toggle_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Goal not found")

    # =========================================================================
    # DELETE TESTS
    # =========================================================================

    def test_delete_goal_success(self):
        """
        Ensure user can delete their own daily goal.
        """
        self.client.force_authenticate(user=self.user)

        goal = DailyGoal.objects.create(
            user=self.user,
            title="Goal To Delete",
        )

        delete_url = reverse("daily-goal-delete", kwargs={"pk": goal.pk})

        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(DailyGoal.objects.filter(pk=goal.pk).exists())

    def test_delete_other_user_goal_fails(self):
        """
        Ensure user cannot delete another user's goal.
        """
        self.client.force_authenticate(user=self.user)

        other_goal = DailyGoal.objects.create(
            user=self.other_user,
            title="Protected Goal",
        )

        delete_url = reverse("daily-goal-delete", kwargs={"pk": other_goal.pk})

        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(DailyGoal.objects.filter(pk=other_goal.pk).exists())
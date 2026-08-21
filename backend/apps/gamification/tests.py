
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Profile
from apps.goals.models import DailyGoal
from apps.moods.models import MoodLog

from .models import (
    XPHistory,
    Badge,
    UserBadge,
    Reward,
    UserReward,
)
from .service import (
    award_xp,
    award_badge,
    check_and_award_badges,
    claim_reward,
    redeem_reward,
)


User = get_user_model()


class GamificationAPITestCase(APITestCase):
    """
    Complete API and service tests for the Gamification app.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="TestPassword123!",
        )

        self.other_user = User.objects.create_user(
            username="otheruser",
            email="otheruser@example.com",
            password="TestPassword123!",
        )

        self.profile = Profile.objects.get_or_create(
            user=self.user
        )[0]

        self.profile.xp = 100
        self.profile.level = 1
        self.profile.streak = 0
        self.profile.save()

        self.other_profile = Profile.objects.get_or_create(
            user=self.other_user
        )[0]

        self.other_profile.xp = 100
        self.other_profile.level = 1
        self.other_profile.streak = 0
        self.other_profile.save()

        self.badge = Badge.objects.create(
            name="XP Starter",
            description="Awarded for earning XP.",
            category="xp",
            requirement_value=100,
            icon="star",
        )

        self.streak_badge = Badge.objects.create(
            name="Streak Starter",
            description="Awarded for maintaining a streak.",
            category="streak",
            requirement_value=3,
            icon="fire",
        )

        self.goal_badge = Badge.objects.create(
            name="Goal Crusher",
            description="Awarded for completing goals.",
            category="goals",
            requirement_value=2,
            icon="target",
        )

        self.mood_badge = Badge.objects.create(
            name="Mood Tracker",
            description="Awarded for tracking moods.",
            category="mood",
            requirement_value=2,
            icon="heart",
        )

        self.active_reward = Reward.objects.create(
            name="Premium Theme",
            description="Unlock a premium theme.",
            xp_cost=50,
            is_active=True,
        )

        self.expensive_reward = Reward.objects.create(
            name="Expensive Reward",
            description="A reward requiring lots of XP.",
            xp_cost=1000,
            is_active=True,
        )

        self.inactive_reward = Reward.objects.create(
            name="Inactive Reward",
            description="This reward is unavailable.",
            xp_cost=20,
            is_active=False,
        )

        self.xp_history = XPHistory.objects.create(
            user=self.user,
            amount=25,
            source="test",
            description="Test XP entry",
        )

        self.client.force_authenticate(user=self.user)

    # =========================================================
    # XP HISTORY
    # =========================================================

    def test_xp_history_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("xp-history")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_xp_history_returns_only_current_users_history(self):
        XPHistory.objects.create(
            user=self.other_user,
            amount=999,
            source="other_user",
            description="Should not be visible",
        )

        response = self.client.get(
            reverse("xp-history")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertEqual(
            response.data["results"][0]["amount"],
            25,
        )

    # =========================================================
    # BADGES
    # =========================================================

    def test_badges_list_returns_all_badges(self):
        response = self.client.get(
            reverse("badge-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            4,
        )

    def test_my_badges_returns_only_current_users_badges(self):
        UserBadge.objects.create(
            user=self.user,
            badge=self.badge,
        )

        UserBadge.objects.create(
            user=self.other_user,
            badge=self.streak_badge,
        )

        response = self.client.get(
            reverse("my-badges")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]["badge_name"],
            "XP Starter",
        )

    # =========================================================
    # REWARDS
    # =========================================================

    def test_rewards_returns_only_active_rewards(self):
        response = self.client.get(
            reverse("reward-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        reward_names = [
            reward["name"]
            for reward in response.data
        ]

        self.assertIn(
            "Premium Theme",
            reward_names,
        )

        self.assertIn(
            "Expensive Reward",
            reward_names,
        )

        self.assertNotIn(
            "Inactive Reward",
            reward_names,
        )

    def test_my_rewards_returns_only_current_users_rewards(self):
        UserReward.objects.create(
            user=self.user,
            reward=self.active_reward,
            status="claimed",
            claimed_at=timezone.now(),
        )

        UserReward.objects.create(
            user=self.other_user,
            reward=self.expensive_reward,
            status="claimed",
            claimed_at=timezone.now(),
        )

        response = self.client.get(
            reverse("my-rewards")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]["reward_name"],
            "Premium Theme",
        )

    # =========================================================
    # GAMIFICATION OVERVIEW
    # =========================================================

    def test_gamification_overview_returns_expected_sections(self):
        UserBadge.objects.create(
            user=self.user,
            badge=self.badge,
        )

        UserReward.objects.create(
            user=self.user,
            reward=self.active_reward,
            status="claimed",
            claimed_at=timezone.now(),
        )

        response = self.client.get(
            reverse("gamification-overview")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "profile",
            response.data,
        )

        self.assertIn(
            "xp_history",
            response.data,
        )

        self.assertIn(
            "badges",
            response.data,
        )

        self.assertIn(
            "earned_badges",
            response.data,
        )

        self.assertIn(
            "rewards",
            response.data,
        )

        self.assertIn(
            "user_rewards",
            response.data,
        )

    def test_gamification_overview_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("gamification-overview")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # =========================================================
    # CLAIM REWARD API
    # =========================================================

    def test_claim_reward_successfully(self):
        self.profile.xp = 100
        self.profile.save()

        response = self.client.post(
            reverse(
                "claim-reward",
                kwargs={
                    "reward_id": self.active_reward.id
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertEqual(
            response.data["xp_spent"],
            50,
        )

        self.profile.refresh_from_db()

        self.assertEqual(
            self.profile.xp,
            50,
        )

        user_reward = UserReward.objects.get(
            user=self.user,
            reward=self.active_reward,
        )

        self.assertEqual(
            user_reward.status,
            "claimed",
        )

        self.assertTrue(
            XPHistory.objects.filter(
                user=self.user,
                amount=-50,
                source="reward_claim",
            ).exists()
        )

    def test_claim_reward_fails_when_reward_is_inactive(self):
        response = self.client.post(
            reverse(
                "claim-reward",
                kwargs={
                    "reward_id": self.inactive_reward.id
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_claim_reward_fails_when_user_has_insufficient_xp(self):
        self.profile.xp = 10
        self.profile.save()

        response = self.client.post(
            reverse(
                "claim-reward",
                kwargs={
                    "reward_id": self.expensive_reward.id
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"]
        )

        self.assertEqual(
            response.data["message"],
            "You do not have enough XP.",
        )

    def test_claim_reward_cannot_be_claimed_twice(self):
        self.profile.xp = 200
        self.profile.save()

        first_response = self.client.post(
            reverse(
                "claim-reward",
                kwargs={
                    "reward_id": self.active_reward.id
                },
            )
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_200_OK,
        )

        second_response = self.client.post(
            reverse(
                "claim-reward",
                kwargs={
                    "reward_id": self.active_reward.id
                },
            )
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            second_response.data["success"]
        )

    def test_claim_reward_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            reverse(
                "claim-reward",
                kwargs={
                    "reward_id": self.active_reward.id
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # =========================================================
    # AWARD BADGE SERVICE
    # =========================================================

    def test_award_badge_successfully(self):
        result = award_badge(
            self.user,
            self.streak_badge,
        )

        self.assertTrue(
            result["success"]
        )

        self.assertEqual(
            result["message"],
            "Badge awarded successfully.",
        )

        self.assertTrue(
            UserBadge.objects.filter(
                user=self.user,
                badge=self.streak_badge,
            ).exists()
        )

    def test_award_badge_does_not_duplicate_badge(self):
        UserBadge.objects.create(
            user=self.user,
            badge=self.badge,
        )

        result = award_badge(
            self.user,
            self.badge,
        )

        self.assertFalse(
            result["success"]
        )

        self.assertEqual(
            result["message"],
            "User already has this badge.",
        )

        self.assertEqual(
            UserBadge.objects.filter(
                user=self.user,
                badge=self.badge,
            ).count(),
            1,
        )

    # =========================================================
    # CHECK AND AWARD BADGES
    # =========================================================

    def test_xp_badge_is_awarded_when_requirement_is_reached(self):
        self.profile.xp = 100
        self.profile.save()

        awarded_badges = check_and_award_badges(
            self.user
        )

        awarded_names = [
            badge.name
            for badge in awarded_badges
        ]

        self.assertIn(
            "XP Starter",
            awarded_names,
        )

        self.assertTrue(
            UserBadge.objects.filter(
                user=self.user,
                badge=self.badge,
            ).exists()
        )

    def test_streak_badge_is_awarded_when_requirement_is_reached(self):
        self.profile.streak = 3
        self.profile.save()

        awarded_badges = check_and_award_badges(
            self.user
        )

        awarded_names = [
            badge.name
            for badge in awarded_badges
        ]

        self.assertIn(
            "Streak Starter",
            awarded_names,
        )

    def test_goal_badge_is_awarded_when_requirement_is_reached(self):
        DailyGoal.objects.create(
            user=self.user,
            title="Goal One",
            is_completed=True,
        )

        DailyGoal.objects.create(
            user=self.user,
            title="Goal Two",
            is_completed=True,
        )

        awarded_badges = check_and_award_badges(
            self.user
        )

        awarded_names = [
            badge.name
            for badge in awarded_badges
        ]

        self.assertIn(
            "Goal Crusher",
            awarded_names,
        )

    def test_mood_badge_is_awarded_when_requirement_is_reached(self):
        MoodLog.objects.create(
            user=self.user,
        )

        MoodLog.objects.create(
            user=self.user,
        )

        awarded_badges = check_and_award_badges(
            self.user
        )

        awarded_names = [
            badge.name
            for badge in awarded_badges
        ]

        self.assertIn(
            "Mood Tracker",
            awarded_names,
        )

    # =========================================================
    # AWARD XP SERVICE
    # =========================================================

    @patch(
        "apps.gamification.service.create_level_notification"
    )
    @patch(
        "apps.gamification.service.create_achievement_notification"
    )
    def test_award_xp_creates_history_and_updates_profile(
        self,
        mock_achievement_notification,
        mock_level_notification,
    ):
        self.profile.xp = 0
        self.profile.level = 1
        self.profile.save()

        result = award_xp(
            user=self.user,
            amount=25,
            source="test",
            description="Test XP award",
        )

        self.profile.refresh_from_db()

        self.assertEqual(
            self.profile.xp,
            25,
        )

        self.assertEqual(
            result["xp"],
            25,
        )

        self.assertTrue(
            XPHistory.objects.filter(
                user=self.user,
                amount=25,
                source="test",
                description="Test XP award",
            ).exists()
        )

        mock_achievement_notification.assert_not_called()

    @patch(
        "apps.gamification.service.create_level_notification"
    )
    @patch(
        "apps.gamification.service.create_achievement_notification"
    )
    def test_award_xp_can_trigger_achievement_notification(
        self,
        mock_achievement_notification,
        mock_level_notification,
    ):
        self.profile.xp = 0
        self.profile.level = 1
        self.profile.save()

        result = award_xp(
            user=self.user,
            amount=100,
            source="test",
            description="XP badge test",
        )

        self.assertTrue(
            len(result["new_badges"]) >= 1
        )

        mock_achievement_notification.assert_called()

    # =========================================================
    # REDEEM REWARD SERVICE
    # =========================================================

    def test_redeem_claimed_reward_successfully(self):
        user_reward = UserReward.objects.create(
            user=self.user,
            reward=self.active_reward,
            status="claimed",
            claimed_at=timezone.now(),
        )

        result = redeem_reward(
            self.user,
            user_reward,
        )

        user_reward.refresh_from_db()

        self.assertTrue(
            result["success"]
        )

        self.assertEqual(
            result["message"],
            "Reward redeemed successfully.",
        )

        self.assertEqual(
            user_reward.status,
            "redeemed",
        )

        self.assertIsNotNone(
            user_reward.redeemed_at
        )

    def test_redeem_reward_fails_when_not_claimed(self):
        user_reward = UserReward.objects.create(
            user=self.user,
            reward=self.active_reward,
            status="available",
        )

        result = redeem_reward(
            self.user,
            user_reward,
        )

        self.assertFalse(
            result["success"]
        )

        self.assertEqual(
            result["message"],
            "Only claimed rewards can be redeemed.",
        )

        user_reward.refresh_from_db()

        self.assertEqual(
            user_reward.status,
            "available",
        )

    def test_redeem_reward_cannot_redeem_another_users_reward(self):
        user_reward = UserReward.objects.create(
            user=self.other_user,
            reward=self.active_reward,
            status="claimed",
            claimed_at=timezone.now(),
        )

        with self.assertRaises(
            UserReward.DoesNotExist
        ):
            redeem_reward(
                self.user,
                user_reward,
            )

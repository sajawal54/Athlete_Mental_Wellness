from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    Notification,
    NotificationPreference,
)
from .services import (
    get_notification_preferences,
    is_notification_allowed,
    create_notification,
    create_achievement_notification,
    create_level_notification,
    create_streak_notification,
    create_mood_notification,
    create_goal_notification,
    create_wellness_notification,
    create_support_notification,
    create_security_notification,
)

User = get_user_model()


class NotificationTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPassword123!",
        )

        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="TestPassword123!",
        )

        self.client.force_authenticate(
            user=self.user
        )

    # =========================================================
    # PREFERENCES
    # =========================================================

    def test_notification_preferences_created_automatically(self):
        response = self.client.get(
            reverse("notification-preferences")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["notifications_enabled"]
        )

        self.assertTrue(
            NotificationPreference.objects.filter(
                user=self.user
            ).exists()
        )

    def test_notification_preferences_patch(self):
        response = self.client.patch(
            reverse("notification-preferences"),
            {
                "goal_reminders": False,
                "wellness_updates": False,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            response.data["goal_reminders"]
        )

        self.assertFalse(
            response.data["wellness_updates"]
        )

        preferences = NotificationPreference.objects.get(
            user=self.user
        )

        self.assertFalse(
            preferences.goal_reminders
        )

        self.assertFalse(
            preferences.wellness_updates
        )

    # =========================================================
    # NOTIFICATION ALLOWED
    # =========================================================

    def test_notification_allowed_by_default(self):
        self.assertTrue(
            is_notification_allowed(
                self.user,
                "goal",
            )
        )

        self.assertTrue(
            is_notification_allowed(
                self.user,
                "wellness",
            )
        )

        self.assertTrue(
            is_notification_allowed(
                self.user,
                "achievement",
            )
        )

        self.assertTrue(
            is_notification_allowed(
                self.user,
                "security",
            )
        )

        self.assertTrue(
            is_notification_allowed(
                self.user,
                "support",
            )
        )

    def test_master_switch_blocks_optional_notifications(self):
        NotificationPreference.objects.create(
            user=self.user,
            notifications_enabled=False,
        )

        self.assertFalse(
            is_notification_allowed(
                self.user,
                "goal",
            )
        )

        self.assertFalse(
            is_notification_allowed(
                self.user,
                "wellness",
            )
        )

        self.assertFalse(
            is_notification_allowed(
                self.user,
                "achievement",
            )
        )

    def test_goal_preference_blocks_goal_notification(self):
        NotificationPreference.objects.create(
            user=self.user,
            goal_reminders=False,
        )

        self.assertFalse(
            is_notification_allowed(
                self.user,
                "goal",
            )
        )

    def test_wellness_preference_blocks_wellness_notification(self):
        NotificationPreference.objects.create(
            user=self.user,
            wellness_updates=False,
        )

        self.assertFalse(
            is_notification_allowed(
                self.user,
                "wellness",
            )
        )

    def test_achievement_preference_blocks_achievement_and_streak(self):
        NotificationPreference.objects.create(
            user=self.user,
            achievement_updates=False,
        )

        self.assertFalse(
            is_notification_allowed(
                self.user,
                "achievement",
            )
        )

        self.assertFalse(
            is_notification_allowed(
                self.user,
                "streak",
            )
        )

    def test_security_preference_blocks_security_notification(self):
        NotificationPreference.objects.create(
            user=self.user,
            security_notifications=False,
        )

        self.assertFalse(
            is_notification_allowed(
                self.user,
                "security",
            )
        )

    def test_support_mood_system_remain_allowed(self):
        NotificationPreference.objects.create(
            user=self.user,
            notifications_enabled=True,
        )

        self.assertTrue(
            is_notification_allowed(
                self.user,
                "support",
            )
        )

        self.assertTrue(
            is_notification_allowed(
                self.user,
                "mood",
            )
        )

        self.assertTrue(
            is_notification_allowed(
                self.user,
                "system",
            )
        )

    # =========================================================
    # CREATE NOTIFICATION SERVICE
    # =========================================================

    def test_create_notification_successfully(self):
        notification = create_notification(
            user=self.user,
            title="Test Notification",
            message="Test message",
            notification_type="system",
        )

        self.assertIsNotNone(
            notification
        )

        self.assertEqual(
            notification.user,
            self.user,
        )

        self.assertEqual(
            notification.title,
            "Test Notification",
        )

        self.assertFalse(
            notification.is_read
        )

    def test_create_notification_returns_none_when_disabled(self):
        NotificationPreference.objects.create(
            user=self.user,
            goal_reminders=False,
        )

        notification = create_notification(
            user=self.user,
            title="Goal Reminder",
            message="Complete your goal.",
            notification_type="goal",
        )

        self.assertIsNone(
            notification
        )

        self.assertFalse(
            Notification.objects.filter(
                user=self.user,
                title="Goal Reminder",
            ).exists()
        )

    # =========================================================
    # NOTIFICATION HELPER SERVICES
    # =========================================================

    def test_create_achievement_notification(self):
        notification = create_achievement_notification(
            user=self.user,
            title="New Achievement",
            message="You earned a badge.",
        )

        self.assertEqual(
            notification.notification_type,
            "achievement",
        )

        self.assertEqual(
            notification.icon,
            "trophy",
        )

        self.assertEqual(
            notification.action_url,
            "/trophy-room",
        )

    def test_create_level_notification(self):
        notification = create_level_notification(
            user=self.user,
            new_level=5,
        )

        self.assertEqual(
            notification.title,
            "Level Up!",
        )

        self.assertIn(
            "Level 5",
            notification.message,
        )

        self.assertEqual(
            notification.notification_type,
            "achievement",
        )

    def test_create_streak_notification(self):
        notification = create_streak_notification(
            user=self.user,
            streak=7,
        )

        self.assertEqual(
            notification.notification_type,
            "streak",
        )

        self.assertIn(
            "7 days",
            notification.message,
        )

        self.assertEqual(
            notification.icon,
            "fire",
        )

    def test_create_mood_notification(self):
        notification = create_mood_notification(
            user=self.user
        )

        self.assertEqual(
            notification.notification_type,
            "mood",
        )

        self.assertEqual(
            notification.action_url,
            "/mood-checkin",
        )

    def test_create_goal_notification(self):
        notification = create_goal_notification(
            user=self.user
        )

        self.assertEqual(
            notification.notification_type,
            "goal",
        )

        self.assertEqual(
            notification.action_url,
            "/goals",
        )

    def test_create_wellness_notification(self):
        notification = create_wellness_notification(
            user=self.user,
            title="Wellness Update",
            message="New wellness module available.",
        )

        self.assertEqual(
            notification.notification_type,
            "wellness",
        )

        self.assertEqual(
            notification.icon,
            "wellness",
        )

    def test_create_support_notification(self):
        notification = create_support_notification(
            user=self.user,
            title="Support Update",
            message="A counselor has responded.",
        )

        self.assertEqual(
            notification.notification_type,
            "support",
        )

        self.assertEqual(
            notification.priority,
            "high",
        )

    def test_create_security_notification(self):
        notification = create_security_notification(
            user=self.user,
            title="Security Alert",
            message="Your password was changed.",
        )

        self.assertEqual(
            notification.notification_type,
            "security",
        )

        self.assertEqual(
            notification.priority,
            "high",
        )

    # =========================================================
    # LIST NOTIFICATIONS
    # =========================================================

    def test_notification_list_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("notification-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_notification_list_returns_current_users_notifications(self):
        Notification.objects.create(
            user=self.user,
            title="My Notification",
            message="My message",
            notification_type="system",
        )

        Notification.objects.create(
            user=self.other_user,
            title="Other Notification",
            message="Other message",
            notification_type="system",
        )

        response = self.client.get(
            reverse("notification-list")
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
            response.data["unread_count"],
            1,
        )

    def test_notification_list_filters_by_type(self):
        Notification.objects.create(
            user=self.user,
            title="Goal",
            message="Goal message",
            notification_type="goal",
        )

        Notification.objects.create(
            user=self.user,
            title="Mood",
            message="Mood message",
            notification_type="mood",
        )

        response = self.client.get(
            reverse("notification-list"),
            {"type": "goal"},
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
            response.data["results"][0]["notification_type"],
            "goal",
        )

    def test_notification_list_filters_unread(self):
        Notification.objects.create(
            user=self.user,
            title="Unread",
            message="Unread message",
            notification_type="system",
            is_read=False,
        )

        Notification.objects.create(
            user=self.user,
            title="Read",
            message="Read message",
            notification_type="system",
            is_read=True,
            read_at=timezone.now(),
        )

        response = self.client.get(
            reverse("notification-list"),
            {"unread": "true"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertFalse(
            response.data["results"][0]["is_read"]
        )

    # =========================================================
    # UNREAD COUNT
    # =========================================================

    def test_unread_count(self):
        Notification.objects.create(
            user=self.user,
            title="Unread 1",
            message="Message",
            notification_type="system",
        )

        Notification.objects.create(
            user=self.user,
            title="Unread 2",
            message="Message",
            notification_type="system",
        )

        Notification.objects.create(
            user=self.user,
            title="Read",
            message="Message",
            notification_type="system",
            is_read=True,
            read_at=timezone.now(),
        )

        response = self.client.get(
            reverse("notification-unread-count")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["unread_count"],
            2,
        )

    # =========================================================
    # MARK READ
    # =========================================================

    def test_mark_notification_read(self):
        notification = Notification.objects.create(
            user=self.user,
            title="Test",
            message="Test message",
            notification_type="system",
        )

        response = self.client.patch(
            reverse(
                "notification-mark-read",
                kwargs={
                    "notification_id": notification.id,
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        notification.refresh_from_db()

        self.assertTrue(
            notification.is_read
        )

        self.assertIsNotNone(
            notification.read_at
        )

        self.assertEqual(
            response.data["unread_count"],
            0,
        )

    def test_mark_nonexistent_notification_returns_404(self):
        response = self.client.patch(
            reverse(
                "notification-mark-read",
                kwargs={
                    "notification_id": 999999,
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_user_cannot_mark_other_users_notification(self):
        notification = Notification.objects.create(
            user=self.other_user,
            title="Other",
            message="Other message",
            notification_type="system",
        )

        response = self.client.patch(
            reverse(
                "notification-mark-read",
                kwargs={
                    "notification_id": notification.id,
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    # =========================================================
    # MARK ALL READ
    # =========================================================

    def test_mark_all_notifications_read(self):
        Notification.objects.create(
            user=self.user,
            title="Unread 1",
            message="Message",
            notification_type="system",
        )

        Notification.objects.create(
            user=self.user,
            title="Unread 2",
            message="Message",
            notification_type="system",
        )

        response = self.client.patch(
            reverse("notification-mark-all-read")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["updated_count"],
            2,
        )

        self.assertEqual(
            response.data["unread_count"],
            0,
        )

        self.assertEqual(
            Notification.objects.filter(
                user=self.user,
                is_read=False,
            ).count(),
            0,
        )

    # =========================================================
    # DELETE
    # =========================================================

    def test_delete_notification(self):
        notification = Notification.objects.create(
            user=self.user,
            title="Delete Me",
            message="Delete message",
            notification_type="system",
        )

        response = self.client.delete(
            reverse(
                "notification-delete",
                kwargs={
                    "notification_id": notification.id,
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            Notification.objects.filter(
                id=notification.id
            ).exists()
        )

    def test_delete_other_users_notification_returns_404(self):
        notification = Notification.objects.create(
            user=self.other_user,
            title="Other",
            message="Other message",
            notification_type="system",
        )

        response = self.client.delete(
            reverse(
                "notification-delete",
                kwargs={
                    "notification_id": notification.id,
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    # =========================================================
    # OLD READ NOTIFICATION CLEANUP
    # =========================================================

    def test_old_read_notifications_are_deleted_from_list(self):
        old_date = timezone.now() - timedelta(
            days=2
        )

        notification = Notification.objects.create(
            user=self.user,
            title="Old Read",
            message="Old notification",
            notification_type="system",
            is_read=True,
            read_at=old_date,
        )

        response = self.client.get(
            reverse("notification-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            Notification.objects.filter(
                id=notification.id
            ).exists()
        )

    # =========================================================
    # USER ISOLATION
    # =========================================================

    def test_unread_count_only_counts_current_user(self):
        Notification.objects.create(
            user=self.user,
            title="Mine",
            message="Mine",
            notification_type="system",
        )

        Notification.objects.create(
            user=self.other_user,
            title="Other",
            message="Other",
            notification_type="system",
        )

        response = self.client.get(
            reverse("notification-unread-count")
        )

        self.assertEqual(
            response.data["unread_count"],
            1,
        )

    def test_preferences_are_user_specific(self):
        preferences = get_notification_preferences(
            self.user
        )

        other_preferences = get_notification_preferences(
            self.other_user
        )

        self.assertNotEqual(
            preferences.id,
            other_preferences.id,
        )

        self.assertEqual(
            NotificationPreference.objects.count(),
            2,
        )
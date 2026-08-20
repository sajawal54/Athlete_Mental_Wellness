from rest_framework import serializers

from .models import (
    Notification,
    NotificationPreference,
)


class NotificationSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "priority",
            "is_read",
            "action_url",
            "icon",
            "created_at",
            "read_at",
        ]


class NotificationPreferenceSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = NotificationPreference
        fields = [
            "notifications_enabled",
            "goal_reminders",
            "wellness_updates",
            "achievement_updates",
            "security_notifications",
        ]
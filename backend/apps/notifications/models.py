from django.conf import settings
from django.db import models


class NotificationPreference(models.Model):
    """
    Stores the notification preferences for each user.
    One user can have only one preference record.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )

    # Master notification switch
    notifications_enabled = models.BooleanField(
        default=True
    )

    # Individual notification categories
    goal_reminders = models.BooleanField(
        default=True
    )

    wellness_updates = models.BooleanField(
        default=True
    )

    achievement_updates = models.BooleanField(
        default=True
    )

    security_notifications = models.BooleanField(
        default=True
    )

    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"

    def __str__(self):
        return f"Notification preferences - {self.user.email}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ("achievement", "Achievement"),
        ("wellness", "Wellness"),
        ("goal", "Daily Goal"),
        ("support", "Support"),
        ("mood", "Mood"),
        ("streak", "Streak"),
        ("security", "Security"),
        ("system", "System"),
    ]

    PRIORITY_CHOICES = [
        ("normal", "Normal"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    title = models.CharField(
        max_length=255
    )

    message = models.TextField()

    notification_type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        default="system",
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="normal",
    )

    is_read = models.BooleanField(
        default=False
    )

    action_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
    )

    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    read_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["user", "is_read"]
            ),
            models.Index(
                fields=["user", "notification_type"]
            ),
            models.Index(
                fields=["user", "created_at"]
            ),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"
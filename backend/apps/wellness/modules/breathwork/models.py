from django.db import models
from django.conf import settings


User = settings.AUTH_USER_MODEL


class BreathworkSession(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("paused", "Paused"),
        ("completed", "Completed"),
        ("abandoned", "Abandoned"),
    ]

    DURATION_CHOICES = [
        (1, "1 Minute"),
        (3, "3 Minutes"),
        (5, "5 Minutes"),
        (10, "10 Minutes"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="breathwork_sessions",
    )

    duration_minutes = models.PositiveIntegerField(
        choices=DURATION_CHOICES,
        default=5,
    )

    elapsed_seconds = models.PositiveIntegerField(
        default=0,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    started_at = models.DateTimeField(
        auto_now_add=True,
    )

    paused_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return (
            f"{self.user} - "
            f"{self.duration_minutes} min - "
            f"{self.status}"
        )
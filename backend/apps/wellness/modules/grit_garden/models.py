from django.db import models
from django.conf import settings


User = settings.AUTH_USER_MODEL


class GritGardenSession(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("abandoned", "Abandoned"),
    ]

    EXERCISE_CHOICES = [
        ("reflection", "Reflection"),
        ("stress_release", "Stress Release"),
        ("gratitude", "Gratitude"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="grit_garden_sessions",
    )

    exercise_type = models.CharField(
        max_length=30,
        choices=EXERCISE_CHOICES,
        default="reflection",
    )

    journal_text = models.TextField(
        blank=True,
    )

    exercise_response = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user} - {self.exercise_type}"
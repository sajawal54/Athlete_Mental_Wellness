from django.db import models
from django.conf import settings


User = settings.AUTH_USER_MODEL


class MindfulMonsterStep(models.Model):

    title = models.CharField(
        max_length=150
    )

    instruction = models.TextField()

    phase = models.CharField(
        max_length=50,
        choices=[
            ("prepare", "Prepare"),
            ("inhale", "Inhale"),
            ("hold", "Hold"),
            ("exhale", "Exhale"),
            ("relax", "Relax"),
        ],
    )

    duration_seconds = models.PositiveIntegerField(
        default=5
    )

    order = models.PositiveIntegerField(
        default=0
    )

    is_active = models.BooleanField(
        default=True
    )

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class MindfulMonsterSession(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("abandoned", "Abandoned"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="mindful_monster_sessions",
    )

    current_step = models.PositiveIntegerField(
        default=0
    )

    completed_steps = models.PositiveIntegerField(
        default=0
    )

    total_steps = models.PositiveIntegerField(
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    started_at = models.DateTimeField(
        auto_now_add=True
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.user} - Mindful Monsters"
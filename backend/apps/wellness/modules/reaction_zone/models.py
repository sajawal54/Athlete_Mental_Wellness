from django.conf import settings
from django.db import models


User = settings.AUTH_USER_MODEL


class ReactionPrompt(models.Model):

    prompt = models.CharField(
        max_length=250,
    )

    correct_answer = models.CharField(
        max_length=100,
    )

    difficulty = models.CharField(
        max_length=30,
        default="easy",
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.prompt


class ReactionGameSession(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reaction_game_sessions",
    )

    score = models.PositiveIntegerField(
        default=0,
    )

    total_prompts = models.PositiveIntegerField(
        default=0,
    )

    correct_answers = models.PositiveIntegerField(
        default=0,
    )

    duration_seconds = models.PositiveIntegerField(
        default=0,
    )

    status = models.CharField(
        max_length=20,
        default="active",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = [
            "-score",
            "-created_at",
        ]

    def __str__(self):
        return (
            f"{self.user} - {self.score}"
        )
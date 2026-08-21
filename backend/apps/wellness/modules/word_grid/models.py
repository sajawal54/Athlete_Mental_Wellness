from django.conf import settings
from django.db import models
from django.utils import timezone


User = settings.AUTH_USER_MODEL


class WordGridPuzzle(models.Model):
    puzzle_date = models.DateField(
        default=timezone.localdate,
        unique=True,
    )

    title = models.CharField(
        max_length=150,
        default="Mental Grit Grid",
    )

    theme = models.CharField(
        max_length=150,
        default="Resilience & Focus",
    )

    grid = models.JSONField(
        default=list,
        help_text="2D array of letters representing the word search board",
    )

    target_words = models.JSONField(
        default=list,
        help_text="List of target words and hints",
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["-puzzle_date"]

    def __str__(self):
        return (
            f"Word Grid ({self.puzzle_date}) - "
            f"{self.theme}"
        )


class WordGridScore(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="word_grid_scores",
    )

    puzzle = models.ForeignKey(
        WordGridPuzzle,
        on_delete=models.CASCADE,
        related_name="scores",
    )

    words_found = models.JSONField(
        default=list,
    )

    time_taken_seconds = models.PositiveIntegerField(
        default=0,
    )

    score = models.PositiveIntegerField(
        default=0,
    )

    completed_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-score",
            "time_taken_seconds",
        ]

    def __str__(self):
        return (
            f"{self.user} - "
            f"{self.puzzle.puzzle_date} "
            f"({self.score} pts)"
        )
from django.db import models
from django.conf import settings


User = settings.AUTH_USER_MODEL


class CodexCategory(models.Model):

    name = models.CharField(max_length=150)

    description = models.TextField(blank=True)

    order = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class CodexLesson(models.Model):

    category = models.ForeignKey(
        CodexCategory,
        on_delete=models.CASCADE,
        related_name="lessons",
    )

    title = models.CharField(max_length=200)

    description = models.TextField(blank=True)

    content = models.TextField()

    required_xp = models.PositiveIntegerField(default=0)

    xp_reward = models.PositiveIntegerField(default=10)

    order = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category__order", "order"]

    def __str__(self):
        return self.title


class UserLessonProgress(models.Model):

    STATUS_CHOICES = [
        ("locked", "Locked"),
        ("available", "Available"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="codex_lesson_progress",
    )

    lesson = models.ForeignKey(
        CodexLesson,
        on_delete=models.CASCADE,
        related_name="user_progress",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="available",
    )

    progress = models.PositiveIntegerField(default=0)

    started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "lesson"],
                name="unique_codex_lesson_progress",
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.lesson.title}"
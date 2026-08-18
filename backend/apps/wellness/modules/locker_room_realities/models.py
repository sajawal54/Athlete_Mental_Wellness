from django.db import models
from django.conf import settings


User = settings.AUTH_USER_MODEL


class LockerRoomScenario(models.Model):

    title = models.CharField(max_length=250)

    situation = models.TextField()

    question = models.TextField()

    choices = models.JSONField(default=list)

    correct_choice = models.PositiveIntegerField(
        default=0
    )

    explanation = models.TextField(
        blank=True
    )

    difficulty = models.CharField(
        max_length=30,
        default="beginner"
    )

    is_active = models.BooleanField(
        default=True
    )

    order = models.PositiveIntegerField(
        default=0
    )

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class LockerRoomSession(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="locker_room_sessions",
    )

    scenario = models.ForeignKey(
        LockerRoomScenario,
        on_delete=models.CASCADE,
        related_name="sessions",
    )

    selected_choice = models.IntegerField(
        null=True,
        blank=True
    )

    score = models.PositiveIntegerField(
        default=0
    )

    evaluation = models.TextField(
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.scenario.title}"
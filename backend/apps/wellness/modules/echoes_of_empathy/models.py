from django.db import models
from django.conf import settings


User = settings.AUTH_USER_MODEL


class EmpathyScenario(models.Model):

    title = models.CharField(max_length=250)

    situation = models.TextField()

    prompt = models.TextField()

    difficulty = models.CharField(
        max_length=30,
        default="beginner",
    )

    is_active = models.BooleanField(
        default=True,
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class EmpathySession(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("abandoned", "Abandoned"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="empathy_sessions",
    )

    scenario = models.ForeignKey(
        EmpathyScenario,
        on_delete=models.CASCADE,
        related_name="sessions",
    )

    response = models.TextField(
        blank=True,
    )

    feedback = models.TextField(
        blank=True,
    )

    score = models.PositiveIntegerField(
        default=0,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
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
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.scenario.title}"
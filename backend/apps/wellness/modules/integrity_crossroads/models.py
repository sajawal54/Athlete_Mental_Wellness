from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class IntegrityScenario(models.Model):
    title = models.CharField(max_length=250)
    category = models.CharField(max_length=100, default="Fair Play")
    dilemma = models.TextField()
    choices = models.JSONField(
        default=list,
        help_text="List of choices with text, score, and values_reflection",
    )
    explanation = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class IntegritySession(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="integrity_sessions",
    )
    scenario = models.ForeignKey(
        IntegrityScenario,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    selected_choice = models.IntegerField(null=True, blank=True)
    reflection = models.TextField(blank=True)
    score = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="completed")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.scenario.title} ({self.score}%)"

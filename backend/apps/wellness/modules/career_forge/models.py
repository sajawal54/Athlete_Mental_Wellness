from django.conf import settings
from django.db import models


User = settings.AUTH_USER_MODEL


class CareerRoadmap(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="career_roadmaps",
    )

    target_role = models.CharField(
        max_length=200,
    )

    industry = models.CharField(
        max_length=200,
        blank=True,
    )

    transferable_skills = models.JSONField(
        default=list,
        blank=True,
    )

    milestones = models.JSONField(
        default=list,
        help_text="List of milestones with title, deadline, status",
    )

    financial_goals = models.TextField(
        blank=True,
    )

    timeline_months = models.PositiveIntegerField(
        default=12,
    )

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user} - {self.target_role}"
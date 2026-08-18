from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class SelfTalkEntry(models.Model):
    DISTORTION_CHOICES = [
        ("all_or_nothing", "All-or-Nothing Thinking"),
        ("catastrophizing", "Catastrophizing"),
        ("mind_reading", "Mind Reading"),
        ("overgeneralization", "Overgeneralization"),
        ("should_statements", "Should / Must Statements"),
        ("personalization", "Personalization / Blaming"),
        ("other", "General Unhelpful Thought"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="self_talk_entries",
    )
    negative_thought = models.TextField()
    distortion_type = models.CharField(
        max_length=50,
        choices=DISTORTION_CHOICES,
        default="other",
    )
    analysis = models.TextField(blank=True)
    suggested_rewrite = models.TextField(blank=True)
    actionable_tip = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.distortion_type}"

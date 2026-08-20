from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class WellnessModule(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
    ]

    MODULE_TYPE_CHOICES = [
        ("codex", "Codex"),
        ("mindful_monsters", "Mindful Monsters"),
        ("breathwork", "Breathwork"),
        ("setback_reframer", "Setback Reframer"),
        ("grit_garden", "Grit Garden"),
        ("echoes_of_empathy", "Echoes of Empathy"),
        ("counselor_hub", "Counselor Hub"),
        ("transition_support", "Transition Support"),
        ("locker_room_realities", "Locker Room Realities"),
        ("reaction_zone", "Reaction Zone"),
        ("integrity_crossroads", "Integrity Crossroads"),
        ("self_talk_detective", "Self-Talk Detective"),
        ("career_forge", "Career Forge"),
        ("word_grid", "Word Grid"),
    ]

    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default="🧩")
    module_type = models.CharField(
        max_length=50,
        choices=MODULE_TYPE_CHOICES,
    )
    required_xp = models.PositiveIntegerField(default=0)
    xp_reward = models.PositiveIntegerField(default=25)
    order = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )
    instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class UserModuleProgress(models.Model):
    STATUS_CHOICES = [
        ("locked", "Locked"),
        ("available", "Available"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="wellness_progress",
    )
    module = models.ForeignKey(
        WellnessModule,
        on_delete=models.CASCADE,
        related_name="user_progress",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="available",
    )
    progress = models.PositiveIntegerField(default=0)
    current_step = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "module"],
                name="unique_user_wellness_module",
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.module.name} ({self.status})"


class WellnessSession(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="wellness_sessions",
    )
    module = models.ForeignKey(
        WellnessModule,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    data = models.JSONField(default=dict, blank=True)
    score = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user} - {self.module.name} ({'Completed' if self.is_completed else 'Active'})"


class WellnessCompletion(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="wellness_completions",
    )
    module = models.ForeignKey(
        WellnessModule,
        on_delete=models.CASCADE,
        related_name="completions",
    )
    session = models.ForeignKey(
        WellnessSession,
        on_delete=models.CASCADE,
        related_name="completions",
        null=True,
        blank=True,
    )
    xp_awarded = models.PositiveIntegerField(default=0)
    completion_date = models.DateField(auto_now_add=True)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "module", "completion_date"],
                name="unique_daily_wellness_completion",
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.module.name} (+{self.xp_awarded} XP)"


# Import Submodule Models for DB registration
from .modules.codex.models import CodexCategory, CodexLesson, UserLessonProgress
from .modules.mindful_monsters.models import MindfulMonsterStep, MindfulMonsterSession
from .modules.breathwork.models import BreathworkSession
from .modules.setback_reframer.models import ReframeSession
from .modules.grit_garden.models import GritGardenSession
from .modules.echoes_of_empathy.models import EmpathyScenario, EmpathySession
from .modules.counselor_hub.models import Counselor, CounselorRequest
from .modules.transition_support.models import TransitionResource, ResourceView
from .modules.locker_room_realities.models import LockerRoomScenario, LockerRoomSession
from .modules.reaction_zone.models import ReactionPrompt, ReactionGameSession
from .modules.integrity_crossroads.models import IntegrityScenario, IntegritySession
from .modules.self_talk_detective.models import SelfTalkEntry
from .modules.career_forge.models import CareerRoadmap
from .modules.word_grid.models import WordGridPuzzle, WordGridScore
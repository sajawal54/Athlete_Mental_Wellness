from django.contrib import admin

from .models import (
    WellnessModule,
    UserModuleProgress,
    WellnessSession,
    WellnessCompletion,
    CodexCategory,
    CodexLesson,
    MindfulMonsterStep,
    Counselor,
    CounselorRequest,
    TransitionResource,
    EmpathyScenario,
    LockerRoomScenario,
    ReactionPrompt,
    IntegrityScenario,
    SelfTalkEntry,
    CareerRoadmap,
    WordGridPuzzle,
)


@admin.register(WellnessModule)
class WellnessModuleAdmin(admin.ModelAdmin):
    list_display = ("name", "module_type", "required_xp", "xp_reward", "status", "order")
    list_filter = ("status", "module_type")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(UserModuleProgress)
class UserModuleProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "module", "status", "progress", "current_step", "updated_at")
    list_filter = ("status",)


@admin.register(WellnessSession)
class WellnessSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "module", "score", "is_completed", "started_at")
    list_filter = ("is_completed",)


@admin.register(WellnessCompletion)
class WellnessCompletionAdmin(admin.ModelAdmin):
    list_display = ("user", "module", "xp_awarded", "completed_at")


@admin.register(CodexCategory)
class CodexCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "order", "is_active")


@admin.register(CodexLesson)
class CodexLessonAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "required_xp", "xp_reward", "order", "is_active")


@admin.register(MindfulMonsterStep)
class MindfulMonsterStepAdmin(admin.ModelAdmin):
    list_display = ("title", "phase", "duration_seconds", "order")


@admin.register(Counselor)
class CounselorAdmin(admin.ModelAdmin):
    list_display = ("name", "specialization", "experience_years", "is_available")


@admin.register(CounselorRequest)
class CounselorRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "counselor", "request_type", "status", "created_at")
    list_filter = ("status", "request_type")


@admin.register(TransitionResource)
class TransitionResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "resource_type", "order", "is_active")


@admin.register(EmpathyScenario)
class EmpathyScenarioAdmin(admin.ModelAdmin):
    list_display = ("title", "difficulty", "order")


@admin.register(LockerRoomScenario)
class LockerRoomScenarioAdmin(admin.ModelAdmin):
    list_display = ("title", "difficulty", "order")


@admin.register(ReactionPrompt)
class ReactionPromptAdmin(admin.ModelAdmin):
    list_display = ("prompt", "correct_answer", "difficulty")


@admin.register(IntegrityScenario)
class IntegrityScenarioAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "order")


@admin.register(SelfTalkEntry)
class SelfTalkEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "distortion_type", "created_at")


@admin.register(CareerRoadmap)
class CareerRoadmapAdmin(admin.ModelAdmin):
    list_display = ("user", "target_role", "industry", "updated_at")


@admin.register(WordGridPuzzle)
class WordGridPuzzleAdmin(admin.ModelAdmin):
    list_display = ("title", "puzzle_date", "theme", "is_active")
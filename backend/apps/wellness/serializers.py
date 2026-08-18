from rest_framework import serializers

from .models import (
    WellnessModule,
    UserModuleProgress,
    WellnessSession,
    WellnessCompletion,
    CodexCategory,
    CodexLesson,
    UserLessonProgress,
    MindfulMonsterStep,
    MindfulMonsterSession,
    BreathworkSession,
    ReframeSession,
    GritGardenSession,
    EmpathyScenario,
    EmpathySession,
    Counselor,
    CounselorRequest,
    TransitionResource,
    ResourceView,
    LockerRoomScenario,
    LockerRoomSession,
    ReactionPrompt,
    ReactionGameSession,
    IntegrityScenario,
    IntegritySession,
    SelfTalkEntry,
    CareerRoadmap,
    WordGridPuzzle,
    WordGridScore,
)
from .services import get_module_status, is_module_unlocked


class UserModuleProgressSerializer(serializers.ModelSerializer):
    module_slug = serializers.CharField(source="module.slug", read_only=True)
    module_name = serializers.CharField(source="module.name", read_only=True)
    module_icon = serializers.CharField(source="module.icon", read_only=True)

    class Meta:
        model = UserModuleProgress
        fields = [
            "id",
            "module_slug",
            "module_name",
            "module_icon",
            "status",
            "progress",
            "current_step",
            "started_at",
            "completed_at",
            "updated_at",
        ]


class WellnessSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WellnessSession
        fields = [
            "id",
            "module",
            "data",
            "score",
            "is_completed",
            "started_at",
            "completed_at",
        ]


class WellnessCompletionSerializer(serializers.ModelSerializer):
    module_name = serializers.CharField(source="module.name", read_only=True)

    class Meta:
        model = WellnessCompletion
        fields = [
            "id",
            "module",
            "module_name",
            "xp_awarded",
            "completed_at",
        ]


class WellnessModuleSerializer(serializers.ModelSerializer):
    user_status = serializers.SerializerMethodField()
    is_unlocked = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = WellnessModule
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "module_type",
            "required_xp",
            "xp_reward",
            "order",
            "status",
            "instructions",
            "user_status",
            "is_unlocked",
            "user_progress",
        ]

    def get_user_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return "available" if obj.required_xp == 0 else "locked"
        return get_module_status(request.user, obj)

    def get_is_unlocked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return obj.required_xp == 0
        return is_module_unlocked(request.user, obj)

    def get_user_progress(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        progress = UserModuleProgress.objects.filter(user=request.user, module=obj).first()
        if not progress:
            return None
        return {
            "status": progress.status,
            "progress": progress.progress,
            "current_step": progress.current_step,
            "started_at": progress.started_at,
            "completed_at": progress.completed_at,
        }


# -------------------------------------------------------------
# Module-Specific Serializers
# -------------------------------------------------------------

# 1. Codex
class CodexLessonSerializer(serializers.ModelSerializer):
    user_status = serializers.SerializerMethodField()

    class Meta:
        model = CodexLesson
        fields = [
            "id",
            "title",
            "description",
            "content",
            "required_xp",
            "xp_reward",
            "order",
            "user_status",
        ]

    def get_user_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return "available"
        progress = UserLessonProgress.objects.filter(user=request.user, lesson=obj).first()
        if progress and progress.status == "completed":
            return "completed"
        if progress and progress.status == "in_progress":
            return "in_progress"
        return "available"


class CodexCategorySerializer(serializers.ModelSerializer):
    lessons = CodexLessonSerializer(many=True, read_only=True)

    class Meta:
        model = CodexCategory
        fields = ["id", "name", "description", "order", "lessons"]


# 2. Mindful Monsters
class MindfulMonsterStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = MindfulMonsterStep
        fields = ["id", "title", "instruction", "phase", "duration_seconds", "order"]


# 3. Breathwork
class BreathworkSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreathworkSession
        fields = ["id", "duration_minutes", "elapsed_seconds", "status", "started_at", "completed_at"]


# 4. Setback Reframer
class ReframeSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReframeSession
        fields = ["id", "negative_thought", "reframe", "safety_message", "status", "created_at"]


# 5. Grit Garden
class GritGardenSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GritGardenSession
        fields = ["id", "exercise_type", "journal_text", "exercise_response", "status", "created_at", "updated_at"]


# 6. Echoes of Empathy
class EmpathyScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpathyScenario
        fields = ["id", "title", "situation", "prompt", "difficulty", "order"]


# 7. Counselor Hub
class CounselorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Counselor
        fields = [
            "id",
            "name",
            "specialization",
            "bio",
            "experience_years",
            "location",
            "email",
            "phone",
            "image",
            "is_available",
        ]


class CounselorRequestSerializer(serializers.ModelSerializer):
    counselor_name = serializers.CharField(source="counselor.name", read_only=True)
    counselor_specialization = serializers.CharField(source="counselor.specialization", read_only=True)

    class Meta:
        model = CounselorRequest
        fields = [
            "id",
            "counselor",
            "counselor_name",
            "counselor_specialization",
            "request_type",
            "message",
            "preferred_date",
            "preferred_time",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]


# 8. Transition Support
class TransitionResourceSerializer(serializers.ModelSerializer):
    is_viewed = serializers.SerializerMethodField()

    class Meta:
        model = TransitionResource
        fields = [
            "id",
            "title",
            "description",
            "content",
            "resource_type",
            "category",
            "file",
            "order",
            "is_viewed",
        ]

    def get_is_viewed(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return ResourceView.objects.filter(user=request.user, resource=obj).exists()


# 9. Locker Room Realities
class LockerRoomScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = LockerRoomScenario
        fields = ["id", "title", "situation", "question", "choices", "explanation", "difficulty", "order"]


# 10. Reaction Zone
class ReactionPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReactionPrompt
        fields = ["id", "prompt", "correct_answer", "difficulty"]


class ReactionGameSessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ReactionGameSession
        fields = ["id", "username", "score", "total_prompts", "correct_answers", "duration_seconds", "completed_at"]


# 11. Integrity Crossroads
class IntegrityScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrityScenario
        fields = ["id", "title", "category", "dilemma", "choices", "explanation", "order"]


# 12. Self-Talk Detective
class SelfTalkEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SelfTalkEntry
        fields = [
            "id",
            "negative_thought",
            "distortion_type",
            "analysis",
            "suggested_rewrite",
            "actionable_tip",
            "created_at",
        ]


# 13. Career Forge
class CareerRoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerRoadmap
        fields = [
            "id",
            "target_role",
            "industry",
            "transferable_skills",
            "milestones",
            "financial_goals",
            "timeline_months",
            "notes",
            "created_at",
            "updated_at",
        ]


# 14. Word Grid
class WordGridPuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WordGridPuzzle
        fields = ["id", "puzzle_date", "title", "theme", "grid", "target_words"]


class WordGridScoreSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = WordGridScore
        fields = ["id", "username", "words_found", "time_taken_seconds", "score", "completed_at"]
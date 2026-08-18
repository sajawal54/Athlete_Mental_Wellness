from rest_framework import serializers

from .models import (
    CodexCategory,
    CodexLesson,
    UserLessonProgress,
)


class CodexLessonSerializer(serializers.ModelSerializer):
    user_status = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = CodexLesson

        fields = [
            "id",
            "category",
            "title",
            "description",
            "content",
            "required_xp",
            "xp_reward",
            "order",
            "is_active",
            "user_status",
            "user_progress",
        ]

        read_only_fields = [
            "id",
            "user_status",
            "user_progress",
        ]

    def get_user_status(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return "locked"

        from .services import get_lesson_status

        return get_lesson_status(
            request.user,
            obj,
        )

    def get_user_progress(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return {
                "progress": 0,
                "started_at": None,
                "completed_at": None,
            }

        progress = UserLessonProgress.objects.filter(
            user=request.user,
            lesson=obj,
        ).first()

        if not progress:
            return {
                "progress": 0,
                "started_at": None,
                "completed_at": None,
            }

        return {
            "progress": progress.progress,
            "started_at": progress.started_at,
            "completed_at": progress.completed_at,
        }


class CodexCategorySerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = CodexCategory

        fields = [
            "id",
            "name",
            "description",
            "order",
            "is_active",
            "lessons",
        ]

    def get_lessons(self, obj):
        lessons = obj.lessons.filter(
            is_active=True
        )

        return CodexLessonSerializer(
            lessons,
            many=True,
            context=self.context,
        ).data


class UserLessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(
        source="lesson.title",
        read_only=True,
    )

    lesson_slug = serializers.SerializerMethodField()

    class Meta:
        model = UserLessonProgress

        fields = [
            "id",
            "lesson",
            "lesson_title",
            "lesson_slug",
            "status",
            "progress",
            "started_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "lesson_title",
            "lesson_slug",
            "status",
            "started_at",
            "completed_at",
        ]

    def get_lesson_slug(self, obj):
        return (
            obj.lesson.title
            .lower()
            .replace(" ", "-")
        )
from rest_framework import serializers

from apps.wellness.models import (
    CodexCategory,
    CodexLesson,
    UserLessonProgress,
)


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

        progress = UserLessonProgress.objects.filter(
            user=request.user,
            lesson=obj,
        ).first()

        if progress and progress.status == "completed":
            return "completed"

        if progress and progress.status == "in_progress":
            return "in_progress"

        return "available"


class CodexCategorySerializer(serializers.ModelSerializer):
    lessons = CodexLessonSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = CodexCategory
        fields = [
            "id",
            "name",
            "description",
            "order",
            "lessons",
        ]
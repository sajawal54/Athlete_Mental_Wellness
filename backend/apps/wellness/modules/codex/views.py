from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.gamification.service import award_xp
from apps.notifications.services import (
    create_wellness_notification,
)
from apps.wellness.models import (
    CodexCategory,
    CodexLesson,
    UserLessonProgress,
)

from .serializers import (
    CodexCategorySerializer,
    CodexLessonSerializer,
)


def notify_wellness_completion(
    user,
    title,
    message,
    action_url="/modules",
):
    """
    Create a Wellness notification.
    """

    return create_wellness_notification(
        user=user,
        title=title,
        message=message,
        action_url=action_url,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def codex_categories_view(request):
    """
    Return all active Codex categories
    with their active lessons.
    """

    categories = (
        CodexCategory.objects
        .filter(is_active=True)
        .prefetch_related("lessons")
    )

    serializer = CodexCategorySerializer(
        categories,
        many=True,
        context={"request": request},
    )

    return Response(
        {
            "success": True,
            "categories": serializer.data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def codex_lesson_detail_view(
    request,
    lesson_id,
):
    """
    Return a single active Codex lesson.
    """

    try:
        lesson = CodexLesson.objects.get(
            id=lesson_id,
            is_active=True,
        )

    except CodexLesson.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Lesson not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = CodexLessonSerializer(
        lesson,
        context={"request": request},
    )

    return Response(
        {
            "success": True,
            "lesson": serializer.data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def codex_lesson_start_view(
    request,
    lesson_id,
):
    """
    Start a Codex lesson for the authenticated user.
    """

    try:
        lesson = CodexLesson.objects.get(
            id=lesson_id,
            is_active=True,
        )

    except CodexLesson.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Lesson not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    progress, _ = UserLessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson,
        defaults={
            "status": "in_progress",
            "started_at": timezone.now(),
            "progress": 50,
        },
    )

    if progress.status == "available":
        progress.status = "in_progress"
        progress.started_at = timezone.now()
        progress.save(
            update_fields=[
                "status",
                "started_at",
            ]
        )

    return Response(
        {
            "success": True,
            "status": progress.status,
            "progress": progress.progress,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def codex_lesson_complete_view(
    request,
    lesson_id,
):
    """
    Complete a Codex lesson and award XP once.
    """

    try:
        lesson = CodexLesson.objects.get(
            id=lesson_id,
            is_active=True,
        )

    except CodexLesson.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Lesson not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    progress, _ = UserLessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson,
    )

    already_completed = (
        progress.status == "completed"
    )

    xp_awarded = 0

    if not already_completed:
        progress.status = "completed"
        progress.progress = 100
        progress.completed_at = timezone.now()

        progress.save(
            update_fields=[
                "status",
                "progress",
                "completed_at",
            ]
        )

        if lesson.xp_reward > 0:
            award_xp(
                request.user,
                lesson.xp_reward,
                "wellness_codex",
                f"Completed lesson: {lesson.title}",
            )

            xp_awarded = lesson.xp_reward

            notify_wellness_completion(
                user=request.user,
                title="Codex Lesson Completed!",
                message=(
                    f"You earned {xp_awarded} XP "
                    f"for completing lesson: "
                    f"{lesson.title}"
                ),
                action_url="/modules",
            )

    return Response(
        {
            "success": True,
            "already_completed": already_completed,
            "xp_awarded": xp_awarded,
            "message": "Lesson marked as completed.",
        }
    )
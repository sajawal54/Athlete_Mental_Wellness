from django.db.models import Prefetch
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
    with only their active lessons and daily reset evaluated.
    """

    today = timezone.localdate()

    categories = (
        CodexCategory.objects
        .filter(is_active=True)
        .prefetch_related(
            Prefetch(
                "lessons",
                queryset=CodexLesson.objects.filter(
                    is_active=True
                ).order_by("order"),
            )
        )
    )

    # Evaluate daily reset for completed lesson progress.
    user_progresses = UserLessonProgress.objects.filter(
        user=request.user,
        status="completed",
    )

    for prog in user_progresses:
        completed_date = None

        if prog.completed_at:
            completed_date = timezone.localtime(
                prog.completed_at
            ).date()

        # Reset previous-day completion.
        if completed_date and completed_date < today:
            prog.status = "available"
            prog.progress = 0
            prog.completed_at = None

            # UserLessonProgress does not have updated_at.
            prog.save(
                update_fields=[
                    "status",
                    "progress",
                    "completed_at",
                ]
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
        },
        status=status.HTTP_200_OK,
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
        },
        status=status.HTTP_200_OK,
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

    today = timezone.localdate()

    progress, created = UserLessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson,
        defaults={
            "status": "in_progress",
            "started_at": timezone.now(),
            "progress": 50,
        },
    )

    completed_date = None

    if progress.completed_at:
        completed_date = timezone.localtime(
            progress.completed_at
        ).date()

    if completed_date and completed_date < today:
        progress.status = "in_progress"
        progress.progress = 50
        progress.started_at = timezone.now()
        progress.completed_at = None

        progress.save()

    elif progress.status == "available":
        progress.status = "in_progress"
        progress.started_at = timezone.now()
        progress.progress = 50

        progress.save(
            update_fields=[
                "status",
                "started_at",
                "progress",
            ]
        )

    return Response(
        {
            "success": True,
            "status": progress.status,
            "progress": progress.progress,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def codex_lesson_complete_view(
    request,
    lesson_id,
):
    """
    Complete a Codex lesson and award XP safely
    with daily reset support.
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

    today = timezone.localdate()

    progress, _ = UserLessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson,
    )

    completed_date = None

    if progress.completed_at:
        completed_date = timezone.localtime(
            progress.completed_at
        ).date()

    already_completed = (
        progress.status == "completed"
        and completed_date == today
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

        reward = int(lesson.xp_reward or 0)

        if reward > 0:
            award_xp(
                request.user,
                reward,
                "wellness_codex",
                f"Completed lesson: {lesson.title}",
            )

            xp_awarded = reward

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

    else:
        xp_awarded = int(lesson.xp_reward or 0)

    return Response(
        {
            "success": True,
            "already_completed": already_completed,
            "xp_awarded": xp_awarded,
            "message": (
                f"Lesson marked as completed. "
                f"You earned {xp_awarded} XP!"
            ),
        },
        status=status.HTTP_200_OK,
    )
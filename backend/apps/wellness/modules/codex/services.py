from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from .models import (
    CodexCategory,
    CodexLesson,
    UserLessonProgress,
)

from apps.gamification.models import XPHistory


def get_user_total_xp(user):
    """
    Get user's current total XP.
    """

    result = XPHistory.objects.filter(
        user=user
    ).aggregate(
        total_xp=Sum("amount")
    )

    return result["total_xp"] or 0


def is_lesson_unlocked(user, lesson):
    """
    Check whether the user has enough XP
    to access the lesson.
    """

    total_xp = get_user_total_xp(user)

    return total_xp >= lesson.required_xp


def get_lesson_status(user, lesson):
    """
    Return current status of a lesson.

    Possible:
    locked
    available
    in_progress
    completed
    """

    progress = UserLessonProgress.objects.filter(
        user=user,
        lesson=lesson,
    ).first()

    if progress:

        if progress.status == "completed":
            return "completed"

        if progress.status == "in_progress":
            return "in_progress"

    if not is_lesson_unlocked(user, lesson):
        return "locked"

    return "available"


def get_lesson_progress(user, lesson):
    """
    Get or create user's lesson progress.
    """

    progress = UserLessonProgress.objects.filter(
        user=user,
        lesson=lesson,
    ).first()

    if progress:

        if progress.status in [
            "completed",
            "in_progress",
        ]:
            return progress

        new_status = (
            "available"
            if is_lesson_unlocked(user, lesson)
            else "locked"
        )

        if progress.status != new_status:
            progress.status = new_status

            progress.save(
                update_fields=[
                    "status",
                ]
            )

        return progress

    status = (
        "available"
        if is_lesson_unlocked(user, lesson)
        else "locked"
    )

    return UserLessonProgress.objects.create(
        user=user,
        lesson=lesson,
        status=status,
        progress=0,
    )


def get_categories():
    """
    Return active Codex categories.
    """

    return CodexCategory.objects.filter(
        is_active=True
    ).prefetch_related(
        "lessons"
    ).order_by(
        "order",
        "name",
    )


def get_lesson_by_id(lesson_id):
    """
    Return active lesson.
    """

    return CodexLesson.objects.filter(
        id=lesson_id,
        is_active=True,
        category__is_active=True,
    ).select_related(
        "category"
    ).first()


def start_lesson(user, lesson):
    """
    Start a Codex lesson.
    """

    if not is_lesson_unlocked(user, lesson):
        raise ValueError(
            f"You need {lesson.required_xp} XP "
            "to unlock this lesson."
        )

    progress = get_lesson_progress(
        user,
        lesson,
    )

    if progress.status == "completed":
        return progress

    if progress.status == "available":

        progress.status = "in_progress"

        if not progress.started_at:
            progress.started_at = timezone.now()

        progress.save(
            update_fields=[
                "status",
                "started_at",
            ]
        )

    return progress


def update_lesson_progress(
    user,
    lesson,
    progress_value,
):
    """
    Update lesson progress.
    """

    if not is_lesson_unlocked(user, lesson):
        raise ValueError(
            "This lesson is locked."
        )

    progress = get_lesson_progress(
        user,
        lesson,
    )

    if progress.status == "completed":
        return progress

    progress_value = max(
        0,
        min(
            100,
            int(progress_value),
        )
    )

    if progress.status == "available":
        progress.status = "in_progress"

        if not progress.started_at:
            progress.started_at = timezone.now()

    progress.progress = progress_value

    progress.save()

    return progress


@transaction.atomic
def complete_lesson(user, lesson):
    """
    Complete a lesson and award XP once.
    """

    if not is_lesson_unlocked(user, lesson):
        raise ValueError(
            "This lesson is locked."
        )

    progress = get_lesson_progress(
        user,
        lesson,
    )

    if progress.status == "completed":

        return {
            "already_completed": True,
            "progress": progress,
            "xp_awarded": 0,
        }

    progress.status = "completed"
    progress.progress = 100

    if not progress.started_at:
        progress.started_at = timezone.now()

    progress.completed_at = timezone.now()

    progress.save()

    xp_awarded = lesson.xp_reward

    if xp_awarded > 0:

        XPHistory.objects.create(
            user=user,
            amount=xp_awarded,
            source="codex",
            description=(
                f"Completed Codex lesson: "
                f"{lesson.title}"
            ),
        )

    return {
        "already_completed": False,
        "progress": progress,
        "xp_awarded": xp_awarded,
    }
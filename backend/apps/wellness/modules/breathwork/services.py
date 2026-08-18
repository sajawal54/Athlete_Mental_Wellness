from django.db import transaction
from django.utils import timezone

from .models import BreathworkSession

from apps.wellness.models import WellnessModule

from apps.wellness.services import (
    get_user_progress,
    is_module_unlocked,
    update_module_progress,
    complete_module,
)


def get_breathwork_module():

    return WellnessModule.objects.filter(
        slug="breathwork",
        status="active",
    ).first()


def get_session(user, session_id):

    return BreathworkSession.objects.filter(
        id=session_id,
        user=user,
    ).first()


def get_active_session(user):

    return BreathworkSession.objects.filter(
        user=user,
        status__in=[
            "active",
            "paused",
        ],
    ).first()


def start_session(
    user,
    duration_minutes,
):

    module = get_breathwork_module()

    if not module:

        raise ValueError(
            "Breathwork module not found."
        )

    if not is_module_unlocked(
        user,
        module,
    ):

        raise ValueError(
            f"You need {module.required_xp} XP "
            "to unlock Breathwork."
        )

    valid_durations = [
        1,
        3,
        5,
        10,
    ]

    duration_minutes = int(
        duration_minutes
    )

    if duration_minutes not in valid_durations:

        raise ValueError(
            "Duration must be 1, 3, 5, or 10 minutes."
        )

    # Restore an unfinished session.
    existing = get_active_session(user)

    if existing:

        return existing

    progress = get_user_progress(
        user,
        module,
    )

    if progress.status == "completed":

        raise ValueError(
            "Breathwork is already completed."
        )

    if progress.status == "available":

        progress.status = "in_progress"

        if not progress.started_at:

            progress.started_at = timezone.now()

        progress.save()

    session = BreathworkSession.objects.create(
        user=user,
        duration_minutes=duration_minutes,
    )

    return session


def update_session(
    user,
    session_id,
    elapsed_seconds,
):

    session = get_session(
        user,
        session_id,
    )

    if not session:

        raise ValueError(
            "Breathwork session not found."
        )

    if session.status == "completed":

        return session

    if session.status == "abandoned":

        raise ValueError(
            "This session has been stopped."
        )

    elapsed_seconds = max(
        0,
        int(elapsed_seconds),
    )

    total_seconds = (
        session.duration_minutes * 60
    )

    elapsed_seconds = min(
        elapsed_seconds,
        total_seconds,
    )

    session.elapsed_seconds = (
        elapsed_seconds
    )

    session.save(
        update_fields=[
            "elapsed_seconds",
        ]
    )

    module = get_breathwork_module()

    if module and total_seconds > 0:

        percentage = int(
            (
                elapsed_seconds
                / total_seconds
            ) * 100
        )

        update_module_progress(
            user=user,
            module=module,
            progress_value=percentage,
            current_step=elapsed_seconds,
        )

    return session


def pause_session(
    user,
    session_id,
):

    session = get_session(
        user,
        session_id,
    )

    if not session:

        raise ValueError(
            "Breathwork session not found."
        )

    if session.status == "completed":

        return session

    session.status = "paused"
    session.paused_at = timezone.now()

    session.save(
        update_fields=[
            "status",
            "paused_at",
        ]
    )

    return session


def resume_session(
    user,
    session_id,
):

    session = get_session(
        user,
        session_id,
    )

    if not session:

        raise ValueError(
            "Breathwork session not found."
        )

    if session.status != "paused":

        raise ValueError(
            "Only a paused session can be resumed."
        )

    session.status = "active"
    session.paused_at = None

    session.save(
        update_fields=[
            "status",
            "paused_at",
        ]
    )

    return session


def stop_session(
    user,
    session_id,
):

    session = get_session(
        user,
        session_id,
    )

    if not session:

        raise ValueError(
            "Breathwork session not found."
        )

    if session.status == "completed":

        return session

    session.status = "abandoned"

    session.save(
        update_fields=[
            "status",
        ]
    )

    return session


@transaction.atomic
def complete_session(
    user,
    session_id,
):

    session = get_session(
        user,
        session_id,
    )

    if not session:

        raise ValueError(
            "Breathwork session not found."
        )

    module = get_breathwork_module()

    if not module:

        raise ValueError(
            "Breathwork module not found."
        )

    # Duplicate protection.
    if session.status == "completed":

        return {
            "already_completed": True,
            "session": session,
            "xp_awarded": 0,
        }

    total_seconds = (
        session.duration_minutes * 60
    )

    if session.elapsed_seconds < total_seconds:

        raise ValueError(
            "Complete the selected duration first."
        )

    result = complete_module(
        user=user,
        module=module,
        score=session.elapsed_seconds,
    )

    session.status = "completed"
    session.completed_at = timezone.now()

    session.save(
        update_fields=[
            "status",
            "completed_at",
        ]
    )

    return {
        "already_completed": result[
            "already_completed"
        ],
        "session": session,
        "completion": result[
            "completion"
        ],
        "xp_awarded": result[
            "xp_awarded"
        ],
    }
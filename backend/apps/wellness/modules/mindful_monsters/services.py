from django.db import transaction
from django.utils import timezone

from .models import (
    MindfulMonsterStep,
    MindfulMonsterSession,
)

from apps.wellness.models import (
    WellnessModule,
)

from apps.wellness.services import (
    get_user_progress,
    is_module_unlocked,
    update_module_progress,
    complete_module,
)


def get_mindful_monsters_module():
    return WellnessModule.objects.filter(
        slug="mindful-monsters",
        status="active",
    ).first()


def get_steps():
    return MindfulMonsterStep.objects.filter(
        is_active=True
    ).order_by("order")


def get_session(user, session_id):
    return MindfulMonsterSession.objects.filter(
        id=session_id,
        user=user,
    ).first()


def start_session(user):
    """
    Start or restore a Mindful Monsters session.
    """

    module = get_mindful_monsters_module()

    if not module:
        raise ValueError(
            "Mindful Monsters module not found."
        )

    if not is_module_unlocked(
        user,
        module,
    ):
        raise ValueError(
            f"You need {module.required_xp} XP "
            "to unlock Mindful Monsters."
        )

    progress = get_user_progress(
        user,
        module,
    )

    if progress.status == "completed":
        raise ValueError(
            "Mindful Monsters is already completed."
        )

    steps = get_steps()

    if not steps.exists():
        raise ValueError(
            "Mindful Monsters steps are not configured."
        )

    # Restore active session.
    existing_session = (
        MindfulMonsterSession.objects.filter(
            user=user,
            status="active",
        ).first()
    )

    if existing_session:
        return (
            module,
            progress,
            existing_session,
        )

    if progress.status == "available":

        progress.status = "in_progress"

        if not progress.started_at:
            progress.started_at = timezone.now()

        progress.save()

    session = MindfulMonsterSession.objects.create(
        user=user,
        total_steps=steps.count(),
    )

    return (
        module,
        progress,
        session,
    )


def update_session(
    user,
    session_id,
    current_step=None,
    completed_steps=None,
):
    """
    Update breathing activity progress.
    """

    session = get_session(
        user,
        session_id,
    )

    if not session:
        raise ValueError(
            "Session not found."
        )

    if session.status == "completed":
        return session

    if current_step is not None:

        current_step = max(
            0,
            int(current_step),
        )

        session.current_step = min(
            current_step,
            session.total_steps,
        )

    if completed_steps is not None:

        completed_steps = max(
            0,
            int(completed_steps),
        )

        session.completed_steps = min(
            completed_steps,
            session.total_steps,
        )

    session.save()

    # Shared progress
    if session.total_steps > 0:

        percentage = int(
            (
                session.completed_steps
                / session.total_steps
            ) * 100
        )

        module = get_mindful_monsters_module()

        update_module_progress(
            user=user,
            module=module,
            progress_value=percentage,
            current_step=session.current_step,
        )

    return session


@transaction.atomic
def complete_session(
    user,
    session_id,
):
    """
    Complete Mindful Monsters.

    Shared Wellness completion system handles XP.
    """

    session = get_session(
        user,
        session_id,
    )

    if not session:
        raise ValueError(
            "Session not found."
        )

    module = get_mindful_monsters_module()

    if not module:
        raise ValueError(
            "Mindful Monsters module not found."
        )

    # Prevent duplicate completion.
    if session.status == "completed":

        return {
            "already_completed": True,
            "session": session,
            "xp_awarded": 0,
        }

    if session.completed_steps < session.total_steps:
        raise ValueError(
            "Complete all breathing steps first."
        )

    # Fixed: Removed explicit session=None kwarg
    result = complete_module(
        user=user,
        module=module,
        score=session.completed_steps,
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
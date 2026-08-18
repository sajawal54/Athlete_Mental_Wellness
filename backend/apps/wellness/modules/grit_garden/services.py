from django.db import transaction
from django.utils import timezone

from .models import GritGardenSession

from apps.wellness.models import WellnessModule

from apps.wellness.services import (
    get_user_progress,
    is_module_unlocked,
    update_module_progress,
    complete_module,
)


def get_grit_module():

    return WellnessModule.objects.filter(
        slug="grit-garden",
        status="active",
    ).first()


def get_session(user, session_id):

    return GritGardenSession.objects.filter(
        id=session_id,
        user=user,
    ).first()


def create_session(
    user,
    exercise_type,
    journal_text="",
    exercise_response="",
):

    module = get_grit_module()

    if not module:
        raise ValueError(
            "Grit Garden module not found."
        )

    if not is_module_unlocked(
        user,
        module,
    ):
        raise ValueError(
            f"You need {module.required_xp} XP "
            "to unlock Grit Garden."
        )

    progress = get_user_progress(
        user,
        module,
    )

    if progress.status == "completed":
        raise ValueError(
            "Grit Garden is already completed."
        )

    session = GritGardenSession.objects.create(
        user=user,
        exercise_type=exercise_type,
        journal_text=journal_text,
        exercise_response=exercise_response,
    )

    update_module_progress(
        user=user,
        module=module,
        progress_value=25,
        current_step=1,
    )

    return session


def autosave_session(
    user,
    session_id,
    journal_text=None,
    exercise_response=None,
):

    session = get_session(
        user,
        session_id,
    )

    if not session:
        raise ValueError(
            "Grit Garden session not found."
        )

    if session.status == "completed":
        return session

    if journal_text is not None:
        session.journal_text = journal_text

    if exercise_response is not None:
        session.exercise_response = (
            exercise_response
        )

    session.save()

    return session


def get_history(user):

    return GritGardenSession.objects.filter(
        user=user
    ).order_by(
        "-updated_at"
    )


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
            "Grit Garden session not found."
        )

    module = get_grit_module()

    if not module:
        raise ValueError(
            "Grit Garden module not found."
        )

    if session.status == "completed":

        return {
            "already_completed": True,
            "session": session,
            "xp_awarded": 0,
        }

    if not session.journal_text.strip():

        raise ValueError(
            "Please write something in your journal first."
        )

    result = complete_module(
        user=user,
        module=module,
        score=1,
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
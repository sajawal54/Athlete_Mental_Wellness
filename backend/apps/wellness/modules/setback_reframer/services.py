from django.db import transaction
from django.utils import timezone

from .models import ReframeSession

from apps.wellness.models import WellnessModule

from apps.wellness.services import (
    get_user_progress,
    is_module_unlocked,
    update_module_progress,
    complete_module,
)


SAFETY_MESSAGE = (
    "This exercise is for reflection and general "
    "wellness. If a thought feels overwhelming or "
    "you feel unsafe, consider reaching out to a "
    "trusted person or qualified professional."
)


def get_reframer_module():

    return WellnessModule.objects.filter(
        slug="setback-reframer",
        status="active",
    ).first()


def generate_reframe(thought):
    """
    Temporary rule-based reframe.

    Later this function can call your AI/FastAPI
    service without changing the views.
    """

    thought = thought.strip()

    lower = thought.lower()

    if any(
        word in lower
        for word in [
            "failure",
            "failed",
            "loser",
            "useless",
            "can't",
            "cannot",
            "never",
        ]
    ):

        return (
            "This setback does not define your ability. "
            "Try looking at what happened as information "
            "you can learn from. Ask yourself: what is "
            "one small thing I can improve next time?"
        )

    return (
        "This thought may feel difficult right now, "
        "but it does not have to define what happens next. "
        "Try separating the situation from your identity "
        "and focus on one small action you can control."
    )


def create_reframe_session(
    user,
    thought,
):

    module = get_reframer_module()

    if not module:

        raise ValueError(
            "Setback Reframer module not found."
        )

    if not is_module_unlocked(
        user,
        module,
    ):

        raise ValueError(
            f"You need {module.required_xp} XP "
            "to unlock Setback Reframer."
        )

    thought = thought.strip()

    if not thought:

        raise ValueError(
            "Please enter a thought."
        )

    session = ReframeSession.objects.create(
        user=user,
        negative_thought=thought,
        reframe=generate_reframe(
            thought
        ),
        safety_message=SAFETY_MESSAGE,
    )

    progress = get_user_progress(
        user,
        module,
    )

    if progress.status == "available":

        progress.status = "in_progress"

        if not progress.started_at:
            progress.started_at = timezone.now()

        progress.save()

    update_module_progress(
        user=user,
        module=module,
        progress_value=50,
        current_step=1,
    )

    return session


def get_history(user):

    return ReframeSession.objects.filter(
        user=user
    ).order_by(
        "-created_at"
    )


@transaction.atomic
def complete_reframe(
    user,
    session_id,
):

    session = ReframeSession.objects.filter(
        id=session_id,
        user=user,
    ).first()

    if not session:

        raise ValueError(
            "Reframe session not found."
        )

    module = get_reframer_module()

    if not module:

        raise ValueError(
            "Setback Reframer module not found."
        )

    if session.status == "completed":

        return {
            "already_completed": True,
            "session": session,
            "xp_awarded": 0,
        }

    if not session.reframe:

        raise ValueError(
            "Generate a reframe before completing."
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
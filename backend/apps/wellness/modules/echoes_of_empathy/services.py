from django.db import transaction
from django.utils import timezone

from .models import (
    EmpathyScenario,
    EmpathySession,
)

from apps.wellness.models import WellnessModule

from apps.wellness.services import (
    get_user_progress,
    is_module_unlocked,
    update_module_progress,
    complete_module,
)


def get_empathy_module():

    return WellnessModule.objects.filter(
        slug="echoes-of-empathy",
        status="active",
    ).first()


def get_scenarios():

    return EmpathyScenario.objects.filter(
        is_active=True
    ).order_by(
        "order",
        "id",
    )


def generate_feedback(response):
    """
    Simple feedback engine.

    Later this can be replaced with your
    Gemini/FastAPI AI service.
    """

    text = response.strip()

    positive_words = [
        "listen",
        "understand",
        "support",
        "help",
        "feel",
        "respect",
        "talk",
        "care",
    ]

    matched = sum(
        1
        for word in positive_words
        if word in text.lower()
    )

    if matched >= 3:

        return {
            "score": 90,
            "feedback": (
                "Great empathetic response. "
                "You acknowledged the person's feelings "
                "and offered supportive communication."
            ),
        }

    if matched >= 1:

        return {
            "score": 70,
            "feedback": (
                "Good start. Try to acknowledge "
                "the other person's feelings more clearly "
                "before suggesting a solution."
            ),
        }

    return {
        "score": 50,
        "feedback": (
            "Try to focus more on listening and "
            "understanding the person's feelings. "
            "Avoid immediately jumping to solutions."
        ),
    }


def create_session(
    user,
    scenario_id,
):

    module = get_empathy_module()

    if not module:
        raise ValueError(
            "Echoes of Empathy module not found."
        )

    if not is_module_unlocked(
        user,
        module,
    ):
        raise ValueError(
            f"You need {module.required_xp} XP "
            "to unlock Echoes of Empathy."
        )

    scenario = EmpathyScenario.objects.filter(
        id=scenario_id,
        is_active=True,
    ).first()

    if not scenario:
        raise ValueError(
            "Scenario not found."
        )

    progress = get_user_progress(
        user,
        module,
    )

    if progress.status == "completed":
        raise ValueError(
            "Echoes of Empathy is already completed."
        )

    session = EmpathySession.objects.create(
        user=user,
        scenario=scenario,
    )

    update_module_progress(
        user=user,
        module=module,
        progress_value=25,
        current_step=1,
    )

    return session


def submit_response(
    user,
    session_id,
    response,
):

    session = EmpathySession.objects.filter(
        id=session_id,
        user=user,
    ).select_related(
        "scenario"
    ).first()

    if not session:
        raise ValueError(
            "Empathy session not found."
        )

    if session.status == "completed":
        return session

    response = response.strip()

    if not response:
        raise ValueError(
            "Please provide a response."
        )

    result = generate_feedback(
        response
    )

    session.response = response
    session.feedback = result["feedback"]
    session.score = result["score"]

    session.save(
        update_fields=[
            "response",
            "feedback",
            "score",
        ]
    )

    module = get_empathy_module()

    if module:

        update_module_progress(
            user=user,
            module=module,
            progress_value=75,
            current_step=2,
        )

    return session


def get_history(user):

    return EmpathySession.objects.filter(
        user=user
    ).select_related(
        "scenario"
    ).order_by(
        "-created_at"
    )


@transaction.atomic
def complete_session(
    user,
    session_id,
):

    session = EmpathySession.objects.filter(
        id=session_id,
        user=user,
    ).first()

    if not session:
        raise ValueError(
            "Empathy session not found."
        )

    module = get_empathy_module()

    if not module:
        raise ValueError(
            "Echoes of Empathy module not found."
        )

    if session.status == "completed":

        return {
            "already_completed": True,
            "session": session,
            "xp_awarded": 0,
        }

    if not session.response:
        raise ValueError(
            "Submit a response before completing."
        )

    if not session.feedback:
        raise ValueError(
            "Please submit your response for feedback first."
        )

    # Fixed: Removed explicit session=None kwarg
    result = complete_module(
        user=user,
        module=module,
        score=session.score,
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
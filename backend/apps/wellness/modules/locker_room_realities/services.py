from django.db import transaction
from django.utils import timezone

from .models import (
    LockerRoomScenario,
    LockerRoomSession,
)

from apps.wellness.models import WellnessModule

from apps.wellness.services import (
    get_user_progress,
    is_module_unlocked,
    update_module_progress,
    complete_module,
)


def get_module():

    return WellnessModule.objects.filter(
        slug="locker-room-realities",
        status="active",
    ).first()


def get_scenarios():

    return LockerRoomScenario.objects.filter(
        is_active=True
    ).order_by(
        "order",
        "id"
    )


def start_session(
    user,
    scenario_id
):

    module = get_module()

    if not module:
        raise ValueError(
            "Locker Room Realities module not found."
        )

    if not is_module_unlocked(user, module):
        raise ValueError(
            "This module is locked."
        )

    scenario = LockerRoomScenario.objects.filter(
        id=scenario_id,
        is_active=True
    ).first()

    if not scenario:
        raise ValueError(
            "Scenario not found."
        )

    progress = get_user_progress(
        user,
        module
    )

    if progress.status == "completed":
        raise ValueError(
            "Module already completed."
        )

    session = LockerRoomSession.objects.create(
        user=user,
        scenario=scenario
    )

    update_module_progress(
        user=user,
        module=module,
        progress_value=25,
        current_step=1
    )

    return session


def submit_decision(
    user,
    session_id,
    choice
):

    session = LockerRoomSession.objects.filter(
        id=session_id,
        user=user
    ).select_related(
        "scenario"
    ).first()

    if not session:
        raise ValueError(
            "Session not found."
        )

    if session.status == "completed":
        return session

    scenario = session.scenario

    if choice >= len(scenario.choices):
        raise ValueError(
            "Invalid choice."
        )

    session.selected_choice = choice

    if choice == scenario.correct_choice:

        session.score = 100

        session.evaluation = (
            "Excellent decision. "
            + scenario.explanation
        )

    else:

        session.score = 50

        session.evaluation = (
            "This decision could be improved. "
            + scenario.explanation
        )

    session.save(
        update_fields=[
            "selected_choice",
            "score",
            "evaluation",
        ]
    )

    module = get_module()

    if module:

        update_module_progress(
            user=user,
            module=module,
            progress_value=75,
            current_step=2
        )

    return session


def get_history(user):

    return LockerRoomSession.objects.filter(
        user=user
    ).select_related(
        "scenario"
    ).order_by(
        "-created_at"
    )


@transaction.atomic
def complete_session(
    user,
    session_id
):

    session = LockerRoomSession.objects.filter(
        id=session_id,
        user=user
    ).first()

    if not session:
        raise ValueError(
            "Session not found."
        )

    module = get_module()

    if not module:
        raise ValueError(
            "Module not found."
        )

    if session.status == "completed":

        return {
            "already_completed": True,
            "session": session,
            "xp_awarded": 0,
        }

    if session.selected_choice is None:

        raise ValueError(
            "Make a decision before completing."
        )

    result = complete_module(
        user=user,
        module=module,
        score=session.score
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
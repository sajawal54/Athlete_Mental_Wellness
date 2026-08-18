import random

from django.db import transaction
from django.utils import timezone

from .models import (
    ReactionPrompt,
    ReactionGameSession,
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
        slug="reaction-zone",
        status="active",
    ).first()


def get_random_prompt():

    prompts = list(
        ReactionPrompt.objects.filter(
            is_active=True
        )
    )

    if not prompts:
        return None

    return random.choice(prompts)


def start_game(user):

    module = get_module()

    if not module:
        raise ValueError(
            "Reaction Zone module not found."
        )

    if not is_module_unlocked(
        user,
        module
    ):
        raise ValueError(
            "Reaction Zone is locked."
        )

    progress = get_user_progress(
        user,
        module
    )

    if progress.status == "completed":
        raise ValueError(
            "Reaction Zone is already completed."
        )

    prompt = get_random_prompt()

    if not prompt:
        raise ValueError(
            "No reaction prompts available."
        )

    session = ReactionGameSession.objects.create(
        user=user,
        total_prompts=0,
    )

    update_module_progress(
        user=user,
        module=module,
        progress_value=25,
        current_step=1
    )

    return session, prompt


def submit_answer(
    user,
    session_id,
    prompt_id,
    answer,
    reaction_time,
):

    session = ReactionGameSession.objects.filter(
        id=session_id,
        user=user
    ).first()

    if not session:
        raise ValueError(
            "Game session not found."
        )

    if session.status == "completed":
        raise ValueError(
            "Game already completed."
        )

    prompt = ReactionPrompt.objects.filter(
        id=prompt_id,
        is_active=True
    ).first()

    if not prompt:
        raise ValueError(
            "Prompt not found."
        )

    session.total_prompts += 1

    if answer.strip().lower() == (
        prompt.correct_answer.strip().lower()
    ):

        session.correct_answers += 1

        # Faster reaction = more points
        if reaction_time <= 1:
            points = 100

        elif reaction_time <= 2:
            points = 75

        elif reaction_time <= 3:
            points = 50

        else:
            points = 25

        session.score += points

        correct = True

    else:

        correct = False

    session.duration_seconds += int(
        reaction_time
    )

    session.save()

    module = get_module()

    if module:

        update_module_progress(
            user=user,
            module=module,
            progress_value=min(
                90,
                25 + (
                    session.total_prompts * 15
                )
            ),
            current_step=(
                session.total_prompts + 1
            )
        )

    return {
        "session": session,
        "correct": correct,
        "score": session.score,
        "next_prompt": get_random_prompt(),
    }


def get_leaderboard():

    return ReactionGameSession.objects.filter(
        status="completed"
    ).select_related(
        "user"
    ).order_by(
        "-score",
        "created_at"
    )[:10]


def get_history(user):

    return ReactionGameSession.objects.filter(
        user=user
    ).order_by(
        "-created_at"
    )


@transaction.atomic
def complete_game(
    user,
    session_id
):

    session = ReactionGameSession.objects.filter(
        id=session_id,
        user=user
    ).first()

    if not session:
        raise ValueError(
            "Game session not found."
        )

    module = get_module()

    if not module:
        raise ValueError(
            "Reaction Zone module not found."
        )

    if session.status == "completed":

        return {
            "already_completed": True,
            "session": session,
            "xp_awarded": 0,
        }

    if session.total_prompts < 1:

        raise ValueError(
            "Play at least one round first."
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
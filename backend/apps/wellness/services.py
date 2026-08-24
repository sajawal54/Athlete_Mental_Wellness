from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.accounts.models import Profile
from apps.gamification.models import XPHistory
from apps.gamification.service import award_xp

from .models import (
    WellnessModule,
    UserModuleProgress,
    WellnessSession,
    WellnessCompletion,
)


SAFETY_DISCLAIMER = (
    "This tool is designed for educational reflection and mental performance "
    "training. If you are experiencing severe distress or crisis, please "
    "connect with a licensed mental health professional or counselor."
)


# =============================================================
# XP / GAMIFICATION HELPERS
# =============================================================

def get_user_total_xp(user):
    """
    Return the user's current XP.

    Profile.xp is the primary source because award_xp() updates
    the Profile directly.

    XPHistory is used as a fallback only when the profile is
    unavailable.
    """

    try:
        profile = Profile.objects.filter(user=user).first()

        if profile is not None:
            return int(profile.xp or 0)

    except Exception:
        pass

    result = (
        XPHistory.objects
        .filter(user=user)
        .aggregate(total_xp=Sum("amount"))
    )

    return int(result["total_xp"] or 0)


def is_module_unlocked(user, module):
    """
    Determine whether the user has enough XP to access a module.
    """

    required_xp = int(module.required_xp or 0)

    if required_xp <= 0:
        return True

    total_xp = get_user_total_xp(user)

    return total_xp >= required_xp


# =============================================================
# MODULE LOOKUP
# =============================================================

def get_module_by_slug(slug):
    """
    Safely find an active module by slug.

    Supports:
        word-grid
        word_grid
        WORD-GRID
    """

    if not slug:
        return None

    raw_slug = str(slug).strip().lower()

    normalized = raw_slug.replace("_", "-")
    underscore_slug = raw_slug.replace("-", "_")

    return (
        WellnessModule.objects
        .filter(
            slug=normalized,
            status="active",
        )
        .first()
        or WellnessModule.objects
        .filter(
            slug=raw_slug,
            status="active",
        )
        .first()
        or WellnessModule.objects
        .filter(
            slug=underscore_slug,
            status="active",
        )
        .first()
    )


# =============================================================
# USER MODULE PROGRESS
# =============================================================

def get_user_progress(user, module):
    """
    Get or create the user's progress for a module.

    Modules are repeatable on a daily basis. 
    A robust check ensures that if the last completion date was 
    before today, status resets to 'available' and progress clears out.
    """

    today = timezone.localdate()

    progress = (
        UserModuleProgress.objects
        .filter(
            user=user,
            module=module,
        )
        .first()
    )

    if not progress:
        initial_status = (
            "available"
            if is_module_unlocked(user, module)
            else "locked"
        )

        return UserModuleProgress.objects.create(
            user=user,
            module=module,
            status=initial_status,
            progress=0,
            current_step=0,
        )

    # ---------------------------------------------------------
    # DAILY RESET CHECK (Robust evaluation using completion/progress dates)
    # ---------------------------------------------------------

    if progress.status == "completed":
        # Check either progress.completed_at or the latest WellnessCompletion record for today
        last_completion = (
            WellnessCompletion.objects
            .filter(user=user, module=module)
            .order_by("-completed_at")
            .first()
        )

        completed_date = None
        if last_completion and last_completion.completion_date:
            completed_date = last_completion.completion_date
        elif progress.completed_at:
            completed_date = timezone.localtime(progress.completed_at).date()

        # If completed on a previous day, trigger full daily reset
        if completed_date and completed_date < today:
            new_status = (
                "available"
                if is_module_unlocked(user, module)
                else "locked"
            )

            progress.status = new_status
            progress.progress = 0
            progress.current_step = 0
            progress.started_at = None
            progress.completed_at = None

            progress.save(
                update_fields=[
                    "status",
                    "progress",
                    "current_step",
                    "started_at",
                    "completed_at",
                    "updated_at",
                ]
            )

            return progress

    # ---------------------------------------------------------
    # KEEP CURRENT STATE
    # ---------------------------------------------------------

    if progress.status in [
        "completed",
        "in_progress",
    ]:
        return progress

    # ---------------------------------------------------------
    # REFRESH LOCKED / AVAILABLE STATE
    # ---------------------------------------------------------

    expected_status = (
        "available"
        if is_module_unlocked(user, module)
        else "locked"
    )

    if progress.status != expected_status:
        progress.status = expected_status

        progress.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

    return progress


def get_module_status(user, module):
    """
    Return the current module status.
    """

    progress = get_user_progress(user, module)

    return progress.status


def get_user_module_progress(user):
    """
    Return progress for every active wellness module.

    Daily reset is evaluated for each module.
    """

    modules = (
        WellnessModule.objects
        .filter(status="active")
        .order_by("order", "name")
    )

    progress_list = []

    for module in modules:
        progress_list.append(
            get_user_progress(
                user,
                module,
            )
        )

    return progress_list


# =============================================================
# START MODULE
# =============================================================

@transaction.atomic
def start_module(user, module):
    """
    Start a wellness module.

    Existing unfinished sessions are reused.
    Completed sessions are never reused.
    """

    if not is_module_unlocked(user, module):
        progress = get_user_progress(
            user,
            module,
        )

        if progress.status != "locked":
            progress.status = "locked"

            progress.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

        raise ValueError(
            f"You need at least {module.required_xp} XP "
            f"to unlock {module.name}."
        )

    progress = (
        UserModuleProgress.objects
        .select_for_update()
        .get(
            id=get_user_progress(
                user,
                module,
            ).id
        )
    )

    if progress.status == "available":
        progress.status = "in_progress"

        if not progress.started_at:
            progress.started_at = timezone.now()

        progress.save(
            update_fields=[
                "status",
                "started_at",
                "updated_at",
            ]
        )

    # ---------------------------------------------------------
    # FIND ACTIVE SESSION (Ensure it's fresh for today if reset happened)
    # ---------------------------------------------------------

    active_session = (
        WellnessSession.objects
        .filter(
            user=user,
            module=module,
            is_completed=False,
        )
        .order_by("-started_at")
        .first()
    )

    if not active_session:
        active_session = WellnessSession.objects.create(
            user=user,
            module=module,
        )

    return progress, active_session


# =============================================================
# UPDATE MODULE PROGRESS
# =============================================================

def update_module_progress(
    user,
    module,
    progress_value=None,
    current_step=None,
    session_data=None,
):
    """
    Update module progress and active session data.
    """

    if not is_module_unlocked(user, module):
        raise ValueError(
            f"You need {module.required_xp} XP "
            f"to access this module."
        )

    progress = get_user_progress(
        user,
        module,
    )

    if progress.status == "locked":
        raise ValueError(
            "This module is currently locked."
        )

    if progress.status == "available":
        progress.status = "in_progress"

        if not progress.started_at:
            progress.started_at = timezone.now()

    if progress_value is not None:
        try:
            progress_value = float(progress_value)
        except (TypeError, ValueError):
            raise ValueError(
                "Progress must be a valid number."
            )

        progress.progress = max(
            0,
            min(
                100,
                int(progress_value),
            ),
        )

    if current_step is not None:
        try:
            progress.current_step = max(
                0,
                int(current_step),
            )
        except (TypeError, ValueError):
            raise ValueError(
                "Current step must be a valid number."
            )

    progress.save()

    if (
        session_data is not None
        and isinstance(session_data, dict)
    ):
        active_session = (
            WellnessSession.objects
            .filter(
                user=user,
                module=module,
                is_completed=False,
            )
            .order_by("-started_at")
            .first()
        )

        if active_session:
            existing_data = (
                active_session.data
                if isinstance(active_session.data, dict)
                else {}
            )

            existing_data.update(session_data)

            active_session.data = existing_data

            active_session.save(
                update_fields=["data"]
            )

    return progress


# =============================================================
# COMPLETE MODULE
# =============================================================

@transaction.atomic
def complete_module(
    user,
    module,
    session=None,
    score=0,
):
    """
    Complete a wellness module and award XP safely.
    Fixed issue: Ensure xp_awarded is properly returned in both
    new completion and duplicate fallback scenarios.
    """

    if not is_module_unlocked(user, module):
        raise ValueError(
            f"You need {module.required_xp} XP "
            f"to complete this module."
        )

    today = timezone.localdate()
    xp_to_award = int(module.xp_reward or 0)

    progress = (
        UserModuleProgress.objects
        .select_for_update()
        .filter(
            user=user,
            module=module,
        )
        .first()
    )

    if not progress:
        progress = UserModuleProgress.objects.create(
            user=user,
            module=module,
            status="available",
            progress=0,
            current_step=0,
        )

    existing_completion = (
        WellnessCompletion.objects
        .filter(
            user=user,
            module=module,
            completion_date=today,
        )
        .order_by("-completed_at")
        .first()
    )

    if existing_completion:
        return {
            "already_completed": True,
            "progress": progress,
            "completion": existing_completion,
            "xp_awarded": int(existing_completion.xp_awarded or xp_to_award),
        }

    try:
        score = max(
            0,
            int(float(score)),
        )
    except (TypeError, ValueError):
        score = 0

    now = timezone.now()

    if session is None:
        session = (
            WellnessSession.objects
            .filter(
                user=user,
                module=module,
                is_completed=False,
            )
            .order_by("-started_at")
            .first()
        )

    if session is None:
        session = WellnessSession.objects.create(
            user=user,
            module=module,
        )

    session.score = score
    session.is_completed = True
    session.completed_at = now
    session.save(
        update_fields=[
            "score",
            "is_completed",
            "completed_at",
        ]
    )

    progress.status = "completed"
    progress.progress = 100
    progress.completed_at = now

    if not progress.started_at:
        progress.started_at = now

    progress.save()

    completion, created = (
        WellnessCompletion.objects.get_or_create(
            user=user,
            module=module,
            completion_date=today,
            defaults={
                "session": session,
                "xp_awarded": xp_to_award,
            },
        )
    )

    if not created:
        return {
            "already_completed": True,
            "progress": progress,
            "completion": completion,
            "xp_awarded": int(completion.xp_awarded or xp_to_award),
        }

    if xp_to_award > 0:
        award_result = award_xp(
            user=user,
            amount=xp_to_award,
            source="wellness",
            description=(
                f"Completed {module.name}"
            ),
        )

        completion.xp_awarded = xp_to_award
        completion.save(
            update_fields=["xp_awarded"]
        )

    return {
        "already_completed": False,
        "progress": progress,
        "completion": completion,
        "xp_awarded": xp_to_award,
    }


# =============================================================
# OPTIONAL: USER MODULES
# =============================================================

def get_user_modules(user):
    """
    Return all active modules with their current progress.
    """

    modules = (
        WellnessModule.objects
        .filter(status="active")
        .order_by("order", "name")
    )

    results = []

    for module in modules:
        progress = get_user_progress(
            user,
            module,
        )

        results.append(
            {
                "module": module,
                "progress": progress,
                "status": progress.status,
                "unlocked": (
                    progress.status != "locked"
                ),
            }
        )

    return results


# =============================================================
# COGNITIVE / AI EVALUATION ENGINES
# =============================================================

def generate_setback_reframe(
    thought,
    category="performance",
):
    cleaned = (thought or "").strip()
    lower = cleaned.lower()

    is_catastrophic = any(
        word in lower
        for word in [
            "ruined",
            "finished",
            "hopeless",
            "disaster",
            "never recover",
            "end of my career",
        ]
    )

    is_self_blame = any(
        word in lower
        for word in [
            "useless",
            "failure",
            "hate myself",
            "loser",
            "can't do anything right",
        ]
    )

    is_performance_pressure = any(
        word in lower
        for word in [
            "choked",
            "let everyone down",
            "can't handle pressure",
            "embarrassed",
            "bench",
        ]
    )

    if is_catastrophic:
        reframe = (
            "A single difficult moment feels permanent right now, "
            "but sports careers are defined by how you respond over "
            "time. This outcome is a chapter, not the entire story. "
            "Treat this as vital data to calibrate your next training block."
        )

        action_step = (
            "Focus on the next 24 hours: prioritize sleep, recovery "
            "nutrition, and 1 specific tactical review with your coach."
        )

    elif is_self_blame:
        reframe = (
            "Separate your identity from an imperfect performance. "
            "Making mistakes is an essential condition for elite mastery. "
            "Your worth as an athlete remains intact regardless of today's outcome."
        )

        action_step = (
            "Write down 2 things you executed well under pressure, "
            "and 1 adjustment you will test in practice tomorrow."
        )

    elif is_performance_pressure:
        reframe = (
            "High expectations create real psychological weight. "
            "The fact that you care deeply is an asset when channeled "
            "constructively. Shift your attention from defending a "
            "reputation to executing the process step by step."
        )

        action_step = (
            "Take 3 diaphragmatic breaths and focus exclusively on "
            "what is within your 100% control: effort, attitude, and preparation."
        )

    else:
        reframe = (
            f"This challenge highlights an area for growth. "
            f"Rather than viewing '{cleaned}' as a barrier, "
            "reframe it as an opportunity to build resilience and "
            "competitive depth."
        )

        action_step = (
            "Identify one controllable variable you can take ownership of today."
        )

    return {
        "reframe": reframe,
        "action_step": action_step,
        "safety_message": SAFETY_DISCLAIMER,
    }


def analyze_self_talk(thought):
    text = (thought or "").strip()
    lower = text.lower()

    if any(
        word in lower
        for word in [
            "always",
            "never",
            "every time",
            "completely",
        ]
    ):
        distortion = "all_or_nothing"
        distortion_label = "All-or-Nothing Thinking"

        analysis = (
            "You're viewing this situation in absolute extremes. "
            "In elite sport, performance is on a spectrum, not black and white."
        )

        rewrite = (
            "Sometimes things don't go to plan, but I have consistently "
            "overcome setbacks before and know how to adapt."
        )

        tip = (
            "Notice when words like 'always' or 'never' appear and "
            "replace them with 'in this specific instance'."
        )

    elif any(
        word in lower
        for word in [
            "ruined",
            "disaster",
            "catastrophe",
            "terrible",
            "worst",
        ]
    ):
        distortion = "catastrophizing"
        distortion_label = "Catastrophizing"

        analysis = (
            "You're anticipating the absolute worst possible outcome "
            "before all facts are known."
        )

        rewrite = (
            "This is a temporary obstacle. I can handle discomfort "
            "and take proactive steps to stabilize the situation."
        )

        tip = (
            "Ask yourself: 'What is the most realistic outcome, "
            "and what is my plan to navigate it?'"
        )

    elif any(
        word in lower
        for word in [
            "should have",
            "must",
            "ought to",
            "supposed to",
        ]
    ):
        distortion = "should_statements"
        distortion_label = "Should / Must Demands"

        analysis = (
            "Imposing rigid demands creates guilt and unnecessary psychological strain."
        )

        rewrite = (
            "I prefer everything to go flawlessly, but I accept reality "
            "as it is and focus on my next decision."
        )

        tip = (
            "Change 'I should have known' into "
            "'Now that I know, here is how I will respond'."
        )

    elif any(
        word in lower
        for word in [
            "everyone thinks",
            "they think i am",
            "coach hates me",
        ]
    ):
        distortion = "mind_reading"
        distortion_label = "Mind Reading"

        analysis = (
            "Assuming others have negative judgments about your "
            "performance without direct confirmation."
        )

        rewrite = (
            "I cannot control other people's perceptions. "
            "My job is to focus on team communication and high-effort execution."
        )

        tip = (
            "Stick strictly to observable facts rather than imagined opinions."
        )

    else:
        distortion = "personalization"
        distortion_label = "Personalization / Blaming"

        analysis = (
            "Taking excessive personal responsibility for factors "
            "influenced by teamwork, conditions, or chance."
        )

        rewrite = (
            "I take ownership of my role while acknowledging the "
            "multifaceted nature of competitive performance."
        )

        tip = (
            "Draw a circle and divide responsibility fairly among "
            "all contributing elements."
        )

    return {
        "distortion_type": distortion,
        "distortion_label": distortion_label,
        "analysis": analysis,
        "suggested_rewrite": rewrite,
        "actionable_tip": tip,
    }


def evaluate_empathy_response(
    scenario,
    user_response,
    choice_index=None,
):
    text = (user_response or "").strip()
    lower = text.lower()

    has_validation = any(
        word in lower
        for word in [
            "hear you",
            "understand",
            "must be tough",
            "frustrating",
            "valid",
            "with you",
            "got your back",
        ]
    )

    has_curiosity = any(
        word in lower
        for word in [
            "how can i help",
            "what do you need",
            "tell me more",
            "how are you feeling",
        ]
    )

    has_blame = any(
        word in lower
        for word in [
            "your fault",
            "get over it",
            "stop whining",
            "not my problem",
            "soft",
        ]
    )

    score = 75

    if has_validation:
        score += 15

    if has_curiosity:
        score += 10

    if has_blame:
        score -= 40

    score = max(
        20,
        min(100, score),
    )

    if score >= 85:
        feedback = (
            "Outstanding empathetic communication! You validated "
            "the athlete's emotional state, offered collaborative "
            "support, and reinforced team cohesion without being dismissive."
        )

    elif score >= 60:
        feedback = (
            "Good response. You acknowledged the situation constructively. "
            "To elevate this further, try asking an open-ended question "
            "like 'What would help you feel most supported right now?'"
        )

    else:
        feedback = (
            "Your response may come across as dismissive or confrontational. "
            "In high-pressure team environments, leading with active listening "
            "and calm reassurance de-escalates conflict faster."
        )

    return {
        "score": score,
        "feedback": feedback,
        "metrics": {
            "active_listening": (
                90 if has_validation else 70
            ),
            "emotional_validation": (
                95 if has_validation else 65
            ),
            "constructive_tone": (
                40 if has_blame else 90
            ),
        },
    }
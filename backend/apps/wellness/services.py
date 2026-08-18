import re
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
    "This tool is designed for educational reflection and mental performance training. "
    "If you are experiencing severe distress or crisis, please connect with a licensed mental health professional or counselor."
)


def get_user_total_xp(user):
    """
    Get user total XP from Profile first, falling back to sum of XPHistory.
    """
    try:
        profile = Profile.objects.filter(user=user).first()
        if profile and profile.xp is not None:
            return profile.xp
    except Exception:
        pass

    result = XPHistory.objects.filter(user=user).aggregate(total_xp=Sum("amount"))
    return result["total_xp"] or 0


def is_module_unlocked(user, module):
    """
    Check if the user has unlocked the module based on required XP.
    """
    if module.required_xp <= 0:
        return True
    total_xp = get_user_total_xp(user)
    return total_xp >= module.required_xp


def get_module_status(user, module):
    """
    Returns: 'completed', 'in_progress', 'available', or 'locked'.
    """
    progress = UserModuleProgress.objects.filter(user=user, module=module).first()

    if progress and progress.status == "completed":
        return "completed"

    if progress and progress.status == "in_progress":
        return "in_progress"

    if not is_module_unlocked(user, module):
        return "locked"

    return "available"


def get_user_progress(user, module):
    """
    Retrieve or create the user's progress record with the proper status.
    """
    existing_progress = UserModuleProgress.objects.filter(user=user, module=module).first()

    if existing_progress:
        if existing_progress.status in ["completed", "in_progress"]:
            return existing_progress

        new_status = "available" if is_module_unlocked(user, module) else "locked"
        if existing_progress.status != new_status:
            existing_progress.status = new_status
            existing_progress.save(update_fields=["status", "updated_at"])
        return existing_progress

    initial_status = "available" if is_module_unlocked(user, module) else "locked"
    return UserModuleProgress.objects.create(
        user=user,
        module=module,
        status=initial_status,
        progress=0,
        current_step=0,
    )


def start_module(user, module):
    """
    Start or restore a wellness module session.
    """
    if not is_module_unlocked(user, module):
        progress = get_user_progress(user, module)
        if progress.status != "locked":
            progress.status = "locked"
            progress.save(update_fields=["status", "updated_at"])
        raise ValueError(f"You need at least {module.required_xp} XP to unlock {module.name}.")

    progress = get_user_progress(user, module)

    if progress.status == "available":
        progress.status = "in_progress"
        if not progress.started_at:
            progress.started_at = timezone.now()
        progress.save(update_fields=["status", "started_at", "updated_at"])

    # Find existing active session or create new one
    active_session = WellnessSession.objects.filter(
        user=user,
        module=module,
        is_completed=False,
    ).order_by("-started_at").first()

    if not active_session:
        active_session = WellnessSession.objects.create(
            user=user,
            module=module,
        )

    return progress, active_session


def update_module_progress(user, module, progress_value=None, current_step=None, session_data=None):
    """
    Persist step progress and session state.
    """
    if not is_module_unlocked(user, module):
        raise ValueError(f"You need {module.required_xp} XP to access this module.")

    progress = get_user_progress(user, module)

    if progress.status == "locked":
        raise ValueError("This module is currently locked.")

    if progress.status == "available":
        progress.status = "in_progress"
        if not progress.started_at:
            progress.started_at = timezone.now()

    if progress_value is not None:
        progress.progress = max(0, min(100, int(progress_value)))

    if current_step is not None:
        progress.current_step = max(0, int(current_step))

    progress.save()

    # Update session data if provided
    if session_data is not None and isinstance(session_data, dict):
        active_session = WellnessSession.objects.filter(
            user=user,
            module=module,
            is_completed=False,
        ).order_by("-started_at").first()

        if active_session:
            active_session.data.update(session_data)
            active_session.save(update_fields=["data"])

    return progress


@transaction.atomic
def complete_module(user, module, session=None, score=0):
    """
    Complete a wellness module, award XP idempotently, and update gamification.
    """
    if not is_module_unlocked(user, module):
        raise ValueError(f"You need {module.required_xp} XP to complete this module.")

    progress = get_user_progress(user, module)

    # If already completed, return existing completion without duplicate rewards
    if progress.status == "completed":
        existing_completion = WellnessCompletion.objects.filter(
            user=user,
            module=module,
        ).select_related("session").first()

        return {
            "already_completed": True,
            "progress": progress,
            "completion": existing_completion,
            "xp_awarded": 0,
        }

    # Use or create session
    if session is None:
        session = WellnessSession.objects.filter(
            user=user,
            module=module,
            is_completed=False,
        ).order_by("-started_at").first()

        if not session:
            session = WellnessSession.objects.create(
                user=user,
                module=module,
            )

    try:
        score = max(0, int(score))
    except (TypeError, ValueError):
        score = 0

    # Mark session completed
    session.score = score
    session.is_completed = True
    session.completed_at = timezone.now()
    session.save(update_fields=["score", "is_completed", "completed_at"])

    # Update progress record
    progress.status = "completed"
    progress.progress = 100
    progress.completed_at = timezone.now()
    if not progress.started_at:
        progress.started_at = timezone.now()
    progress.save()

    # Create completion record
    completion, created = WellnessCompletion.objects.get_or_create(
        user=user,
        module=module,
        defaults={
            "session": session,
            "xp_awarded": module.xp_reward,
        },
    )

    xp_awarded = module.xp_reward if created else 0

    # Award XP and check badges via core gamification service
    if created and module.xp_reward > 0:
        award_xp(
            user=user,
            amount=module.xp_reward,
            source="wellness",
            description=f"Completed {module.name}",
        )

    return {
        "already_completed": not created,
        "progress": progress,
        "completion": completion,
        "xp_awarded": xp_awarded,
    }


def get_user_module_progress(user):
    """
    Return all module progress records for the user.
    """
    return (
        UserModuleProgress.objects.filter(user=user)
        .select_related("module")
        .order_by("module__order", "module__name")
    )


def get_module_by_slug(slug):
    """
    Lookup active wellness module by slug or normalized string.
    """
    if not slug:
        return None
    normalized = str(slug).strip().lower().replace("_", "-")
    return (
        WellnessModule.objects.filter(slug=normalized, status="active").first()
        or WellnessModule.objects.filter(slug=slug, status="active").first()
        or WellnessModule.objects.filter(
            slug__in=[slug, normalized, str(slug).replace("-", "_")],
            status="active",
        ).order_by("order").first()
    )


# -------------------------------------------------------------
# Cognitive & AI Evaluation Engines with Fallback & Safety
# -------------------------------------------------------------

def generate_setback_reframe(thought, category="performance"):
    """
    Intelligent cognitive restructuring engine for setbacks.
    """
    cleaned = (thought or "").strip()
    lower = cleaned.lower()

    # Identify cognitive bias keywords
    is_catastrophic = any(w in lower for w in ["ruined", "finished", "hopeless", "disaster", "never recover", "end of my career"])
    is_self_blame = any(w in lower for w in ["useless", "failure", "hate myself", "loser", "can't do anything right"])
    is_performance_pressure = any(w in lower for w in ["choked", "let everyone down", "can't handle pressure", "embarrassed", "bench"])

    if is_catastrophic:
        reframe = (
            "A single difficult moment feels permanent right now, but sports careers are defined by how you respond over time. "
            "This outcome is a chapter, not the entire story. Treat this as vital data to calibrate your next training block."
        )
        action_step = "Focus on the next 24 hours: prioritize sleep, recovery nutrition, and 1 specific tactical review with your coach."
    elif is_self_blame:
        reframe = (
            "Separate your identity from an imperfect performance. Making mistakes is an essential condition for elite mastery. "
            "Your worth as an athlete remains intact regardless of today's outcome."
        )
        action_step = "Write down 2 things you executed well under pressure, and 1 adjustment you will test in practice tomorrow."
    elif is_performance_pressure:
        reframe = (
            "High expectations create real psychological weight. The fact that you care deeply is an asset when channeled constructively. "
            "Shift your attention from defending a reputation to executing the process step by step."
        )
        action_step = "Take 3 diaphragmatic breaths and focus exclusively on what is within your 100% control: effort, attitude, and preparation."
    else:
        reframe = (
            f"This challenge highlights an area for growth. Rather than viewing '{cleaned}' as a barrier, "
            "reframe it as an opportunity to build resilience and competitive depth."
        )
        action_step = "Identify one controllable variable you can take ownership of today."

    return {
        "reframe": reframe,
        "action_step": action_step,
        "safety_message": SAFETY_DISCLAIMER,
    }


def analyze_self_talk(thought):
    """
    Cognitive distortion analyzer and positive restructuring engine.
    """
    text = (thought or "").strip()
    lower = text.lower()

    if any(w in lower for w in ["always", "never", "every time", "completely"]):
        distortion = "all_or_nothing"
        distortion_label = "All-or-Nothing Thinking"
        analysis = "You're viewing this situation in absolute extremes. In elite sport, performance is on a spectrum, not black and white."
        rewrite = "Sometimes things don't go to plan, but I have consistently overcome setbacks before and know how to adapt."
        tip = "Notice when words like 'always' or 'never' appear and replace them with 'in this specific instance'."
    elif any(w in lower for w in ["ruined", "disaster", "catastrophe", "terrible", "worst"]):
        distortion = "catastrophizing"
        distortion_label = "Catastrophizing"
        analysis = "You're anticipating the absolute worst possible outcome before all facts are known."
        rewrite = "This is a temporary obstacle. I can handle discomfort and take proactive steps to stabilize the situation."
        tip = "Ask yourself: 'What is the most realistic outcome, and what is my plan to navigate it?'"
    elif any(w in lower for w in ["should have", "must", "ought to", "supposed to"]):
        distortion = "should_statements"
        distortion_label = "Should / Must Demands"
        analysis = "Imposing rigid demands creates guilt and unnecessary psychological strain."
        rewrite = "I prefer everything to go flawlessly, but I accept reality as it is and focus on my next decision."
        tip = "Change 'I should have known' into 'Now that I know, here is how I will respond'."
    elif any(w in lower for w in ["everyone thinks", "they think i am", "coach hates me"]):
        distortion = "mind_reading"
        distortion_label = "Mind Reading"
        analysis = "Assuming others have negative judgments about your performance without direct confirmation."
        rewrite = "I cannot control other people's perceptions. My job is to focus on team communication and high-effort execution."
        tip = "Stick strictly to observable facts rather than imagined opinions."
    else:
        distortion = "personalization"
        distortion_label = "Personalization / Blaming"
        analysis = "Taking excessive personal responsibility for factors influenced by teamwork, conditions, or chance."
        rewrite = "I take ownership of my role while acknowledging the multifaceted nature of competitive performance."
        tip = "Draw a circle and divide responsibility fairly among all contributing elements."

    return {
        "distortion_type": distortion,
        "distortion_label": distortion_label,
        "analysis": analysis,
        "suggested_rewrite": rewrite,
        "actionable_tip": tip,
    }


def evaluate_empathy_response(scenario, user_response, choice_index=None):
    """
    Dialogue and empathy feedback generator.
    """
    text = (user_response or "").strip()
    lower = text.lower()

    has_validation = any(w in lower for w in ["hear you", "understand", "must be tough", "frustrating", "valid", "with you", "got your back"])
    has_curiosity = any(w in lower for w in ["how can i help", "what do you need", "tell me more", "how are you feeling"])
    has_blame = any(w in lower for w in ["your fault", "get over it", "stop whining", "not my problem", "soft"])

    score = 75
    if has_validation:
        score += 15
    if has_curiosity:
        score += 10
    if has_blame:
        score -= 40

    score = max(20, min(100, score))

    if score >= 85:
        feedback = (
            "Outstanding empathetic communication! You validated the athlete's emotional state, "
            "offered collaborative support, and reinforced team cohesion without being dismissive."
        )
    elif score >= 60:
        feedback = (
            "Good response. You acknowledged the situation constructively. "
            "To elevate this further, try asking an open-ended question like 'What would help you feel most supported right now?'"
        )
    else:
        feedback = (
            "Your response may come across as dismissive or confrontational. "
            "In high-pressure team environments, leading with active listening and calm reassurance de-escalates conflict faster."
        )

    return {
        "score": score,
        "feedback": feedback,
        "metrics": {
            "active_listening": 90 if has_validation else 70,
            "emotional_validation": 95 if has_validation else 65,
            "constructive_tone": 40 if has_blame else 90,
        },
    }
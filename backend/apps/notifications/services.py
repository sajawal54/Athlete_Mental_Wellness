from .models import (
    Notification,
    NotificationPreference,
)


def get_notification_preferences(user):
    """
    Get notification preferences for a user.
    Creates default preferences automatically if they don't exist.
    """

    preferences, _ = NotificationPreference.objects.get_or_create(
        user=user
    )

    return preferences


def is_notification_allowed(user, notification_type):
    """
    Check whether a notification type is allowed for the user.
    """

    preferences = get_notification_preferences(user)

    # Master switch
    if not preferences.notifications_enabled:
        return False

    # Category-specific switches
    if notification_type == "goal":
        return preferences.goal_reminders

    if notification_type == "wellness":
        return preferences.wellness_updates

    if notification_type in ["achievement", "streak"]:
        return preferences.achievement_updates

    if notification_type == "security":
        return preferences.security_notifications

    # Support, mood and system remain enabled
    # as long as the master switch is enabled.
    return True


def create_notification(
    user,
    title,
    message,
    notification_type="system",
    priority="normal",
    action_url=None,
    icon=None,
):
    """
    Create a notification only if the user has enabled
    that notification category.
    """

    if not is_notification_allowed(
        user,
        notification_type,
    ):
        return None

    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        action_url=action_url,
        icon=icon,
    )


def create_achievement_notification(
    user,
    title,
    message,
    action_url="/trophy-room",
):
    return create_notification(
        user=user,
        title=title,
        message=message,
        notification_type="achievement",
        priority="normal",
        action_url=action_url,
        icon="trophy",
    )


def create_level_notification(
    user,
    new_level,
):
    return create_notification(
        user=user,
        title="Level Up!",
        message=f"Congratulations! You reached Level {new_level}.",
        notification_type="achievement",
        priority="normal",
        action_url="/gamification",
        icon="level-up",
    )


def create_streak_notification(
    user,
    streak,
):
    return create_notification(
        user=user,
        title="Streak Updated!",
        message=(
            f"Great work! Your wellness streak is now "
            f"{streak} days."
        ),
        notification_type="streak",
        priority="normal",
        action_url="/dashboard",
        icon="fire",
    )


def create_mood_notification(user):
    return create_notification(
        user=user,
        title="Daily Mood Check-In",
        message="Congratulations! You have checked in your mood.",
        notification_type="mood",
        priority="normal",
        action_url="/mood-checkin",
        icon="mood",
    )


def create_goal_notification(
    user,
    message=None,
):
    if message is None:
        message = "You have daily goals waiting for you."

    return create_notification(
        user=user,
        title="Daily Goal Reminder",
        message=message,
        notification_type="goal",
        priority="normal",
        action_url="/goals",
        icon="goal",
    )


def create_wellness_notification(
    user,
    title,
    message,
    action_url="/modules",
):
    return create_notification(
        user=user,
        title=title,
        message=message,
        notification_type="wellness",
        priority="normal",
        action_url=action_url,
        icon="wellness",
    )


def create_support_notification(
    user,
    title,
    message,
    action_url="/support",
    priority="high",
):
    return create_notification(
        user=user,
        title=title,
        message=message,
        notification_type="support",
        priority=priority,
        action_url=action_url,
        icon="support",
    )


def create_security_notification(
    user,
    title,
    message,
):
    return create_notification(
        user=user,
        title=title,
        message=message,
        notification_type="security",
        priority="high",
        action_url="/settings",
        icon="security",
    )
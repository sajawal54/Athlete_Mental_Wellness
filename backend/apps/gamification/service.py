from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Profile
from apps.goals.models import DailyGoal
from apps.moods.models import MoodLog

from .models import (
    XPHistory,
    Badge,
    UserBadge,
    Reward,
    UserReward,
)


def award_xp(user, amount, source, description=""):

    with transaction.atomic():

        profile, _ = Profile.objects.get_or_create(user=user)

        # Add XP through Profile's existing logic
        profile.add_xp(amount)
        profile.refresh_from_db()

        # Store XP history
        history = XPHistory.objects.create(
            user=user,
            amount=amount,
            source=source,
            description=description,
        )

        # Check newly earned badges
        new_badges = check_and_award_badges(user)

        return {
            "xp": profile.xp,
            "level": profile.level,
            "history": history,
            "new_badges": new_badges,
        }


def award_badge(user, badge):

    already_earned = UserBadge.objects.filter(
        user=user,
        badge=badge,
    ).exists()

    if already_earned:
        return {
            "success": False,
            "message": "User already has this badge.",
        }

    user_badge = UserBadge.objects.create(
        user=user,
        badge=badge,
    )

    return {
        "success": True,
        "message": "Badge awarded successfully.",
        "user_badge": user_badge,
    }


def check_and_award_badges(user):
    profile = Profile.objects.get(user=user)

    completed_goals = DailyGoal.objects.filter(
        user=user,
        is_completed=True
    ).count()

    mood_count = MoodLog.objects.filter(
        user=user
    ).count()

    badges = Badge.objects.all()

    awarded_badges = []

    for badge in badges:
        earned = False

        category = badge.category.strip().lower()

        if category == "xp":
            earned = profile.xp >= badge.requirement_value

        elif category == "streak":
            earned = profile.streak >= badge.requirement_value

        elif category == "goals":
            earned = completed_goals >= badge.requirement_value

        elif category == "mood":
            earned = mood_count >= badge.requirement_value

        if earned:
            result = award_badge(user, badge)

            if result["success"]:
                awarded_badges.append(badge)

    return awarded_badges


def claim_reward(user, reward):

    with transaction.atomic():

        profile = Profile.objects.select_for_update().get(user=user)

        if not reward.is_active:
            return {
                "success": False,
                "message": "This reward is currently unavailable.",
            }

        existing_reward = UserReward.objects.filter(
            user=user,
            reward=reward
        ).first()

        if existing_reward and existing_reward.status in [
            "claimed",
            "redeemed",
        ]:
            return {
                "success": False,
                "message": "You have already claimed this reward.",
            }

        if profile.xp < reward.xp_cost:
            return {
                "success": False,
                "message": "You do not have enough XP.",
            }

        profile.add_xp(-reward.xp_cost)

        user_reward, created = UserReward.objects.get_or_create(
            user=user,
            reward=reward,
            defaults={
                "status": "claimed",
                "claimed_at": timezone.now(),
            },
        )

        if not created:
            user_reward.status = "claimed"
            user_reward.claimed_at = timezone.now()
            user_reward.save(
                update_fields=[
                    "status",
                    "claimed_at",
                ]
            )

        XPHistory.objects.create(
            user=user,
            amount=-reward.xp_cost,
            source="reward_claim",
            description=f"Claimed reward: {reward.name}",
        )

        return {
            "success": True,
            "message": "Reward claimed successfully.",
            "reward": reward.name,
            "xp_spent": reward.xp_cost,
            "remaining_xp": profile.xp,
            "user_reward": {
                "id": user_reward.id,
                "reward_id": user_reward.reward_id,
                "reward_name": user_reward.reward.name,
                "status": user_reward.status,
                "claimed_at": user_reward.claimed_at,
                "redeemed_at": user_reward.redeemed_at,
            },
        }
def redeem_reward(user, user_reward):
    """
    Change a claimed reward into redeemed state.
    """

    with transaction.atomic():

        user_reward = UserReward.objects.select_for_update().get(
            id=user_reward.id,
            user=user,
        )

        if user_reward.status != "claimed":
            return {
                "success": False,
                "message": "Only claimed rewards can be redeemed.",
            }

        user_reward.status = "redeemed"
        user_reward.redeemed_at = timezone.now()

        user_reward.save(
            update_fields=[
                "status",
                "redeemed_at",
            ]
        )

        return {
            "success": True,
            "message": "Reward redeemed successfully.",
            "reward": user_reward.reward.name,
        }
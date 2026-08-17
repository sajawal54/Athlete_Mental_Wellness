from rest_framework import serializers

from .models import (
    XPHistory,
    Badge,
    UserBadge,
    Reward,
    UserReward,
)


class XPHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = XPHistory
        fields = [
            "id",
            "amount",
            "source",
            "description",
            "created_at",
        ]


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = [
            "id",
            "name",
            "description",
            "category",
            "requirement_value",
            "icon",
        ]


class UserBadgeSerializer(serializers.ModelSerializer):
    badge_name = serializers.CharField(
        source="badge.name",
        read_only=True
    )

    badge_description = serializers.CharField(
        source="badge.description",
        read_only=True
    )

    badge_category = serializers.CharField(
        source="badge.category",
        read_only=True
    )

    badge_requirement_value = serializers.CharField(
        source="badge.requirement_value",
        read_only=True
    )

    badge_icon = serializers.CharField(
        source="badge.icon",
        read_only=True
    )

    class Meta:
        model = UserBadge
        fields = [
            "id",
            "badge_name",
            "badge_description",
            "badge_category",
            "badge_requirement_value",
            "badge_icon",
            "earned_at",
        ]


class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = [
            "id",
            "name",
            "description",
            "xp_cost",
            "is_active",
        ]


class UserRewardSerializer(serializers.ModelSerializer):
    reward_name = serializers.CharField(
        source="reward.name",
        read_only=True
    )

    reward_description = serializers.CharField(
        source="reward.description",
        read_only=True
    )

    xp_cost = serializers.IntegerField(
        source="reward.xp_cost",
        read_only=True
    )

    reward_active = serializers.BooleanField(
        source="reward.is_active",
        read_only=True
    )

    class Meta:
        model = UserReward
        fields = [
            "id",
            "reward_name",
            "reward_description",
            "xp_cost",
            "reward_active",
            "status",
            "claimed_at",
            "redeemed_at",
        ]
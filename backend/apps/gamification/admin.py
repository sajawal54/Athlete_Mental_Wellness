from django.contrib import admin
from .models import (
    XPHistory,
    Badge,
    UserBadge,
    Reward,
    UserReward,
)


@admin.register(XPHistory)
class XPHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "amount",
        "source",
        "created_at",
    )
    list_filter = (
        "source",
        "created_at",
    )
    search_fields = (
        "user__username",
        "user__email",
        "source",
        "description",
    )


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "requirement_value",
    )
    list_filter = ("category",)
    search_fields = (
        "name",
        "description",
        "requirement_value",
    )


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "badge",
        "earned_at",
    )
    list_filter = (
        "badge",
        "earned_at",
    )
    search_fields = (
        "user__username",
        "user__email",
        "badge__name",
    )


@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "xp_cost",
        "is_active",
    )
    list_filter = (
        "is_active",
    )
    search_fields = (
        "name",
        "description",
    )


@admin.register(UserReward)
class UserRewardAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "reward",
        "status",
        "claimed_at",
        "redeemed_at",
    )
    list_filter = (
        "status",
        "claimed_at",
        "redeemed_at",
    )
    search_fields = (
        "user__username",
        "user__email",
        "reward__name",
    )
from django.urls import path
from .views import (
    XPHistoryListView,
    BadgeListView,
    UserBadgeListView,
    RewardListView,
    UserRewardListView, GamificationOverviewAPIView , ClaimRewardAPIView
)

urlpatterns = [
    path("xp-history/", XPHistoryListView.as_view(), name="xp-history"),
    path("badges/", BadgeListView.as_view(), name="badge-list"),
    path("my-badges/", UserBadgeListView.as_view(), name="my-badges"),
    path("rewards/", RewardListView.as_view(), name="reward-list"),
    path("my-rewards/", UserRewardListView.as_view(), name="my-rewards"),
    path("overview/", GamificationOverviewAPIView.as_view(), name="gamification-overview"),
    path(
    "rewards/<int:reward_id>/claim/",
    ClaimRewardAPIView.as_view(),
    name="claim-reward"
)
]
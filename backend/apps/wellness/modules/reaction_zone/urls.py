from django.urls import path

from .views import (
    reaction_zone_prompts_view,
    reaction_zone_submit_score_view,
    reaction_zone_leaderboard_view,
)


urlpatterns = [
    path(
        "prompts/",
        reaction_zone_prompts_view,
        name="reaction-zone-prompts",
    ),

    path(
        "submit-score/",
        reaction_zone_submit_score_view,
        name="reaction-zone-submit",
    ),

    path(
        "leaderboard/",
        reaction_zone_leaderboard_view,
        name="reaction-zone-leaderboard",
    ),
]
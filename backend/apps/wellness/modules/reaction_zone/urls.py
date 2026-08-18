from django.urls import path

from .views import (
    reaction_zone_info,
    start_reaction_game,
    submit_reaction_answer,
    complete_reaction_game,
    reaction_leaderboard,
    reaction_history,
)


urlpatterns = [

    path(
        "",
        reaction_zone_info,
        name="reaction-zone-info"
    ),

    path(
        "start/",
        start_reaction_game,
        name="reaction-start"
    ),

    path(
        "session/<int:session_id>/answer/",
        submit_reaction_answer,
        name="reaction-answer"
    ),

    path(
        "session/<int:session_id>/complete/",
        complete_reaction_game,
        name="reaction-complete"
    ),

    path(
        "leaderboard/",
        reaction_leaderboard,
        name="reaction-leaderboard"
    ),

    path(
        "history/",
        reaction_history,
        name="reaction-history"
    ),
]
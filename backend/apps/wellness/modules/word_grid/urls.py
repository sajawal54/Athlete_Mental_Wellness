from django.urls import path

from .views import (
    word_grid_daily_view,
    word_grid_submit_view,
    word_grid_leaderboard_view,
)


urlpatterns = [
    path(
        "daily/",
        word_grid_daily_view,
        name="word-grid-daily",
    ),

    path(
        "submit/",
        word_grid_submit_view,
        name="word-grid-submit",
    ),

    path(
        "leaderboard/",
        word_grid_leaderboard_view,
        name="word-grid-leaderboard",
    ),
]
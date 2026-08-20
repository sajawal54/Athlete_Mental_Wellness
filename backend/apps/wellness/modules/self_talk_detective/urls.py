from django.urls import path

from .views import (
    self_talk_analyze_view,
    self_talk_history_view,
)


urlpatterns = [
    path(
        "analyze/",
        self_talk_analyze_view,
        name="self-talk-detective-analyze",
    ),

    path(
        "history/",
        self_talk_history_view,
        name="self-talk-detective-history",
    ),
]
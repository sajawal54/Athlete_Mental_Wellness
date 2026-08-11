from django.urls import path
from .views import (
    AffirmationAPICreateView,
    AffirmationListView,
    AffirmationUpdateView,
)

urlpatterns = [
    path(
        "generate/",
        AffirmationAPICreateView.as_view(),
        name="generate-affirmation",
    ),

    path(
        "history/",
        AffirmationListView.as_view(),
        name="affirmation-history",
    ),

    path(
        "<int:pk>/favorite/",
        AffirmationUpdateView.as_view(),
        name="update-affirmation",
    ),
]
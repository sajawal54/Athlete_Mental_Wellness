from django.urls import path

from .views import (
    setback_reframe_generate_view,
    setback_reframe_history_view,
)


urlpatterns = [
    path(
        "generate/",
        setback_reframe_generate_view,
        name="setback-reframer-generate",
    ),

    path(
        "history/",
        setback_reframe_history_view,
        name="setback-reframer-history",
    ),
]
from django.urls import path

from .views import (
    grit_garden_save_view,
    grit_garden_history_view,
)


urlpatterns = [
    path(
        "save/",
        grit_garden_save_view,
        name="grit-garden-save",
    ),

    path(
        "history/",
        grit_garden_history_view,
        name="grit-garden-history",
    ),
]
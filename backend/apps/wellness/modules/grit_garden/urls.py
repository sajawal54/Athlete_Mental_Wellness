from django.urls import path

from .views import (
    grit_garden_info,
    create_grit_session,
    update_grit_session,
    grit_garden_history,
    complete_grit_session,
)


urlpatterns = [

    path(
        "",
        grit_garden_info,
        name="grit-garden-info",
    ),

    path(
        "start/",
        create_grit_session,
        name="grit-garden-start",
    ),

    path(
        "session/<int:session_id>/",
        update_grit_session,
        name="grit-garden-update",
    ),

    path(
        "history/",
        grit_garden_history,
        name="grit-garden-history",
    ),

    path(
        "session/<int:session_id>/complete/",
        complete_grit_session,
        name="grit-garden-complete",
    ),
]
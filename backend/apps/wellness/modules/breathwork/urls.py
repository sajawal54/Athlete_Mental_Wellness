from django.urls import path

from .views import (
    breathwork_info,
    breathwork_start,
    breathwork_update,
    breathwork_pause,
    breathwork_resume,
    breathwork_stop,
    breathwork_complete,
)


urlpatterns = [

    path(
        "",
        breathwork_info,
        name="breathwork-info",
    ),

    path(
        "start/",
        breathwork_start,
        name="breathwork-start",
    ),

    path(
        "session/<int:session_id>/",
        breathwork_update,
        name="breathwork-update",
    ),

    path(
        "session/<int:session_id>/pause/",
        breathwork_pause,
        name="breathwork-pause",
    ),

    path(
        "session/<int:session_id>/resume/",
        breathwork_resume,
        name="breathwork-resume",
    ),

    path(
        "session/<int:session_id>/stop/",
        breathwork_stop,
        name="breathwork-stop",
    ),

    path(
        "session/<int:session_id>/complete/",
        breathwork_complete,
        name="breathwork-complete",
    ),
]
from django.urls import path

from .views import (
    locker_room_info,
    scenario_list,
    start_locker_session,
    submit_locker_decision,
    locker_history,
    complete_locker_session,
)


urlpatterns = [

    path(
        "",
        locker_room_info,
        name="locker-room-info"
    ),

    path(
        "scenarios/",
        scenario_list,
        name="locker-room-scenarios"
    ),

    path(
        "start/",
        start_locker_session,
        name="locker-room-start"
    ),

    path(
        "session/<int:session_id>/decision/",
        submit_locker_decision,
        name="locker-room-decision"
    ),

    path(
        "history/",
        locker_history,
        name="locker-room-history"
    ),

    path(
        "session/<int:session_id>/complete/",
        complete_locker_session,
        name="locker-room-complete"
    ),
]
from django.urls import path

from .views import (
    empathy_info,
    empathy_scenarios,
    start_empathy_session,
    submit_empathy_response,
    empathy_history,
    complete_empathy_session,
)


urlpatterns = [

    path(
        "",
        empathy_info,
        name="empathy-info",
    ),

    path(
        "scenarios/",
        empathy_scenarios,
        name="empathy-scenarios",
    ),

    path(
        "start/",
        start_empathy_session,
        name="empathy-start",
    ),

    path(
        "session/<int:session_id>/response/",
        submit_empathy_response,
        name="empathy-response",
    ),

    path(
        "history/",
        empathy_history,
        name="empathy-history",
    ),

    path(
        "session/<int:session_id>/complete/",
        complete_empathy_session,
        name="empathy-complete",
    ),
]
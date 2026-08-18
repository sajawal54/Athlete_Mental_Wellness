from django.urls import path

from .views import (
    reframer_info,
    create_reframe,
    reframer_history,
    complete_reframe_view,
)


urlpatterns = [

    path(
        "",
        reframer_info,
        name="reframer-info",
    ),

    path(
        "create/",
        create_reframe,
        name="create-reframe",
    ),

    path(
        "history/",
        reframer_history,
        name="reframer-history",
    ),

    path(
        "session/<int:session_id>/complete/",
        complete_reframe_view,
        name="complete-reframe",
    ),
]
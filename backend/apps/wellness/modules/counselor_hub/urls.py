from django.urls import path

from .views import (
    counselor_hub_info,
    counselor_list,
    counselor_detail,
    create_counselor_request,
    counselor_request_history,
    cancel_counselor_request,
)


urlpatterns = [

    path(
        "",
        counselor_hub_info,
        name="counselor-hub-info",
    ),

    path(
        "counselors/",
        counselor_list,
        name="counselor-list",
    ),

    path(
        "counselors/<int:counselor_id>/",
        counselor_detail,
        name="counselor-detail",
    ),

    path(
        "requests/",
        create_counselor_request,
        name="counselor-request-create",
    ),

    path(
        "requests/history/",
        counselor_request_history,
        name="counselor-request-history",
    ),

    path(
        "requests/<int:request_id>/cancel/",
        cancel_counselor_request,
        name="counselor-request-cancel",
    ),
]
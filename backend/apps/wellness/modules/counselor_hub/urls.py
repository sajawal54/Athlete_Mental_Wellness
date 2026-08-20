from django.urls import path

from .views import (
    counselor_list_view,
    counselor_request_create_view,
    counselor_my_requests_view,
)


urlpatterns = [
    path(
        "counselors/",
        counselor_list_view,
        name="counselor-hub-list",
    ),
    path(
        "request/",
        counselor_request_create_view,
        name="counselor-hub-request",
    ),
    path(
        "my-requests/",
        counselor_my_requests_view,
        name="counselor-hub-my-requests",
    ),
]
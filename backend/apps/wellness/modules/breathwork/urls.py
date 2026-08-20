from django.urls import path

from .views import (
    breathwork_info_view,
    breathwork_record_view,
)


urlpatterns = [
    path(
        "info/",
        breathwork_info_view,
        name="breathwork-info",
    ),

    path(
        "record/",
        breathwork_record_view,
        name="breathwork-record",
    ),
]
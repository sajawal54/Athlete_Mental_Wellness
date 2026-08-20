from django.urls import path

from .views import (
    integrity_scenarios_view,
    integrity_submit_view,
)


urlpatterns = [
    path(
        "scenarios/",
        integrity_scenarios_view,
        name="integrity-crossroads-scenarios",
    ),

    path(
        "submit/",
        integrity_submit_view,
        name="integrity-crossroads-submit",
    ),
]
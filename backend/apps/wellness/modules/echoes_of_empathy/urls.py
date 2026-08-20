from django.urls import path

from .views import (
    echoes_of_empathy_scenarios_view,
    echoes_of_empathy_submit_view,
)


urlpatterns = [
    path(
        "scenarios/",
        echoes_of_empathy_scenarios_view,
        name="echoes-of-empathy-scenarios",
    ),
    path(
        "submit/",
        echoes_of_empathy_submit_view,
        name="echoes-of-empathy-submit",
    ),
]
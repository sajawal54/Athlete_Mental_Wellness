from django.urls import path

from .views import (
    locker_room_scenarios_view,
    locker_room_decide_view,
)


urlpatterns = [
    path(
        "scenarios/",
        locker_room_scenarios_view,
        name="locker-room-scenarios",
    ),

    path(
        "decide/",
        locker_room_decide_view,
        name="locker-room-decide",
    ),
]
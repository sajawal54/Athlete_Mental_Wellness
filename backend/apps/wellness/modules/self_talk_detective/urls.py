from django.urls import path

from .views import self_talk_detective_info, self_talk_detective_start, self_talk_detective_complete

urlpatterns = [
    path("", self_talk_detective_info, name="self-talk-detective-info"),
    path("start/", self_talk_detective_start, name="self-talk-detective-start"),
    path("complete/", self_talk_detective_complete, name="self-talk-detective-complete"),
]

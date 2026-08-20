from django.urls import path

from .views import (
    emergency_contacts_view,
    counselors_view,
    crisis_information_view,
    breathing_exercises_view,
    callback_request_create_view,
    callback_request_list_view,
)

urlpatterns = [
    path( "contacts/", emergency_contacts_view, name="emergency-contacts",),
    path( "counselors/", counselors_view, name="emergency-counselors", ),
    path( "crisis/",crisis_information_view,name="crisis-information",),
    path("breathing/",breathing_exercises_view,name="breathing-exercises",),
    path("callbacks/",callback_request_create_view,name="callback-request-create",),
    path("callbacks/history/",callback_request_list_view,name="callback-request-list",),
]
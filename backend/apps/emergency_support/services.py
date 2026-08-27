from django.db import transaction

from .models import (
    EmergencyContact,
    Counselor,
    CallbackRequest,
    CrisisInformation,
    BreathingExercise,
)

def get_emergency_contacts(region=None):
    """
    Return active emergency contacts.

    If a region is provided, region-specific contacts are returned
    along with global contacts.
    """
    queryset = EmergencyContact.objects.filter(
        is_active=True
    )

    if region:
        queryset = queryset.filter(
            region__in=[region, "global"]
        )

    return queryset.order_by("order", "name")


def get_counselors():
    """
    Return all active counselors.
    """
    return Counselor.objects.filter(
        is_active=True
    ).order_by("order", "name")


def get_crisis_information():
    """
    Return active crisis information ordered for display.
    """
    return CrisisInformation.objects.filter(
        is_active=True
    ).order_by("order", "id")


def get_breathing_exercises():
    """
    Return active breathing exercises.
    """
    return BreathingExercise.objects.filter(
        is_active=True
    ).order_by("id")


@transaction.atomic
def create_callback_request(
    user,
    name,
    contact,
    reason,
    urgency="normal",
    message="",
):

    callback_request = CallbackRequest.objects.create(
        user=user,
        name=name.strip(),
        contact=contact.strip(),
        reason=reason.strip(),
        urgency=urgency,
        message=message.strip(),
    )

    return callback_request


def get_user_callback_requests(user):
    """
    Return callback requests belonging to the authenticated user.
    """
    return CallbackRequest.objects.filter(
        user=user
    ).order_by("-created_at")
from django.db import transaction

from .models import (
    Counselor,
    CounselorRequest,
)


def get_counselors(
    specialization=None,
    available=None,
):

    counselors = Counselor.objects.all()

    if specialization:
        counselors = counselors.filter(
            specialization=specialization
        )

    if available is not None:
        counselors = counselors.filter(
            is_available=available
        )

    return counselors.order_by("name")


def get_counselor(counselor_id):

    return Counselor.objects.filter(
        id=counselor_id
    ).first()


@transaction.atomic
def create_request(
    user,
    counselor_id,
    request_type,
    message="",
    preferred_date=None,
    preferred_time=None,
):

    counselor = get_counselor(
        counselor_id
    )

    if not counselor:
        raise ValueError(
            "Counselor not found."
        )

    if not counselor.is_available:
        raise ValueError(
            "This counselor is currently unavailable."
        )

    request_obj = CounselorRequest.objects.create(
        user=user,
        counselor=counselor,
        request_type=request_type,
        message=message,
        preferred_date=preferred_date,
        preferred_time=preferred_time,
    )

    return request_obj


def get_user_requests(user):

    return CounselorRequest.objects.filter(
        user=user
    ).select_related(
        "counselor"
    ).order_by(
        "-created_at"
    )


def cancel_request(
    user,
    request_id,
):

    request_obj = CounselorRequest.objects.filter(
        id=request_id,
        user=user,
    ).first()

    if not request_obj:
        raise ValueError(
            "Request not found."
        )

    if request_obj.status in [
        "completed",
        "cancelled",
    ]:
        raise ValueError(
            "This request cannot be cancelled."
        )

    request_obj.status = "cancelled"

    request_obj.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    return request_obj
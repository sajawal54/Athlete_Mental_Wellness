from django.db import transaction

from .models import (
    TransitionResource,
    ResourceView,
)


def get_resources(
    category=None,
    resource_type=None,
):

    resources = TransitionResource.objects.filter(
        is_active=True
    )

    if category:
        resources = resources.filter(
            category=category
        )

    if resource_type:
        resources = resources.filter(
            resource_type=resource_type
        )

    return resources.order_by(
        "order",
        "title",
    )


def get_resource(resource_id):

    return TransitionResource.objects.filter(
        id=resource_id,
        is_active=True,
    ).first()


@transaction.atomic
def mark_resource_viewed(
    user,
    resource_id,
):

    resource = get_resource(
        resource_id
    )

    if not resource:
        raise ValueError(
            "Resource not found."
        )

    view, created = ResourceView.objects.get_or_create(
        user=user,
        resource=resource,
    )

    return view, created


def get_user_views(user):

    return ResourceView.objects.filter(
        user=user
    ).select_related(
        "resource"
    ).order_by(
        "-viewed_at"
    )
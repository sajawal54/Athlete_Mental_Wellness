from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    TransitionResourceSerializer,
    ResourceViewSerializer,
)

from .services import (
    get_resources,
    get_resource,
    mark_resource_viewed,
    get_user_views,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transition_support_info(request):

    return Response({
        "success": True,
        "module": {
            "name": "Transition Support",
            "description": (
                "Career, education and life-transition "
                "resources for athletes."
            ),
        },
        "categories": [
            "career",
            "education",
            "skills",
            "life_after_sport",
            "financial",
            "general",
        ],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def resource_list(request):

    category = request.query_params.get(
        "category"
    )

    resource_type = request.query_params.get(
        "resource_type"
    )

    resources = get_resources(
        category=category,
        resource_type=resource_type,
    )

    serializer = TransitionResourceSerializer(
        resources,
        many=True,
        context={
            "request": request
        },
    )

    return Response({
        "success": True,
        "count": resources.count(),
        "resources": serializer.data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def resource_detail(
    request,
    resource_id,
):

    resource = get_resource(
        resource_id
    )

    if not resource:

        return Response(
            {
                "success": False,
                "message": "Resource not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = TransitionResourceSerializer(
        resource,
        context={
            "request": request
        },
    )

    return Response({
        "success": True,
        "resource": serializer.data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_viewed(
    request,
    resource_id,
):

    try:

        view, created = mark_resource_viewed(
            user=request.user,
            resource_id=resource_id,
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        "success": True,
        "message": (
            "Resource marked as viewed."
            if created
            else "Resource was already viewed."
        ),
        "view": ResourceViewSerializer(
            view
        ).data,
        "already_viewed": not created,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def viewed_resources(request):

    views = get_user_views(
        request.user
    )

    return Response({
        "success": True,
        "views": ResourceViewSerializer(
            views,
            many=True,
        ).data,
    })
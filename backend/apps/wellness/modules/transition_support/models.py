from django.db import models
from django.conf import settings


User = settings.AUTH_USER_MODEL


class TransitionResource(models.Model):

    RESOURCE_TYPES = [
        ("article", "Article"),
        ("guide", "Guide"),
        ("download", "Download"),
    ]

    CATEGORY_CHOICES = [
        ("career", "Career"),
        ("education", "Education"),
        ("skills", "Skills"),
        ("life_after_sport", "Life After Sport"),
        ("financial", "Financial"),
        ("general", "General"),
    ]

    title = models.CharField(
        max_length=250
    )

    description = models.TextField(
        blank=True
    )

    content = models.TextField(
        blank=True
    )

    resource_type = models.CharField(
        max_length=30,
        choices=RESOURCE_TYPES,
        default="article",
    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default="general",
    )

    file = models.FileField(
        upload_to="transition_resources/",
        blank=True,
        null=True,
    )

    is_active = models.BooleanField(
        default=True
    )

    order = models.PositiveIntegerField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["order", "title"]

    def __str__(self):
        return self.title


class ResourceView(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="transition_resource_views",
    )

    resource = models.ForeignKey(
        TransitionResource,
        on_delete=models.CASCADE,
        related_name="user_views",
    )

    viewed_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "resource"],
                name="unique_transition_resource_view",
            )
        ]
        ordering = ["-viewed_at"]

    def __str__(self):
        return (
            f"{self.user} - "
            f"{self.resource.title}"
        )
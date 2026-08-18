from django.urls import path

from .views import word_grid_info, word_grid_start, word_grid_complete

urlpatterns = [
    path("", word_grid_info, name="word-grid-info"),
    path("start/", word_grid_start, name="word-grid-start"),
    path("complete/", word_grid_complete, name="word-grid-complete"),
]

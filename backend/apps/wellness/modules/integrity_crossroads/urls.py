from django.urls import path

from .views import integrity_crossroads_info, integrity_crossroads_start, integrity_crossroads_complete

urlpatterns = [
    path("", integrity_crossroads_info, name="integrity-crossroads-info"),
    path("start/", integrity_crossroads_start, name="integrity-crossroads-start"),
    path("complete/", integrity_crossroads_complete, name="integrity-crossroads-complete"),
]

from django.urls import path, include
from . import views

urlpatterns = [
    path("health/", views.health_check, name="health_check"),
    path('', include('core.urls')),
]

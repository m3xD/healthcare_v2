from django.urls import path
from .views import RegisterView, UserProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='api-register'),
    path('profile/', UserProfileView.as_view(), name='api-profile'),
]
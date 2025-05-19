from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabTestViewSet, LabRequestViewSet, LabTestResultViewSet

router = DefaultRouter()
router.register(r'tests', LabTestViewSet)
router.register(r'requests', LabRequestViewSet, basename='lab-request')
router.register(r'results', LabTestResultViewSet, basename='lab-result')

urlpatterns = [
    path('', include(router.urls)),
]
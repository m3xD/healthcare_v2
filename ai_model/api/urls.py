# ai_model/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SymptomViewSet, DiseaseViewSet, DiagnosisViewSet
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# Schema view for API documentation
schema_view = get_schema_view(
   openapi.Info(
      title="Health Assistant API",
      default_version='v1',
      description="REST API for AI Health Assistant",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@example.com"),
      license=openapi.License(name="MIT License"),
   ),
   public=True,
   permission_classes=[permissions.AllowAny],
)

router = DefaultRouter()
router.register(r'symptoms', SymptomViewSet, basename='symptom')
router.register(r'diseases', DiseaseViewSet, basename='disease')
router.register(r'diagnoses', DiagnosisViewSet, basename='diagnosis')

urlpatterns = [
    path('', include(router.urls)),
    # Swagger documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
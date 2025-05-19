# healthcare/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from rest_framework.documentation import include_docs_urls
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# API Documentation
schema_view = get_schema_view(
    openapi.Info(
        title="Healthcare API",
        default_version='v1',
        description="API documentation for the Healthcare System",
        terms_of_service="https://www.example.com/policies/terms/",
        contact=openapi.Contact(email="contact@healthcare.example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API routes for original modules
    path('api/v1/', include('ai_model.api.urls')),
    path('api/v1/', include('users.urls')),

    # API routes for new modules
    path('api/v1/doctors/', include('doctors.api.urls')),
    path('api/v1/appointments/', include('appointments.api.urls')),
    path('api/v1/pharmacy/', include('pharmacy.api.urls')),
    path('api/v1/laboratory/', include('laboratory.api.urls')),
    path('api/v1/billing/', include('billing.api.urls')),
    path('api/v1/chat/', include('chat.api.urls')),
    path('api/v1/', include('notifications.api.urls')),

    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # API Documentation
    #path('api/docs/', include_docs_urls(title='Healthcare API')),
    #path('api/swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    #path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
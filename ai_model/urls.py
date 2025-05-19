from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .apis import SymptomViewSet, DiagnosisViewSet

app_name = 'ai_model'

router = DefaultRouter()
router.register(r'symptoms', SymptomViewSet)
router.register(r'diagnoses', DiagnosisViewSet, basename='diagnosis')

urlpatterns = [
    path('', views.home, name='home'),
    path('diagnose/', views.diagnose, name='diagnose'),
    path('result/', views.diagnosis_result, name='diagnosis_result'),
    path('history/', views.diagnosis_history, name='history'),
    path('history/<int:diagnosis_id>/', views.diagnosis_detail, name='diagnosis_detail'),
    path('feedback/', views.submit_feedback, name='submit_feedback'),
    path('api/', include(router.urls)),
]
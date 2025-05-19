from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicineViewSet, PrescriptionViewSet

router = DefaultRouter()
router.register(r'medicines', MedicineViewSet)
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')

urlpatterns = [
    path('', include(router.urls)),
]
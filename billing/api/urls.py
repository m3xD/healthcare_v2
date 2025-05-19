from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InsuranceProviderViewSet,
    PatientInsuranceViewSet,
    BillViewSet,
    InsuranceClaimViewSet
)

router = DefaultRouter()
router.register(r'insurance-providers', InsuranceProviderViewSet)
router.register(r'patient-insurance', PatientInsuranceViewSet, basename='patient-insurance')
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'insurance-claims', InsuranceClaimViewSet, basename='insurance-claim')

urlpatterns = [
    path('', include(router.urls)),
]
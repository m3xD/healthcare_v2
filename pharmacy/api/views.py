from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Medicine, Prescription, PrescriptionItem
from .serializers import (
    MedicineSerializer,
    PrescriptionSerializer,
    PrescriptionItemSerializer,
    PrescriptionCreateSerializer
)
from django.db.models import Q


class IsDoctorOrPharmacistOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow read-only access for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Allow write access for doctors and pharmacists/staff
        return (request.user.is_authenticated and
                (hasattr(request.user, 'doctor') or request.user.is_staff))

    def has_object_permission(self, request, view, obj):
        # Allow patients to see their own prescriptions
        if isinstance(obj, Prescription) and obj.patient == request.user:
            return request.method in permissions.SAFE_METHODS

        # Allow doctors to modify their own prescriptions
        if (isinstance(obj, Prescription) and
                hasattr(request.user, 'doctor') and
                obj.doctor == request.user.doctor):
            return True

        # Allow pharmacists/staff full access
        return request.user.is_staff


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrPharmacistOrReadOnly]

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        # This endpoint would be used by staff to check medicines with low stock
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )

        low_stock_threshold = 10  # Example threshold
        medicines = Medicine.objects.filter(stock_quantity__lt=low_stock_threshold)
        serializer = self.get_serializer(medicines, many=True)
        return Response(serializer.data)


class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrPharmacistOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer

    def get_queryset(self):
        user = self.request.user

        # Admins/pharmacists can see all prescriptions
        if user.is_staff:
            return Prescription.objects.all()

        # Doctors can see prescriptions they created
        if hasattr(user, 'doctor'):
            return Prescription.objects.filter(doctor=user.doctor)

        # Patients can see their prescriptions
        return Prescription.objects.filter(patient=user)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        # This endpoint would be used by pharmacists to mark prescriptions as filled
        prescription = self.get_object()
        status_value = request.data.get('status')

        if status_value not in [status for status, _ in Prescription.STATUS_CHOICES]:
            return Response(
                {"detail": "Invalid status value."},
                status=status.HTTP_400_BAD_REQUEST
            )

        prescription.status = status_value
        prescription.save()

        serializer = self.get_serializer(prescription)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        # Get pending prescriptions for pharmacists
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )

        prescriptions = Prescription.objects.filter(status='pending')
        serializer = self.get_serializer(prescriptions, many=True)
        return Response(serializer.data)
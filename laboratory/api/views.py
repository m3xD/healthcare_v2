from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import LabTest, LabTechnician, LabRequest, LabTestResult
from .serializers import (
    LabTestSerializer,
    LabTechnicianSerializer,
    LabRequestSerializer,
    LabRequestCreateSerializer,
    LabTestResultSerializer
)
from django.db.models import Q
from datetime import datetime


class IsDoctorOrTechnicianOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow read-only access for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Allow write access for doctors, technicians, and staff
        return (request.user.is_authenticated and
                (hasattr(request.user, 'doctor') or
                 hasattr(request.user, 'labtechnician') or
                 request.user.is_staff))

    def has_object_permission(self, request, view, obj):
        # Allow patients to see their own lab requests
        if isinstance(obj, LabRequest) and obj.patient == request.user:
            return request.method in permissions.SAFE_METHODS

        # Allow doctors to modify their own lab requests
        if (isinstance(obj, LabRequest) and
                hasattr(request.user, 'doctor') and
                obj.doctor == request.user.doctor):
            return True

        # Allow lab technicians and staff full access
        return (hasattr(request.user, 'labtechnician') or request.user.is_staff)


class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrTechnicianOrReadOnly]


class LabRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LabRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrTechnicianOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return LabRequestCreateSerializer
        return LabRequestSerializer

    def get_queryset(self):
        user = self.request.user

        # Admins and lab technicians can see all lab requests
        if user.is_staff or hasattr(user, 'labtechnician'):
            return LabRequest.objects.all()

        # Doctors can see lab requests they created
        if hasattr(user, 'doctor'):
            return LabRequest.objects.filter(doctor=user.doctor)

        # Patients can see their lab requests
        return LabRequest.objects.filter(patient=user)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        lab_request = self.get_object()
        status_value = request.data.get('status')

        if status_value not in [status for status, _ in LabRequest.STATUS_CHOICES]:
            return Response(
                {"detail": "Invalid status value."},
                status=status.HTTP_400_BAD_REQUEST
            )

        lab_request.status = status_value
        lab_request.save()

        serializer = self.get_serializer(lab_request)
        return Response(serializer.data)


class LabTestResultViewSet(viewsets.ModelViewSet):
    serializer_class = LabTestResultSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrTechnicianOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        # Lab technicians and staff can see all test results
        if user.is_staff or hasattr(user, 'labtechnician'):
            return LabTestResult.objects.all()

        # Doctors can see test results for lab requests they created
        if hasattr(user, 'doctor'):
            return LabTestResult.objects.filter(lab_request__doctor=user.doctor)

        # Patients can see their test results
        return LabTestResult.objects.filter(lab_request__patient=user)

    def perform_update(self, serializer):
        if hasattr(self.request.user, 'labtechnician'):
            # When a lab technician updates a result, set the technician field
            serializer.save(technician=self.request.user.labtechnician,
                            performed_date=datetime.now())
        else:
            serializer.save()
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Appointment, AppointmentNote
from .serializers import AppointmentSerializer, AppointmentNoteSerializer
from django.db.models import Q
from datetime import date


class IsPatientOrDoctor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow patients to see their own appointments
        if obj.patient == request.user:
            return True
        # Allow doctors to see appointments assigned to them
        if hasattr(request.user, 'doctor') and obj.doctor == request.user.doctor:
            return True
        # Allow staff/admin users full access
        return request.user.is_staff


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientOrDoctor]

    def get_queryset(self):
        user = self.request.user

        # Admins can see all appointments
        if user.is_staff:
            return Appointment.objects.all()

        # Doctors can see their appointments
        if hasattr(user, 'doctor'):
            return Appointment.objects.filter(doctor=user.doctor)

        # Patients can see their appointments
        return Appointment.objects.filter(patient=user)

    def perform_create(self, serializer):
        # If the user is a patient, set the patient field automatically
        if not self.request.user.is_staff and not hasattr(self.request.user, 'doctor'):
            serializer.save(patient=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        # Get upcoming appointments for the authenticated user
        today = date.today()
        if hasattr(request.user, 'doctor'):
            appointments = Appointment.objects.filter(
                doctor=request.user.doctor,
                appointment_date__gte=today,
                status='scheduled'
            )
        else:
            appointments = Appointment.objects.filter(
                patient=request.user,
                appointment_date__gte=today,
                status='scheduled'
            )

        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        appointment = self.get_object()
        serializer = AppointmentNoteSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save(appointment=appointment, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
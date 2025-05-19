from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Doctor, DoctorSchedule
from .serializers import DoctorSerializer, DoctorScheduleSerializer
from .permissions import IsAdminOrReadOnly


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=['get'])
    def schedules(self, request, pk=None):
        doctor = self.get_object()
        schedules = DoctorSchedule.objects.filter(doctor=doctor)
        serializer = DoctorScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def available_slots(self, request, pk=None):
        doctor = self.get_object()
        # Logic to calculate available slots based on schedules and existing appointments
        # This would typically use the appointment model to find occupied slots
        # For now, return a placeholder response
        return Response({
            "message": "Available slots feature will be implemented soon."
        })
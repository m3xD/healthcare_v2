from rest_framework import serializers
from ..models import Appointment, AppointmentNote
from doctors.models import Doctor
from django.contrib.auth.models import User


class AppointmentPatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class AppointmentDoctorSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = ['id', 'user', 'specialization']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name
        }


class AppointmentNoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentNote
        fields = ['id', 'content', 'created_at', 'created_by', 'created_by_name', 'is_private']
        read_only_fields = ['created_by']

    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}"

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = AppointmentPatientSerializer(source='patient', read_only=True)
    doctor_details = AppointmentDoctorSerializer(source='doctor', read_only=True)
    notes = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'patient_details', 'doctor', 'doctor_details',
                  'appointment_date', 'start_time', 'end_time', 'status',
                  'reason', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_notes(self, obj):
        # Only include non-private notes or private notes if user is staff/doctor
        request = self.context.get('request')
        if request and (request.user.is_staff or hasattr(request.user, 'doctor')):
            notes = obj.notes.all()
        else:
            notes = obj.notes

        return AppointmentNoteSerializer(notes, many=True).data
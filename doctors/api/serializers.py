from rest_framework import serializers
from django.contrib.auth.models import User
from ..models import Doctor, DoctorSchedule


class DoctorUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username']


class DoctorScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()

    class Meta:
        model = DoctorSchedule
        fields = ['id', 'day_of_week', 'day_name', 'start_time', 'end_time']

    def get_day_name(self, obj):
        return dict(DoctorSchedule.DAYS_OF_WEEK)[obj.day_of_week]


class DoctorSerializer(serializers.ModelSerializer):
    user = DoctorUserSerializer()
    schedules = DoctorScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'user', 'specialization', 'license_number', 'education',
                  'experience_years', 'profile_image', 'available_for_appointment', 'schedules']
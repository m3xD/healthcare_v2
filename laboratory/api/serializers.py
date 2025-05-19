from rest_framework import serializers
from ..models import LabTest, LabTechnician, LabRequest, LabTestResult
from django.contrib.auth.models import User


class LabTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTest
        fields = ['id', 'name', 'description', 'normal_range', 'price',
                  'preparation_instructions', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class LabTechnicianSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = LabTechnician
        fields = ['id', 'user', 'specialization', 'license_number', 'joined_date']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'email': obj.user.email
        }


class LabTestResultSerializer(serializers.ModelSerializer):
    lab_test_name = serializers.CharField(source='lab_test.name', read_only=True)
    technician_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LabTestResult
        fields = ['id', 'lab_test', 'lab_test_name', 'technician', 'technician_name',
                  'result_value', 'reference_range', 'unit', 'is_abnormal',
                  'notes', 'report_file', 'performed_date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_technician_name(self, obj):
        if obj.technician:
            return f"{obj.technician.user.first_name} {obj.technician.user.last_name}"
        return None


class LabRequestSerializer(serializers.ModelSerializer):
    test_results = LabTestResultSerializer(many=True, read_only=True)
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = LabRequest
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name',
                  'diagnosis', 'request_date', 'status', 'notes', 'test_results',
                  'created_at', 'updated_at']
        read_only_fields = ['request_date', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"


class LabRequestCreateSerializer(serializers.ModelSerializer):
    tests = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=LabTest.objects.all(),
        write_only=True
    )

    class Meta:
        model = LabRequest
        fields = ['patient', 'doctor', 'diagnosis', 'notes', 'tests']

    def create(self, validated_data):
        tests = validated_data.pop('tests')
        lab_request = LabRequest.objects.create(**validated_data)

        # Create test results with empty values - they'll be filled in by lab techs
        for test in tests:
            LabTestResult.objects.create(
                lab_request=lab_request,
                lab_test=test,
                result_value="Pending",
                reference_range=test.normal_range,
                unit="",
                performed_date=lab_request.created_at  # Placeholder
            )

        return lab_request
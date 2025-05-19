from rest_framework import serializers
from ..models import Medicine, Prescription, PrescriptionItem
from django.contrib.auth.models import User
from doctors.models import Doctor


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = ['id', 'name', 'generic_name', 'category', 'description',
                  'dosage_form', 'stock_quantity', 'price', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PrescriptionItemSerializer(serializers.ModelSerializer):
    medicine_details = MedicineSerializer(source='medicine', read_only=True)

    class Meta:
        model = PrescriptionItem
        fields = ['id', 'medicine', 'medicine_details', 'dosage', 'duration', 'quantity', 'instructions']


class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True, read_only=True)
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'diagnosis',
                  'issue_date', 'expiry_date', 'status', 'notes', 'items',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True)

    class Meta:
        model = Prescription
        fields = ['patient', 'doctor', 'diagnosis', 'expiry_date', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        prescription = Prescription.objects.create(**validated_data)

        for item_data in items_data:
            PrescriptionItem.objects.create(prescription=prescription, **item_data)

        return prescription
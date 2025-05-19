from rest_framework import serializers
from ..models import (
    InsuranceProvider,
    PatientInsurance,
    Bill,
    BillItem,
    InsuranceClaim
)
from django.contrib.auth.models import User


class InsuranceProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceProvider
        fields = ['id', 'name', 'contact_email', 'contact_phone', 'address',
                  'website', 'logo', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PatientInsuranceSerializer(serializers.ModelSerializer):
    insurance_provider_name = serializers.CharField(source='insurance_provider.name', read_only=True)
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = PatientInsurance
        fields = ['id', 'patient', 'patient_name', 'insurance_provider',
                  'insurance_provider_name', 'policy_number', 'group_number',
                  'valid_from', 'valid_until', 'coverage_percentage',
                  'max_coverage_amount', 'insurance_card_front',
                  'insurance_card_back', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"


class BillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillItem
        fields = ['id', 'item_type', 'description', 'quantity',
                  'unit_price', 'total_price', 'related_object_id', 'created_at']
        read_only_fields = ['total_price', 'created_at']


class BillSerializer(serializers.ModelSerializer):
    items = BillItemSerializer(many=True, read_only=True)
    patient_name = serializers.SerializerMethodField()
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Bill
        fields = ['id', 'patient', 'patient_name', 'issue_date', 'due_date',
                  'total_amount', 'paid_amount', 'remaining_amount', 'status',
                  'insurance_claim', 'notes', 'items', 'created_at', 'updated_at']
        read_only_fields = ['issue_date', 'total_amount', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"


class BillCreateSerializer(serializers.ModelSerializer):
    items = BillItemSerializer(many=True)

    class Meta:
        model = Bill
        fields = ['patient', 'due_date', 'status', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        bill = Bill.objects.create(total_amount=0, **validated_data)  # Initialize with 0

        for item_data in items_data:
            BillItem.objects.create(bill=bill, **item_data)

        # The total_amount will be updated by the signal handler

        return bill


class InsuranceClaimSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    insurance_provider = serializers.SerializerMethodField()
    bills = BillSerializer(many=True, read_only=True)

    class Meta:
        model = InsuranceClaim
        fields = ['id', 'patient_insurance', 'patient_name', 'insurance_provider',
                  'submission_date', 'claim_number', 'diagnosis_codes',
                  'procedure_codes', 'claimed_amount', 'approved_amount',
                  'status', 'notes', 'supporting_documents', 'bills',
                  'created_at', 'updated_at']
        read_only_fields = ['submission_date', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return f"{obj.patient_insurance.patient.first_name} {obj.patient_insurance.patient.last_name}"

    def get_insurance_provider(self, obj):
        return obj.patient_insurance.insurance_provider.name
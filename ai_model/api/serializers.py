# ai_model/api/serializers.py
from rest_framework import serializers
from ..models import Symptom, Disease, Diagnosis, DiagnosisSymptom
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class SymptomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Symptom
        fields = ['id', 'name', 'description']


class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = ['id', 'name', 'description', 'test_recommendation', 'medicine_recommendation']


class DiagnosisSymptomSerializer(serializers.ModelSerializer):
    symptom_name = serializers.CharField(source='symptom.name', read_only=True)

    class Meta:
        model = DiagnosisSymptom
        fields = ['symptom', 'symptom_name', 'is_present']


class DiagnosisSerializer(serializers.ModelSerializer):
    symptoms = DiagnosisSymptomSerializer(source='diagnosissymptom_set', many=True, read_only=True)
    disease_name = serializers.CharField(source='primary_disease.name', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    chart_url = serializers.SerializerMethodField()

    class Meta:
        model = Diagnosis
        fields = ['id', 'created_at', 'primary_disease', 'disease_name',
                  'symptoms', 'prediction_data', 'user', 'user_details', 'chart_url']
        read_only_fields = ['id', 'created_at', 'user_details', 'chart_url']

    def get_chart_url(self, obj):
        # Logic để lấy URL của biểu đồ (nếu có)
        if hasattr(obj, 'chart_path') and obj.chart_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.chart_path)
        return None


class DiagnosisInputSerializer(serializers.Serializer):
    symptom_values = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=1),
        help_text="List of binary values (0 or 1) for each symptom"
    )
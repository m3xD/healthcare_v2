from rest_framework import serializers
from .models import Symptom, Disease, Diagnosis, DiagnosisSymptom


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

    class Meta:
        model = Diagnosis
        fields = ['id', 'created_at', 'primary_disease', 'disease_name', 'symptoms', 'prediction_data']
from django.contrib import admin
from .models import Symptom, Disease, Diagnosis, DiagnosisSymptom


class DiagnosisSymptomInline(admin.TabularInline):
    model = DiagnosisSymptom
    extra = 0


@admin.register(Symptom)
class SymptomAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')


@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'test_recommendation', 'medicine_recommendation')
    search_fields = ('name', 'description', 'test_recommendation', 'medicine_recommendation')


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'primary_disease', 'created_at')
    list_filter = ('created_at', 'primary_disease')
    search_fields = ('user__username', 'primary_disease__name')
    date_hierarchy = 'created_at'
    inlines = [DiagnosisSymptomInline]
    readonly_fields = ('created_at', 'prediction_data')


@admin.register(DiagnosisSymptom)
class DiagnosisSymptomAdmin(admin.ModelAdmin):
    list_display = ('diagnosis', 'symptom', 'is_present')
    list_filter = ('is_present', 'symptom')
    search_fields = ('diagnosis__id', 'symptom__name')
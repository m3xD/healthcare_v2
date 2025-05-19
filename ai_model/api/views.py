# ai_model/api/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Symptom, Disease, Diagnosis, DiagnosisSymptom
from .serializers import (
    SymptomSerializer, DiseaseSerializer, DiagnosisSerializer,
    DiagnosisInputSerializer
)
from ..ml.prediction import get_diagnosis
from ..ml.model_builder import load_trained_model
from ..ml.visualizer import create_diagnosis_chart, save_diagnosis_chart
from django.utils import timezone
import uuid
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner
        return obj.user == request.user


class SymptomViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows symptoms to be viewed.
    """
    queryset = Symptom.objects.all()
    serializer_class = SymptomSerializer
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Get all available symptoms",
        operation_description="Returns a list of all available symptoms that can be used for diagnosis"
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class DiseaseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows diseases to be viewed.
    """
    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer
    permission_classes = [permissions.AllowAny]


class DiagnosisViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows diagnoses to be viewed or edited.
    """
    serializer_class = DiagnosisSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        """
        This view returns a list of all diagnoses for the currently authenticated user.
        """
        return Diagnosis.objects.filter(user=self.request.user).order_by('-created_at')

    @swagger_auto_schema(
        operation_summary="Create a new diagnosis",
        operation_description="Analyze symptoms and create a new diagnosis",
        request_body=DiagnosisInputSerializer,
        responses={
            201: openapi.Response('Diagnosis created successfully', DiagnosisSerializer),
            400: 'Bad request'
        }
    )
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def diagnose(self, request):
        """
        Perform diagnosis based on symptoms.
        """
        serializer = DiagnosisInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        symptom_values = serializer.validated_data['symptom_values']

        try:
            # Get model metadata
            _, metadata = load_trained_model()
            symptoms = metadata.get("symptoms", [])

            # Check that the input length matches the expected length
            if len(symptom_values) != len(symptoms):
                return Response(
                    {"error": f"Expected {len(symptoms)} symptom values, got {len(symptom_values)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get diagnosis result
            result = get_diagnosis(symptom_values)

            # Create diagnosis object if user is authenticated
            if request.user.is_authenticated:
                # Get or create disease
                disease, _ = Disease.objects.get_or_create(
                    name=result["diagnosis"],
                    defaults={
                        'test_recommendation': result["test_recommendation"],
                        'medicine_recommendation': result["medicine_recommendation"]
                    }
                )

                # Create diagnosis
                diagnosis = Diagnosis.objects.create(
                    user=request.user,
                    primary_disease=disease,
                    prediction_data=result
                )

                # Create symptom relationships
                for i, symptom_name in enumerate(symptoms):
                    if i < len(symptom_values):
                        symptom, _ = Symptom.objects.get_or_create(name=symptom_name)
                        DiagnosisSymptom.objects.create(
                            diagnosis=diagnosis,
                            symptom=symptom,
                            is_present=bool(symptom_values[i])
                        )

                # Generate chart
                diseases = list(result["probabilities"].keys())
                probabilities = list(result["probabilities"].values())
                uncertainties = list(result["uncertainties"].values())

                chart_filename = f"diagnosis_{diagnosis.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}.png"
                chart_path = save_diagnosis_chart(diseases, probabilities, uncertainties, chart_filename)

                diagnosis.chart_path = chart_path
                diagnosis.save()

                serializer = self.get_serializer(diagnosis)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            # For anonymous users, just return the result
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
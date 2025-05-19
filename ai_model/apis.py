from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .serializers import SymptomSerializer, DiagnosisSerializer
from .models import Symptom, Diagnosis
from .ml.model_builder import load_trained_model
from .ml.prediction import get_diagnosis


class SymptomViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Symptom.objects.all()
    serializer_class = SymptomSerializer


class DiagnosisViewSet(viewsets.ModelViewSet):
    serializer_class = DiagnosisSerializer

    def get_queryset(self):
        return Diagnosis.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def diagnose(self, request):
        # Lấy triệu chứng từ request
        symptom_values = request.data.get('symptom_values', [])

        try:
            # Thực hiện chẩn đoán
            result = get_diagnosis(symptom_values)

            # Lưu lại chẩn đoán nếu người dùng đã đăng nhập
            if request.user.is_authenticated:
                # Code lưu diagnosis
                pass

            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
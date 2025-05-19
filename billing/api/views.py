from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import (
    InsuranceProvider,
    PatientInsurance,
    Bill,
    BillItem,
    InsuranceClaim
)
from .serializers import (
    InsuranceProviderSerializer,
    PatientInsuranceSerializer,
    BillSerializer,
    BillCreateSerializer,
    BillItemSerializer,
    InsuranceClaimSerializer
)
from django.db.models import Q, Sum


class IsAdminOrInsuranceStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
                request.user.is_staff or
                hasattr(request.user, 'groups') and
                request.user.groups.filter(name='Insurance Staff').exists()
        )


class IsPatientOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'patient') and obj.patient == request.user:
            return request.method in permissions.SAFE_METHODS

        # For PatientInsurance
        if hasattr(obj, 'patient_insurance'):
            if obj.patient_insurance.patient == request.user:
                return request.method in permissions.SAFE_METHODS

        return request.user.is_staff or (
                hasattr(request.user, 'groups') and
                request.user.groups.filter(name='Insurance Staff').exists()
        )


class InsuranceProviderViewSet(viewsets.ModelViewSet):
    queryset = InsuranceProvider.objects.all()
    serializer_class = InsuranceProviderSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrInsuranceStaff]


class PatientInsuranceViewSet(viewsets.ModelViewSet):
    serializer_class = PatientInsuranceSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientOrStaff]

    def get_queryset(self):
        user = self.request.user

        # Staff can see all patient insurances
        if user.is_staff:
            return PatientInsurance.objects.all()

        # Regular users can only see their own insurance details
        return PatientInsurance.objects.filter(patient=user)

    def perform_create(self, serializer):
        # If not staff, can only create insurance for themselves
        if not self.request.user.is_staff:
            serializer.save(patient=self.request.user)
        else:
            serializer.save()


class BillViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsPatientOrStaff]

    def get_serializer_class(self):
        if self.action == 'create':
            return BillCreateSerializer
        return BillSerializer

    def get_queryset(self):
        user = self.request.user

        # Staff can see all bills
        if user.is_staff:
            return Bill.objects.all()

        # Regular users can only see their own bills
        return Bill.objects.filter(patient=user)

    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        bill = self.get_object()
        amount = request.data.get('amount')

        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Invalid amount value."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check that amount doesn't exceed remaining amount
        if amount > bill.remaining_amount:
            return Response(
                {"detail": f"Payment amount ({amount}) exceeds remaining amount ({bill.remaining_amount})."},
                status=status.HTTP_400_BAD_REQUEST
            )

        bill.paid_amount += amount

        # Update status based on payment
        if bill.paid_amount >= bill.total_amount:
            bill.status = 'paid'
        elif bill.paid_amount > 0:
            bill.status = 'partially_paid'

        bill.save()

        serializer = self.get_serializer(bill)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get billing statistics for staff"""
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to access this information."},
                status=status.HTTP_403_FORBIDDEN
            )

        total_bills = Bill.objects.count()
        total_amount = Bill.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        paid_amount = Bill.objects.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0

        status_counts = {}
        for status_choice, _ in Bill.STATUS_CHOICES:
            status_counts[status_choice] = Bill.objects.filter(status=status_choice).count()

        return Response({
            "total_bills": total_bills,
            "total_amount": total_amount,
            "paid_amount": paid_amount,
            "remaining_amount": total_amount - paid_amount,
            "payment_percentage": (paid_amount / total_amount * 100) if total_amount > 0 else 0,
            "status_counts": status_counts
        })


class InsuranceClaimViewSet(viewsets.ModelViewSet):
    serializer_class = InsuranceClaimSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientOrStaff]

    def get_queryset(self):
        user = self.request.user

        # Staff can see all claims
        if user.is_staff:
            return InsuranceClaim.objects.all()

        # Regular users can only see their own insurance claims
        return InsuranceClaim.objects.filter(patient_insurance__patient=user)

    @action(detail=True, methods=['post'])
    def submit_claim(self, request, pk=None):
        claim = self.get_object()

        if claim.status != 'draft':
            return Response(
                {"detail": "Only claims in draft status can be submitted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        claim.status = 'submitted'
        claim.save()

        serializer = self.get_serializer(claim)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff can update claim status."},
                status=status.HTTP_403_FORBIDDEN
            )

        claim = self.get_object()
        status_value = request.data.get('status')

        if status_value not in [status for status, _ in InsuranceClaim.STATUS_CHOICES]:
            return Response(
                {"detail": "Invalid status value."},
                status=status.HTTP_400_BAD_REQUEST
            )

        claim.status = status_value

        # If approved, update the approved_amount if provided
        if status_value in ['approved', 'partially_approved']:
            approved_amount = request.data.get('approved_amount')
            if approved_amount is not None:
                try:
                    claim.approved_amount = float(approved_amount)
                except (TypeError, ValueError):
                    return Response(
                        {"detail": "Invalid approved_amount value."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        claim.save()

        serializer = self.get_serializer(claim)
        return Response(serializer.data)
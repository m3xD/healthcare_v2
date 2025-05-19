from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    UserSerializer, ProfileSerializer, ProfileUpdateSerializer, RegisterSerializer
)
from ..models import Profile
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    @swagger_auto_schema(
        operation_summary="Register a new user",
        operation_description="Create a new user account"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Get user profile",
        operation_description="Returns the profile of the current authenticated user"
    )
    def get(self, request):
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @swagger_auto_schema(
        operation_summary="Update user profile",
        operation_description="Update the profile of the current authenticated user",
        request_body=ProfileUpdateSerializer
    )
    def put(self, request):
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(ProfileSerializer(profile).data)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
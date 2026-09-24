from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.users.models import User
from apps.users.permissions import IsAdministrator
from apps.users.serializers import (
    UserCreateSerializer,
    UserListSerializer,
    UserUpdateSerializer,
)


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [
        IsAuthenticated,
        IsAdministrator,
    ]

    def get_queryset(self):
        return User.objects.all().order_by(
            "last_name",
            "first_name",
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer

        return UserListSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [
        IsAuthenticated,
        IsAdministrator,
    ]

    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserUpdateSerializer

        return UserListSerializer

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.status = User.Status.INACTIVE
        instance.save(
            update_fields=[
                "is_active",
                "status",
                "updated_at",
            ]
        )

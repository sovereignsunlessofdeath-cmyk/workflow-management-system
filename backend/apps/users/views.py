from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.users.permissions import IsAdministrator
from apps.users.serializers import (
    UserCreateSerializer,
    UserListSerializer,
    UserUpdateSerializer,
)
from audit.services import (
    audit_user_created,
    audit_user_deactivated,
    audit_user_updated,
    serialize_user,
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

    def perform_create(self, serializer):
        user = serializer.save()

        audit_user_created(
            user,
            actor=self.request.user,
            request=self.request,
        )


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

    def perform_update(self, serializer):
        instance = self.get_object()

        before = serialize_user(instance)

        user = serializer.save()

        audit_user_updated(
            user,
            actor=self.request.user,
            before=before,
            request=self.request,
        )

    def perform_destroy(self, instance):
        before = serialize_user(instance)

        instance.is_active = False
        instance.status = User.Status.INACTIVE
        instance.save(
            update_fields=[
                "is_active",
                "status",
                "updated_at",
            ]
        )

        audit_user_deactivated(
            instance,
            actor=self.request.user,
            before=before,
            request=self.request,
        )

class AssignableUserListView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        if request.user.role not in [
            request.user.Role.ADMINISTRATOR,
            request.user.Role.MANAGER,
        ]:
            raise PermissionDenied(
                "Only Administrators and Managers can view assignable users."
            )

        users = User.objects.filter(
            status=User.Status.ACTIVE,
            is_active=True,
        ).order_by(
            "last_name",
            "first_name",
        )

        return Response(
            UserListSerializer(
                users,
                many=True,
            ).data
        )
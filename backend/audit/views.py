from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from audit.models import AuditLog
from audit.serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role != user.Role.ADMINISTRATOR:
            return AuditLog.objects.none()

        queryset = AuditLog.objects.select_related(
            "actor",
        ).all()

        action = self.request.query_params.get("action")
        target_type = self.request.query_params.get(
            "target_type"
        )
        actor = self.request.query_params.get("actor")
        target_id = self.request.query_params.get("target_id")

        if action:
            queryset = queryset.filter(action=action)

        if target_type:
            queryset = queryset.filter(
                target_type__iexact=target_type
            )

        if actor:
            queryset = queryset.filter(
                actor_id=actor
            )

        if target_id:
            queryset = queryset.filter(
                target_id=target_id
            )

        return queryset


class AuditLogDetailView(generics.RetrieveAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != self.request.user.Role.ADMINISTRATOR:
            return AuditLog.objects.none()

        return AuditLog.objects.select_related(
            "actor",
        ).all()

from django.utils import timezone
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from workflows.approval_serializers import (
    ApprovalDecisionSerializer,
    ApprovalSerializer,
)
from workflows.models import Approval, Task


class ApprovalListCreateView(generics.ListCreateAPIView):
    serializer_class = ApprovalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]:
            return Approval.objects.select_related(
                "task",
                "requested_by",
                "approver",
            ).all()

        if user.role == user.Role.APPROVER:
            return Approval.objects.select_related(
                "task",
                "requested_by",
                "approver",
            ).filter(
                approver=user
            )

        return Approval.objects.select_related(
            "task",
            "requested_by",
            "approver",
        ).filter(
            task__assigned_to=user
        )

    def perform_create(self, serializer):
        user = self.request.user

        if user.role not in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]:
            raise PermissionDenied(
                "Only Administrators and Managers can request approval."
            )

        task = serializer.validated_data["task"]

        if Approval.objects.filter(
            task=task,
            status=Approval.Status.PENDING,
        ).exists():
            raise ValidationError(
                "This task already has a pending approval."
            )

        approval = serializer.save(
            requested_by=user,
            status=Approval.Status.PENDING,
        )

        task.status = Task.Status.PENDING_APPROVAL
        task.completed_at = None
        task.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )


class ApprovalDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user

        if user.role != user.Role.APPROVER:
            raise PermissionDenied(
                "Only Approvers can make approval decisions."
            )

        try:
            approval = Approval.objects.select_related(
                "task",
                "approver",
            ).get(pk=pk)
        except Approval.DoesNotExist:
            return Response(
                {"detail": "Approval not found."},
                status=404,
            )

        if approval.approver_id != user.id:
            raise PermissionDenied(
                "You are not assigned to this approval."
            )

        if approval.status != Approval.Status.PENDING:
            raise ValidationError(
                "This approval has already been decided."
            )

        serializer = ApprovalDecisionSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        decision = serializer.validated_data["status"]
        comment = serializer.validated_data.get(
            "comment",
            "",
        )

        approval.status = decision
        approval.comment = comment
        approval.decided_at = timezone.now()
        approval.save(
            update_fields=[
                "status",
                "comment",
                "decided_at",
            ]
        )

        task = approval.task

        if decision == Approval.Status.APPROVED:
            task.status = Task.Status.COMPLETED
            task.completed_at = timezone.now()
        else:
            task.status = Task.Status.IN_PROGRESS
            task.completed_at = None

        task.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        return Response(
            ApprovalSerializer(approval).data
        )

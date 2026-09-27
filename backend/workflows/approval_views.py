from django.utils import timezone

from rest_framework import generics
from rest_framework.exceptions import (
    PermissionDenied,
    ValidationError,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.services import (
    audit_approval_decided,
    audit_approval_requested,
)
from notifications.services import (
    notify_approval_decided,
    notify_approval_requested,
)
from workflows.approval_serializers import (
    ApprovalDecisionSerializer,
    ApprovalSerializer,
)
from workflows.execution_services import complete_task
from workflows.models import Approval, Task


class ApprovalListCreateView(
    generics.ListCreateAPIView
):
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

        if task.status == Task.Status.COMPLETED:
            raise ValidationError(
                {
                    "task": (
                        "Completed tasks are locked. "
                        "Reopen the task before requesting another approval."
                    )
                }
            )

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

        audit_approval_requested(
            approval,
            actor=user,
            request=self.request,
        )

        notify_approval_requested(
            approval
        )


class ApprovalDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user

        if user.role not in [
            user.Role.ADMINISTRATOR,
            user.Role.APPROVER,
        ]:
            raise PermissionDenied(
                "Only Administrators and Approvers can make approval decisions."
            )

        try:
            approval = (
                Approval.objects.select_related(
                    "task",
                    "approver",
                    "requested_by",
                ).get(
                    pk=pk
                )
            )
        except Approval.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Approval not found."
                },
                status=404,
            )

        if (
            user.role ==
            user.Role.APPROVER
            and
            approval.approver_id !=
            user.id
        ):
            raise PermissionDenied(
                "You are not assigned to this approval."
            )

        if (
            approval.status !=
            Approval.Status.PENDING
        ):
            raise ValidationError(
                "This approval has already been decided."
            )

        before = {
            "status":
                approval.status,
            "comment":
                approval.comment,
            "decided_at": (
                approval.decided_at.isoformat()
                if approval.decided_at
                else None
            ),
        }

        serializer = (
            ApprovalDecisionSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        decision = (
            serializer.validated_data[
                "status"
            ]
        )

        comment = (
            serializer.validated_data.get(
                "comment",
                "",
            )
        )

        if (
            decision ==
            Approval.Status.APPROVED
        ):
            complete_task(
                approval.task
            )

            approval.status = decision
            approval.comment = comment
            approval.decided_at = (
                timezone.now()
            )

            approval.save(
                update_fields=[
                    "status",
                    "comment",
                    "decided_at",
                ]
            )

        else:
            approval.status = decision
            approval.comment = comment
            approval.decided_at = (
                timezone.now()
            )

            approval.save(
                update_fields=[
                    "status",
                    "comment",
                    "decided_at",
                ]
            )

            task = approval.task

            task.status = (
                Task.Status.IN_PROGRESS
            )

            task.completed_at = None

            task.save(
                update_fields=[
                    "status",
                    "completed_at",
                    "updated_at",
                ]
            )

        audit_approval_decided(
            approval,
            actor=user,
            before=before,
            request=request,
        )

        notify_approval_decided(
            approval
        )

        return Response(
            ApprovalSerializer(
                approval
            ).data
        )
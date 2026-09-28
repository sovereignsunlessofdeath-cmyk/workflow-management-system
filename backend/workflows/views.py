from django.db import transaction

from rest_framework import generics
from rest_framework.exceptions import (
    PermissionDenied,
    ValidationError,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import AuditLog
from audit.services import (
    audit_task_assigned,
    audit_task_cancelled,
    audit_task_completed,
    audit_task_created,
    audit_task_deleted,
    audit_task_updated,
    audit_workflow_archived,
    audit_workflow_created,
    record_audit,
    serialize_task,
    serialize_workflow,
)

from notifications.services import (
    notify_task_assigned,
    notify_task_completed,
    notify_task_ready_for_review,
    notify_task_status_changed,
    notify_workflow_archived,
    notify_workflow_created,
)

from workflows.execution_services import (
    complete_task,
    reopen_task,
)
from workflows.models import (
    Task,
    Workflow,
)
from workflows.permissions import (
    CanAccessTasks,
    CanManageWorkflows,
)
from workflows.serializers import (
    TaskSerializer,
    WorkflowSerializer,
)


class WorkflowListCreateView(
    generics.ListCreateAPIView
):
    queryset = (
        Workflow.objects
        .select_related(
            "created_by"
        )
        .all()
    )

    serializer_class = (
        WorkflowSerializer
    )

    permission_classes = [
        IsAuthenticated,
        CanManageWorkflows,
    ]

    def perform_create(
        self,
        serializer,
    ):
        workflow = (
            serializer.save(
                created_by=
                    self.request.user
            )
        )

        audit_workflow_created(
            workflow,
            actor=
                self.request.user,
            request=
                self.request,
        )

        notify_workflow_created(
            workflow
        )


class WorkflowDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = (
        Workflow.objects
        .select_related(
            "created_by"
        )
        .all()
    )

    serializer_class = (
        WorkflowSerializer
    )

    permission_classes = [
        IsAuthenticated,
        CanManageWorkflows,
    ]

    def perform_destroy(
        self,
        instance,
    ):
        before = (
            serialize_workflow(
                instance
            )
        )

        instance.status = (
            Workflow.Status.ARCHIVED
        )

        instance.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        audit_workflow_archived(
            instance,
            actor=
                self.request.user,
            before=before,
            request=
                self.request,
        )

        notify_workflow_archived(
            instance
        )


class TaskListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = (
        TaskSerializer
    )

    permission_classes = [
        IsAuthenticated,
        CanAccessTasks,
    ]

    def get_queryset(
        self,
    ):
        user = (
            self.request.user
        )

        queryset = (
            Task.objects
            .select_related(
                "workflow",
                "created_by",
                "assigned_to",
                "stage",
            )
        )

        if user.role in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
            user.Role.APPROVER,
        ]:
            return (
                queryset.all()
            )

        return queryset.filter(
            assigned_to=user
        )

    def perform_create(
        self,
        serializer,
    ):
        user = (
            self.request.user
        )

        if user.role not in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]:
            raise PermissionDenied(
                "Only Administrators and Managers can create tasks."
            )

        task = (
            serializer.save(
                created_by=user
            )
        )

        audit_task_created(
            task,
            actor=user,
            request=
                self.request,
        )

        if task.assigned_to:
            audit_task_assigned(
                task,
                actor=user,
                request=
                    self.request,
            )

            notify_task_assigned(
                task
            )


class TaskDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = (
        TaskSerializer
    )

    permission_classes = [
        IsAuthenticated,
        CanAccessTasks,
    ]

    def get_queryset(
        self,
    ):
        user = (
            self.request.user
        )

        queryset = (
            Task.objects
            .select_related(
                "workflow",
                "created_by",
                "assigned_to",
                "stage",
            )
        )

        if user.role in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
            user.Role.APPROVER,
        ]:
            return (
                queryset.all()
            )

        return queryset.filter(
            assigned_to=user
        )

@transaction.atomic
def perform_update(
    self,
    serializer,
):
    user = self.request.user

    # =================================
    # STAFF FIELD RESTRICTION
    # =================================

    if (
        user.role ==
        user.Role.STAFF
    ):
        allowed_fields = {
            "status",
        }

        incoming_fields = set(
            serializer
            .validated_data
            .keys()
        )

        if not (
            incoming_fields
            .issubset(
                allowed_fields
            )
        ):
            raise PermissionDenied(
                "Staff can only update task status."
            )

    # =================================
    # CURRENT TASK STATE
    # =================================

    current_task = (
        self.get_object()
    )

    old_status = (
        current_task.status
    )

    old_assigned_to_id = (
        current_task
        .assigned_to_id
    )

    before = (
        serialize_task(
            current_task
        )
    )

    requested_status = (
        serializer
        .validated_data
        .get(
            "status",
            old_status,
        )
    )

    # =================================
    # STAFF STATUS RESTRICTION
    # =================================

    if (
        user.role ==
        user.Role.STAFF
    ):
        staff_allowed_statuses = {
            Task.Status.TODO,
            Task.Status.IN_PROGRESS,
            Task.Status.DONE,
        }

        if (
            requested_status not in
            staff_allowed_statuses
        ):
            raise PermissionDenied(
                (
                    "Staff can only move tasks "
                    "between To Do, In Progress, "
                    "and Done."
                )
            )

    # =================================
    # COMPLETION PERMISSION
    # =================================

    if (
        requested_status ==
        Task.Status.COMPLETED
        and
        user.role not in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]
    ):
        raise PermissionDenied(
            (
                "Only Administrators and Managers "
                "can confirm task completion."
            )
        )

    completing_task = (
        requested_status ==
        Task.Status.COMPLETED
        and
        old_status !=
        Task.Status.COMPLETED
    )

    # =================================
    # COMPLETE TASK
    # =================================

    if completing_task:
        task = serializer.save(
            status=old_status
        )

        complete_task(
            task
        )

        task.refresh_from_db()

    else:
        task = (
            serializer.save()
        )

    assignment_changed = (
        old_assigned_to_id !=
        task.assigned_to_id
        and
        task.assigned_to
    )

    status_changed = (
        old_status !=
        task.status
    )

    # =================================
    # COMPLETED TASK AUDIT
    # =================================

    if completing_task:
        audit_task_completed(
            task,
            actor=user,
            before=before,
            request=
                self.request,
        )

        if status_changed:
            notify_task_status_changed(
                task,
                old_status,
                task.status,
            )

        notify_task_completed(
            task
        )

        return

    # =================================
    # NORMAL TASK UPDATE
    # =================================

    audit_task_updated(
        task,
        actor=user,
        before=before,
        request=
            self.request,
    )

    # =================================
    # ASSIGNMENT CHANGE
    # =================================

    if assignment_changed:
        audit_task_assigned(
            task,
            actor=user,
            before=before,
            request=
                self.request,
        )

        notify_task_assigned(
            task
        )

    # =================================
    # STATUS CHANGE
    # =================================

    if status_changed:
        notify_task_status_changed(
            task,
            old_status,
            task.status,
        )

        # Staff has finished the work
        # and management should review it.
        if (
            task.status ==
            Task.Status.DONE
        ):
            notify_task_ready_for_review(
                task
            )

    # =================================
    # CLEAR COMPLETION DATE
    # =================================

    if (
        status_changed
        and
        task.status !=
        Task.Status.COMPLETED
        and
        task.completed_at
        is not None
    ):
        task.completed_at = None

        task.save(
            update_fields=[
                "completed_at",
                "updated_at",
            ]
        )

    def perform_destroy(
        self,
        instance,
    ):
        user = (
            self.request.user
        )

        if user.role not in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]:
            raise PermissionDenied(
                "Only Administrators and Managers can delete tasks."
            )

        if (
            instance.status ==
            Task.Status.COMPLETED
        ):
            raise ValidationError(
                {
                    "detail": (
                        "Completed tasks are locked "
                        "and cannot be cancelled. "
                        "Reopen the task first."
                    )
                }
            )

        before = (
            serialize_task(
                instance
            )
        )

        instance.status = (
            Task.Status.CANCELLED
        )

        instance.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        audit_task_cancelled(
            instance,
            actor=user,
            before=before,
            request=
                self.request,
        )


class TaskReopenView(
    APIView
):
    permission_classes = [
        IsAuthenticated,
    ]

    @transaction.atomic
    def post(
        self,
        request,
        pk,
    ):
        user = (
            request.user
        )

        if (
            user.role !=
            user.Role.ADMINISTRATOR
        ):
            raise PermissionDenied(
                "Only Administrators can reopen completed tasks."
            )

        try:
            task = (
                Task.objects
                .select_related(
                    "workflow",
                    "created_by",
                    "assigned_to",
                    "stage",
                )
                .get(
                    pk=pk
                )
            )
        except Task.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Task not found."
                },
                status=404,
            )

        reason = str(
            request.data.get(
                "reason",
                "",
            )
        ).strip()

        if not reason:
            raise ValidationError(
                {
                    "reason": (
                        "A reason is required "
                        "to reopen a completed task."
                    )
                }
            )

        before = (
            serialize_task(
                task
            )
        )

        old_status = (
            task.status
        )

        task = reopen_task(
            task
        )

        task.refresh_from_db()

        record_audit(
            action=
                AuditLog.Action.TASK_UPDATED,
            actor=user,
            target=task,
            description=(
                f'Task "{task.title}" '
                "was reopened."
            ),
            before=before,
            after=
                serialize_task(
                    task
                ),
            metadata={
                "operation":
                    "TASK_REOPENED",
                "reason":
                    reason,
            },
            request=request,
        )

        notify_task_status_changed(
            task,
            old_status,
            task.status,
        )

        return Response(
            TaskSerializer(
                task
            ).data
        )

class TaskPermanentDeleteView(
    APIView
):
    permission_classes = [
        IsAuthenticated,
    ]

    @transaction.atomic
    def delete(
        self,
        request,
        pk,
    ):
        user = request.user

        if (
            user.role !=
            user.Role.ADMINISTRATOR
        ):
            raise PermissionDenied(
                "Only Administrators can permanently delete tasks."
            )

        try:
            task = (
                Task.objects
                .select_related(
                    "workflow",
                    "created_by",
                    "assigned_to",
                    "stage",
                )
                .get(
                    pk=pk
                )
            )
        except Task.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Task not found."
                },
                status=404,
            )

        before = serialize_task(
            task
        )

        audit_task_deleted(
            task,
            actor=user,
            before=before,
            request=request,
        )

        task.delete()

        return Response(
            status=204
        )
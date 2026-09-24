from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from workflows.models import Task, Workflow
from workflows.permissions import (
    CanAccessTasks,
    CanManageWorkflows,
)
from workflows.serializers import (
    TaskSerializer,
    WorkflowSerializer,
)


class WorkflowListCreateView(generics.ListCreateAPIView):
    queryset = Workflow.objects.select_related(
        "created_by"
    ).all()
    serializer_class = WorkflowSerializer
    permission_classes = [
        IsAuthenticated,
        CanManageWorkflows,
    ]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class WorkflowDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Workflow.objects.select_related(
        "created_by"
    ).all()
    serializer_class = WorkflowSerializer
    permission_classes = [
        IsAuthenticated,
        CanManageWorkflows,
    ]

    def perform_destroy(self, instance):
        instance.status = Workflow.Status.ARCHIVED
        instance.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [
        IsAuthenticated,
        CanAccessTasks,
    ]

    def get_queryset(self):
        user = self.request.user

        if user.role in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
            user.Role.APPROVER,
        ]:
            return Task.objects.select_related(
                "workflow",
                "created_by",
                "assigned_to",
                "stage",
            ).all()

        return Task.objects.select_related(
            "workflow",
            "created_by",
            "assigned_to",
            "stage",
        ).filter(
            assigned_to=user
        )

    def perform_create(self, serializer):
        if self.request.user.role not in [
            self.request.user.Role.ADMINISTRATOR,
            self.request.user.Role.MANAGER,
        ]:
            raise PermissionDenied(
                "Only Administrators and Managers can create tasks."
            )

        serializer.save(created_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [
        IsAuthenticated,
        CanAccessTasks,
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = Task.objects.select_related(
            "workflow",
            "created_by",
            "assigned_to",
            "stage",
        )

        if user.role in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
            user.Role.APPROVER,
        ]:
            return queryset.all()

        return queryset.filter(
            assigned_to=user
        )

    def perform_update(self, serializer):
        user = self.request.user

        if user.role == user.Role.STAFF:
            allowed_fields = {
                "status",
            }

            incoming_fields = set(
                serializer.validated_data.keys()
            )

            if not incoming_fields.issubset(
                allowed_fields
            ):
                raise PermissionDenied(
                    "Staff can only update task status."
                )

        task = serializer.save()

        if task.status == Task.Status.COMPLETED:
            from workflows.execution_services import complete_task

            complete_task(task)

        elif task.completed_at is not None:
            task.completed_at = None
            task.save(
                update_fields=[
                    "completed_at",
                    "updated_at",
                ]
            )

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role not in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]:
            raise PermissionDenied(
                "Only Administrators and Managers can delete tasks."
            )

        instance.status = Task.Status.CANCELLED
        instance.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

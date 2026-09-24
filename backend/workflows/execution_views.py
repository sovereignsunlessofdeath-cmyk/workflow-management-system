from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from workflows.execution_serializers import (
    TaskDependencySerializer,
    WorkflowStageSerializer,
)
from workflows.models import Task, TaskDependency, WorkflowStage
from workflows.permissions import CanManageWorkflows


class WorkflowStageListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkflowStageSerializer
    permission_classes = [
        IsAuthenticated,
        CanManageWorkflows,
    ]

    def get_queryset(self):
        return WorkflowStage.objects.select_related(
            "workflow"
        ).all()


class WorkflowStageDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = WorkflowStage.objects.select_related(
        "workflow"
    ).all()
    serializer_class = WorkflowStageSerializer
    permission_classes = [
        IsAuthenticated,
        CanManageWorkflows,
    ]


class TaskDependencyListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = TaskDependencySerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = TaskDependency.objects.select_related(
            "task",
            "depends_on",
        )

        if user.role in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
            user.Role.APPROVER,
        ]:
            return queryset.all()

        return queryset.filter(
            task__assigned_to=user
        )

    def perform_create(self, serializer):
        user = self.request.user

        if user.role not in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only Administrators and Managers can create dependencies."
            )

        serializer.save()


class TaskDependencyDetailView(
    generics.RetrieveDestroyAPIView
):
    serializer_class = TaskDependencySerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = TaskDependency.objects.select_related(
            "task",
            "depends_on",
        )

        if user.role in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]:
            return queryset.all()

        return queryset.filter(
            task__assigned_to=user
        )

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role not in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only Administrators and Managers can remove dependencies."
            )

        instance.delete()

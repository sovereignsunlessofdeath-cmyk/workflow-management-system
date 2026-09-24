from rest_framework.permissions import BasePermission


class CanManageWorkflows(BasePermission):
    message = "Administrator or Manager access is required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in [
                request.user.Role.ADMINISTRATOR,
                request.user.Role.MANAGER,
            ]
        )


class CanAccessTasks(BasePermission):

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
        )

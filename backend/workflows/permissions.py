from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)


class CanManageWorkflows(BasePermission):
    message = (
        "You do not have permission to perform this workflow action."
    )

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        # Read-only access
        if request.method in SAFE_METHODS:
            return user.role in [
                user.Role.ADMINISTRATOR,
                user.Role.MANAGER,
                user.Role.APPROVER,
            ]

        # Only Admins and Managers can modify workflows
        return user.role in [
            user.Role.ADMINISTRATOR,
            user.Role.MANAGER,
        ]


class CanAccessTasks(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
        )
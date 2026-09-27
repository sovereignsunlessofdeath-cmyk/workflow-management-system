from django.urls import path

from apps.users.views import (
    AssignableUserListView,
    UserDetailView,
    UserListCreateView,
)


urlpatterns = [
    path(
        "",
        UserListCreateView.as_view(),
        name="user-list-create",
    ),
    path(
        "assignable/",
        AssignableUserListView.as_view(),
        name="assignable-user-list",
    ),
    path(
        "<uuid:pk>/",
        UserDetailView.as_view(),
        name="user-detail",
    ),
]
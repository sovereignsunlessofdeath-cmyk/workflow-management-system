from django.urls import path

from apps.users.views import (
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
        "<uuid:pk>/",
        UserDetailView.as_view(),
        name="user-detail",
    ),
]

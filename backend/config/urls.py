from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),

    path(
        "api/v1/auth/",
        include("apps.authentication.urls"),
    ),

    path(
        "api/v1/users/",
        include("apps.users.urls"),
    ),

    path(
        "api/v1/",
        include("workflows.urls"),
    ),

    path(
        "api/v1/",
        include("notifications.urls"),
    ),

    path(
        "api/v1/",
        include("audit.urls"),
    ),

    path(
        "api/v1/",
        include("dashboard.urls"),
    ),
]

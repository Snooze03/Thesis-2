# from django.contrib import admin
# from django.urls import path, include
# from django.conf import settings
# from django.conf.urls.static import static

# urlpatterns = [
#     path("admin/", admin.site.urls),
#     path("accounts/", include("accounts.urls")),
#     path("workouts/", include("workouts.urls")),
#     path("assistant/", include("assistant.urls")),
#     path("nutrition/", include("nutrition.urls")),
#     # includes login & logout view
#     path("api-auth/", include("rest_framework.urls")),
# ]


# # Serve media files during development
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def root_view(request):
    """Root endpoint - API information"""
    return JsonResponse(
        {
            "message": "Prime DFit API",
            "version": "1.0",
            "status": "online",
            "endpoints": {
                "admin": "/admin/",
                "accounts": "/accounts/",
                "workouts": "/workouts/",
                "assistant": "/assistant/",
                "nutrition": "/nutrition/",
                "api_auth": "/api-auth/",
            },
        }
    )


urlpatterns = [
    path("", root_view, name="root"),  # Add root path
    path("admin/", admin.site.urls),
    path("accounts/", include("accounts.urls")),
    path("workouts/", include("workouts.urls")),
    path("assistant/", include("assistant.urls")),
    path("nutrition/", include("nutrition.urls")),
    # includes login & logout view
    path("api-auth/", include("rest_framework.urls")),
]


# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

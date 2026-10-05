# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path
from plane.app.views import (
    IdeaViewSet,
    KeyResultViewSet,
    ObjectiveViewSet,
)

urlpatterns = [
    # Objectives
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/objectives/",
        ObjectiveViewSet.as_view({"get": "list", "post": "create"}),
        name="project-objectives",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/objectives/<uuid:pk>/",
        ObjectiveViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-objective-detail",
    ),
    # Key Results
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/key-results/",
        KeyResultViewSet.as_view({"get": "list", "post": "create"}),
        name="project-key-results",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/key-results/<uuid:pk>/",
        KeyResultViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-key-result-detail",
    ),
    # Ideas
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/ideas/",
        IdeaViewSet.as_view({"get": "list", "post": "create"}),
        name="project-ideas",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/ideas/<uuid:pk>/",
        IdeaViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-idea-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/ideas/<uuid:pk>/upvote/",
        IdeaViewSet.as_view({"post": "upvote"}),
        name="project-idea-upvote",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/ideas/<uuid:pk>/convert-to-issue/",
        IdeaViewSet.as_view({"post": "convert_to_issue"}),
        name="project-idea-convert-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/ideas/<uuid:pk>/convert-to-module/",
        IdeaViewSet.as_view({"post": "convert_to_module"}),
        name="project-idea-convert-module",
    ),
]

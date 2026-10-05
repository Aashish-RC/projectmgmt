# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import transaction
from django.db.models import F
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    IdeaSerializer,
    KeyResultSerializer,
    ObjectiveSerializer,
)
from plane.app.views.base import BaseViewSet
from plane.db.models import Idea, IdeaStatus, Issue, KeyResult, Module, Objective, State, Workspace


class ObjectiveViewSet(BaseViewSet):
    serializer_class = ObjectiveSerializer
    model = Objective
    webhook_event = "objective"

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("project", "workspace", "owner")
            .prefetch_related("key_results")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace=workspace,
                project_id=project_id,
                created_by=request.user,
                updated_by=request.user,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class KeyResultViewSet(BaseViewSet):
    serializer_class = KeyResultSerializer
    model = KeyResult
    webhook_event = "key_result"

    def get_queryset(self):
        qs = (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("project", "workspace", "objective")
            .distinct()
        )
        objective_id = self.request.query_params.get("objective_id") or self.kwargs.get("objective_id")
        if objective_id:
            qs = qs.filter(objective_id=objective_id)
        return self.filter_queryset(qs)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace=workspace,
                project_id=project_id,
                created_by=request.user,
                updated_by=request.user,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IdeaViewSet(BaseViewSet):
    serializer_class = IdeaSerializer
    model = Idea
    webhook_event = "idea"

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("project", "workspace", "converted_issue", "converted_module")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace=workspace,
                project_id=project_id,
                created_by=request.user,
                updated_by=request.user,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @action(detail=True, methods=["post"], url_path="upvote")
    def upvote(self, request, slug, project_id, pk=None):
        idea = self.get_object()
        idea.upvotes_count = F("upvotes_count") + 1
        idea.save(update_fields=["upvotes_count", "updated_at"])
        idea.refresh_from_db(fields=["upvotes_count"])
        return Response(self.get_serializer(idea).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @action(detail=True, methods=["post"], url_path="convert-to-issue")
    def convert_to_issue(self, request, slug, project_id, pk=None):
        idea = self.get_object()

        with transaction.atomic():
            idea = Idea.objects.select_for_update().get(
                pk=idea.pk,
                project_id=project_id,
                workspace__slug=slug,
            )
            if idea.converted_issue_id or idea.converted_module_id:
                return Response(
                    {"error": "Idea is already converted"},
                    status=status.HTTP_409_CONFLICT,
                )

            # Get default project state
            default_state = (
                State.objects.filter(project_id=project_id, default=True).first()
                or State.objects.filter(project_id=project_id, group__in=["backlog", "unstarted"]).first()
            )

            issue = Issue.objects.create(
                workspace_id=idea.workspace_id,
                project_id=project_id,
                name=idea.title,
                description_html=idea.description_html or "<p></p>",
                state=default_state,
                created_by=request.user,
                updated_by=request.user,
            )

            idea.converted_issue = issue
            idea.status = IdeaStatus.CONVERTED.value
            idea.save(update_fields=["converted_issue", "status", "updated_at"])

        return Response(
            {
                "idea": self.get_serializer(idea).data,
                "issue_id": str(issue.id),
                "message": "Idea successfully converted to issue",
            },
            status=status.HTTP_201_CREATED,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @action(detail=True, methods=["post"], url_path="convert-to-module")
    def convert_to_module(self, request, slug, project_id, pk=None):
        idea = self.get_object()

        with transaction.atomic():
            idea = Idea.objects.select_for_update().get(
                pk=idea.pk,
                project_id=project_id,
                workspace__slug=slug,
            )
            if idea.converted_issue_id or idea.converted_module_id:
                return Response(
                    {"error": "Idea is already converted"},
                    status=status.HTTP_409_CONFLICT,
                )

            module = Module.objects.create(
                workspace_id=idea.workspace_id,
                project_id=project_id,
                name=idea.title,
                description_html=idea.description_html or "<p></p>",
                created_by=request.user,
                updated_by=request.user,
            )

            idea.converted_module = module
            idea.status = IdeaStatus.CONVERTED.value
            idea.save(update_fields=["converted_module", "status", "updated_at"])

        return Response(
            {
                "idea": self.get_serializer(idea).data,
                "module_id": str(module.id),
                "message": "Idea successfully converted to module",
            },
            status=status.HTTP_201_CREATED,
        )

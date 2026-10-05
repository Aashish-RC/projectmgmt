# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import IssueTimeLogSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import Issue, IssueTimeLog, Workspace


class IssueTimeLogViewSet(BaseViewSet):
    serializer_class = IssueTimeLogSerializer
    model = IssueTimeLog
    webhook_event = "issue_time_log"

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("project", "workspace", "issue", "created_by")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, issue_id):
        workspace = Workspace.objects.get(slug=slug)
        issue = Issue.objects.get(pk=issue_id, project_id=project_id)
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace=workspace,
                project_id=project_id,
                issue=issue,
                created_by=request.user,
                updated_by=request.user,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

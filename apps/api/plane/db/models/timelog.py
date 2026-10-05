# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from .project import ProjectBaseModel


class IssueTimeLog(ProjectBaseModel):
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="time_logs",
    )
    duration_minutes = models.PositiveIntegerField(
        default=0,
        verbose_name="Duration in minutes",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Issue Time Log"
        verbose_name_plural = "Issue Time Logs"
        db_table = "issue_time_logs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} - {self.duration_minutes}m"

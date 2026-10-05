# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .project import ProjectBaseModel


class ObjectiveStatus(models.TextChoices):
    ON_TRACK = "on_track", "On Track"
    AT_RISK = "at_risk", "At Risk"
    BEHIND = "behind", "Behind"
    COMPLETED = "completed", "Completed"


class IdeaStatus(models.TextChoices):
    NEW = "new", "New"
    UNDER_REVIEW = "under_review", "Under Review"
    VALIDATED = "validated", "Validated"
    REJECTED = "rejected", "Rejected"
    CONVERTED = "converted", "Converted"


class Objective(ProjectBaseModel):
    title = models.CharField(max_length=255, verbose_name="Objective Title")
    description = models.TextField(blank=True, null=True, verbose_name="Objective Description")
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=30,
        choices=ObjectiveStatus.choices,
        default=ObjectiveStatus.ON_TRACK,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="objective_owner",
    )

    class Meta:
        verbose_name = "Objective"
        verbose_name_plural = "Objectives"
        db_table = "objectives"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.title} <{self.project.name}>"

    @property
    def progress(self):
        """Dynamic progress rollup across all child KeyResults."""
        key_results = self.key_results.filter(deleted_at__isnull=True)
        if not key_results.exists():
            return 100.0 if self.status == ObjectiveStatus.COMPLETED.value else 0.0

        total_progress = sum(kr.compute_progress() for kr in key_results)
        return round(total_progress / key_results.count(), 2)

    @property
    def key_results_count(self):
        return self.key_results.filter(deleted_at__isnull=True).count()


class KeyResult(ProjectBaseModel):
    objective = models.ForeignKey(
        Objective,
        on_delete=models.CASCADE,
        related_name="key_results",
    )
    title = models.CharField(max_length=255, verbose_name="Key Result Title")
    initial_value = models.FloatField(default=0.0)
    target_value = models.FloatField(default=100.0)
    current_value = models.FloatField(default=0.0)
    unit = models.CharField(max_length=50, default="percentage")
    auto_compute = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Key Result"
        verbose_name_plural = "Key Results"
        db_table = "key_results"
        ordering = ("created_at",)

    def __str__(self):
        return f"{self.title} -> {self.objective.title}"

    def compute_progress(self):
        """
        Calculates Key Result progress percentage.
        When auto_compute is enabled, aggregates completed work items
        from all linked Cycles and Modules.
        """
        if self.auto_compute:
            from plane.db.models.issue import Issue

            # Get issues from linked cycles
            cycle_issue_ids = Issue.objects.filter(
                issue_cycle__cycle__key_result=self,
                deleted_at__isnull=True,
            ).values_list("id", flat=True)

            # Get issues from linked modules
            module_issue_ids = Issue.objects.filter(
                issue_module__module__key_result=self,
                deleted_at__isnull=True,
            ).values_list("id", flat=True)

            all_issue_ids = set(cycle_issue_ids).union(set(module_issue_ids))

            if all_issue_ids:
                total_issues = Issue.objects.filter(id__in=all_issue_ids, deleted_at__isnull=True)
                total_count = total_issues.count()
                completed_count = total_issues.filter(
                    state__group__in=["completed", "cancelled"]
                ).count()

                if total_count > 0:
                    ratio = completed_count / total_count
                    range_val = self.target_value - self.initial_value
                    self.current_value = round(self.initial_value + (range_val * ratio), 2)
                    return round(ratio * 100, 2)

        # Fallback to direct current_value calculation
        range_val = self.target_value - self.initial_value
        if range_val > 0:
            calc_pct = (self.current_value - self.initial_value) / range_val * 100
            return round(min(max(calc_pct, 0.0), 100.0), 2)
        return 0.0

    @property
    def progress_percentage(self):
        return self.compute_progress()


class Idea(ProjectBaseModel):
    title = models.CharField(max_length=255, verbose_name="Idea Title")
    description_html = models.TextField(blank=True, default="<p></p>")
    status = models.CharField(
        max_length=30,
        choices=IdeaStatus.choices,
        default=IdeaStatus.NEW,
    )
    effort = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    impact = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    upvotes_count = models.IntegerField(default=0)
    converted_issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="converted_from_idea",
    )
    converted_module = models.ForeignKey(
        "db.Module",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="converted_from_idea",
    )

    class Meta:
        verbose_name = "Idea"
        verbose_name_plural = "Ideas"
        db_table = "ideas"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.title} ({self.status})"

    @property
    def matrix_quadrant(self):
        """
        Impact vs Effort 2x2 Matrix mapping:
        - High Impact (>= 3), Low Effort (<= 2): Quick Wins
        - High Impact (>= 3), High Effort (>= 3): Major Projects
        - Low Impact (<= 2), Low Effort (<= 2): Fill-ins
        - Low Impact (<= 2), High Effort (>= 3): Thankless Tasks
        """
        if self.impact >= 3:
            return "quick_wins" if self.effort <= 2 else "major_projects"
        else:
            return "fill_ins" if self.effort <= 2 else "thankless_tasks"

# Generated for Plane v1.4.2 Enriched Reference Engines

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0122_alter_draftissue_assignees_alter_issue_assignees_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Project model feature switch & governance extensions
        migrations.AddField(
            model_name="project",
            name="is_speed_engine_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="project",
            name="is_cascading_gantt_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="project",
            name="is_wbs_numbering_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="project",
            name="is_canonical_state_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="project",
            name="is_strategic_okr_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="project",
            name="is_focus_timer_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="project",
            name="is_tactile_kanban_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="project",
            name="default_complexity",
            field=models.CharField(
                choices=[("minimal", "Minimal"), ("standard", "Standard"), ("deep", "Deep")],
                default="standard",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="complexity_policy",
            field=models.CharField(
                choices=[("open", "Open"), ("bounded", "Bounded"), ("locked", "Locked")],
                default="bounded",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="mandatory_fields",
            field=models.JSONField(blank=True, default=list),
        ),

        # 2. Objective model
        migrations.CreateModel(
            name="Objective",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("title", models.CharField(max_length=255, verbose_name="Objective Title")),
                ("description", models.TextField(blank=True, null=True, verbose_name="Objective Description")),
                ("start_date", models.DateField(blank=True, null=True)),
                ("target_date", models.DateField(blank=True, null=True)),
                ("status", models.CharField(choices=[("on_track", "On Track"), ("at_risk", "At Risk"), ("behind", "Behind"), ("completed", "Completed")], default="on_track", max_length=30)),
                (
                    "created_by",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By"),
                ),
                (
                    "updated_by",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By"),
                ),
                (
                    "owner",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="objective_owner", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "project",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_%(class)s", to="db.project"),
                ),
                (
                    "workspace",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="workspace_%(class)s", to="db.workspace"),
                ),
            ],
            options={
                "verbose_name": "Objective",
                "verbose_name_plural": "Objectives",
                "db_table": "objectives",
                "ordering": ("-created_at",),
            },
        ),

        # 3. KeyResult model
        migrations.CreateModel(
            name="KeyResult",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("title", models.CharField(max_length=255, verbose_name="Key Result Title")),
                ("initial_value", models.FloatField(default=0.0)),
                ("target_value", models.FloatField(default=100.0)),
                ("current_value", models.FloatField(default=0.0)),
                ("unit", models.CharField(default="percentage", max_length=50)),
                ("auto_compute", models.BooleanField(default=True)),
                (
                    "created_by",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By"),
                ),
                (
                    "updated_by",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By"),
                ),
                (
                    "objective",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="key_results", to="db.objective"),
                ),
                (
                    "project",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_%(class)s", to="db.project"),
                ),
                (
                    "workspace",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="workspace_%(class)s", to="db.workspace"),
                ),
            ],
            options={
                "verbose_name": "Key Result",
                "verbose_name_plural": "Key Results",
                "db_table": "key_results",
                "ordering": ("created_at",),
            },
        ),

        # 4. Idea model
        migrations.CreateModel(
            name="Idea",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("title", models.CharField(max_length=255, verbose_name="Idea Title")),
                ("description_html", models.TextField(blank=True, default="<p></p>")),
                ("status", models.CharField(choices=[("new", "New"), ("under_review", "Under Review"), ("validated", "Validated"), ("rejected", "Rejected"), ("converted", "Converted")], default="new", max_length=30)),
                ("effort", models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])),
                ("impact", models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])),
                ("upvotes_count", models.IntegerField(default=0)),
                (
                    "created_by",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By"),
                ),
                (
                    "updated_by",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By"),
                ),
                (
                    "converted_issue",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="converted_from_idea", to="db.issue"),
                ),
                (
                    "converted_module",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="converted_from_idea", to="db.module"),
                ),
                (
                    "project",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_%(class)s", to="db.project"),
                ),
                (
                    "workspace",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="workspace_%(class)s", to="db.workspace"),
                ),
            ],
            options={
                "verbose_name": "Idea",
                "verbose_name_plural": "Ideas",
                "db_table": "ideas",
                "ordering": ("-created_at",),
            },
        ),

        # 5. IssueTimeLog model
        migrations.CreateModel(
            name="IssueTimeLog",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("duration_minutes", models.PositiveIntegerField(default=0, verbose_name="Duration in minutes")),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("notes", models.TextField(blank=True, null=True)),
                (
                    "created_by",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By"),
                ),
                (
                    "updated_by",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By"),
                ),
                (
                    "issue",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="time_logs", to="db.issue"),
                ),
                (
                    "project",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_%(class)s", to="db.project"),
                ),
                (
                    "workspace",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="workspace_%(class)s", to="db.workspace"),
                ),
            ],
            options={
                "verbose_name": "Issue Time Log",
                "verbose_name_plural": "Issue Time Logs",
                "db_table": "issue_time_logs",
                "ordering": ("-created_at",),
            },
        ),
    ]

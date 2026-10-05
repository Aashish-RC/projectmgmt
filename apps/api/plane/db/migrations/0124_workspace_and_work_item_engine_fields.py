from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0123_enriched_engines_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspace",
            name="default_complexity",
            field=models.CharField(
                choices=[("minimal", "Minimal"), ("standard", "Standard"), ("deep", "Deep")],
                default="standard",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="workspace",
            name="complexity_policy",
            field=models.CharField(
                choices=[("open", "Open"), ("bounded", "Bounded"), ("locked", "Locked")],
                default="bounded",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="workspace",
            name="mandatory_fields",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="cycle",
            name="key_result",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cycle_key_results",
                to="db.keyresult",
            ),
        ),
        migrations.AddField(
            model_name="module",
            name="key_result",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="module_key_results",
                to="db.keyresult",
            ),
        ),
    ]

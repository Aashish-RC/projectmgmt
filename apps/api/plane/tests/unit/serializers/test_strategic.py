from types import SimpleNamespace

import pytest
from rest_framework import serializers

from plane.app.serializers.strategic import KeyResultSerializer


@pytest.mark.unit
class TestKeyResultSerializer:
    def test_rejects_objective_from_another_project(self):
        serializer = KeyResultSerializer(context={"view": SimpleNamespace(kwargs={"project_id": "project-a"})})
        objective = SimpleNamespace(project_id="project-b")

        with pytest.raises(serializers.ValidationError, match="Objective must belong to this project"):
            serializer.validate_objective(objective)

    def test_accepts_objective_from_route_project(self):
        serializer = KeyResultSerializer(context={"view": SimpleNamespace(kwargs={"project_id": "project-a"})})
        objective = SimpleNamespace(project_id="project-a")

        assert serializer.validate_objective(objective) is objective

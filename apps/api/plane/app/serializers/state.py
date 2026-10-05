# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from .base import BaseSerializer
from rest_framework import serializers

from plane.db.models import State, StateGroup


class StateSerializer(BaseSerializer):
    order = serializers.FloatField(required=False)
    canonical_group = serializers.CharField(read_only=True)

    class Meta:
        model = State
        fields = [
            "id",
            "project_id",
            "workspace_id",
            "name",
            "color",
            "group",
            "canonical_group",
            "default",
            "description",
            "sequence",
            "order",
        ]
        read_only_fields = ["workspace", "project"]

    def validate(self, attrs):
        if attrs.get("group") == StateGroup.TRIAGE.value:
            raise serializers.ValidationError("Cannot create triage state")
        return attrs


class StateLiteSerializer(BaseSerializer):
    canonical_group = serializers.CharField(read_only=True)

    class Meta:
        model = State
        fields = ["id", "name", "color", "group", "canonical_group"]
        read_only_fields = fields

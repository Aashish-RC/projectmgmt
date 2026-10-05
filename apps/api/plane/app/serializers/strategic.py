# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import Objective, KeyResult, Idea


class KeyResultSerializer(BaseSerializer):
    progress_percentage = serializers.FloatField(read_only=True)
    linked_cycles_count = serializers.SerializerMethodField()
    linked_modules_count = serializers.SerializerMethodField()

    def get_linked_cycles_count(self, obj):
        return obj.cycle_key_results.filter(deleted_at__isnull=True).count()

    def get_linked_modules_count(self, obj):
        return obj.module_key_results.filter(deleted_at__isnull=True).count()

    class Meta:
        model = KeyResult
        fields = "__all__"
        read_only_fields = ["workspace", "project", "created_by", "updated_by", "created_at", "updated_at"]


class ObjectiveSerializer(BaseSerializer):
    owner_details = UserLiteSerializer(source="owner", read_only=True)
    key_results = KeyResultSerializer(many=True, read_only=True)
    progress = serializers.FloatField(read_only=True)
    key_results_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Objective
        fields = "__all__"
        read_only_fields = ["workspace", "project", "created_by", "updated_by", "created_at", "updated_at"]


class IdeaSerializer(BaseSerializer):
    matrix_quadrant = serializers.CharField(read_only=True)

    class Meta:
        model = Idea
        fields = "__all__"
        read_only_fields = ["workspace", "project", "created_by", "updated_by", "created_at", "updated_at"]

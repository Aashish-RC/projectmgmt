# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import IssueTimeLog


class IssueTimeLogSerializer(BaseSerializer):
    created_by_details = UserLiteSerializer(source="created_by", read_only=True)

    class Meta:
        model = IssueTimeLog
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

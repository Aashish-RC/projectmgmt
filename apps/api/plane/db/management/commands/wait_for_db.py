# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import time
from django.db import connections
from django.core.management import BaseCommand


class Command(BaseCommand):
    """Django command to pause execution until db is available"""

    def handle(self, *args, **options):
        db = connections["default"]
        settings = db.settings_dict
        host = settings.get("HOST")
        port = settings.get("PORT")
        name = settings.get("NAME")
        user = settings.get("USER")
        self.stdout.write(f"Waiting for database at {host}:{port} (db: {name}, user: {user})...")

        db_conn = None
        while not db_conn:
            try:
                connection = connections["default"]
                connection.cursor()
                db_conn = connection
            except Exception as e:
                self.stdout.write(f"Database unavailable ({type(e).__name__}: {e}), waiting 1 second...")
                time.sleep(1)

        self.stdout.write(self.style.SUCCESS("Database available!"))

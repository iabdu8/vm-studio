# Destructive Migrations

These SQL files intentionally delete production-shaped data and must never live in the normal `database/migrations` apply path.

Run them only against disposable development data after an explicit human review. They are kept here for historical reference and emergency/manual maintenance, not automated deployment.

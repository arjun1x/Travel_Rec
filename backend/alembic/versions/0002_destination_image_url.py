"""add image_url to destinations

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-06

"""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("destinations", sa.Column("image_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("destinations", "image_url")

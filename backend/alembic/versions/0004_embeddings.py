"""add embedding vectors to destinations and listings

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-06

"""

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("destinations", sa.Column("embedding", Vector(), nullable=True))
    op.add_column("listings", sa.Column("embedding", Vector(), nullable=True))


def downgrade() -> None:
    op.drop_column("listings", "embedding")
    op.drop_column("destinations", "embedding")

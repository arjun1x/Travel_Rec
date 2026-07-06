"""create destinations table

Revision ID: 0001
Revises:
Create Date: 2026-07-06

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        "destinations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("country", sa.String(length=100), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("tags", ARRAY(sa.String()), nullable=False),
        sa.Column("popularity_score", sa.Float(), nullable=False),
    )
    op.create_index(op.f("ix_destinations_name"), "destinations", ["name"], unique=True)
    op.create_index(op.f("ix_destinations_country"), "destinations", ["country"])


def downgrade() -> None:
    op.drop_index(op.f("ix_destinations_country"), table_name="destinations")
    op.drop_index(op.f("ix_destinations_name"), table_name="destinations")
    op.drop_table("destinations")
    # the vector extension is left installed intentionally

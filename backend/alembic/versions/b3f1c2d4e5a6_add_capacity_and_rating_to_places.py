"""add capacity and rating to places

Revision ID: b3f1c2d4e5a6
Revises: 8aa94614c2f1
Create Date: 2026-11-05 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b3f1c2d4e5a6"
down_revision: Union[str, Sequence[str], None] = "8aa94614c2f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "places",
        sa.Column(
            "capacity_tier", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
    )
    # server_default fills existing rows with 0, otherwise NOT NULL would fail
    op.add_column(
        "places",
        sa.Column("reviews_count", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column("places", sa.Column("average_rating", sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("places", "average_rating")
    op.drop_column("places", "reviews_count")
    op.drop_column("places", "capacity_tier")

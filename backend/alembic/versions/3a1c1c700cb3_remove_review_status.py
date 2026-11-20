"""remove review status

Revision ID: 3a1c1c700cb3
Revises: f2f1994680c1
Create Date: 2026-11-15 10:33:00.810658

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "3a1c1c700cb3"
down_revision: Union[str, Sequence[str], None] = "f2f1994680c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("reviews", "status")
    op.execute("DROP TYPE review_status")


def downgrade() -> None:
    review_status = sa.Enum(
        "PENDING",
        "APPROVED",
        "REJECTED",
        name="review_status",
    )
    review_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "reviews",
        sa.Column(
            "status",
            review_status,
            nullable=False,
            server_default="PENDING",
        ),
    )

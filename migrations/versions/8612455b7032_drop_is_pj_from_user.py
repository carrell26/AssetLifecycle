"""drop is_pj from user

Revision ID: 8612455b7032
Revises: a17c7863cac8
Create Date: 2026-10-22 01:06:16.561996

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8612455b7032'
down_revision = 'a17c7863cac8'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('is_pj')


def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_pj', sa.BOOLEAN(), nullable=True, server_default=sa.text('0')))

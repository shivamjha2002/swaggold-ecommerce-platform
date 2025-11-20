"""Sales API routes."""
from flask import Blueprint

bp = Blueprint('sales', __name__)


@bp.route('/', methods=['POST'])
def create_sale():
    """Create new sale."""
    return {'message': 'Create sale - to be implemented'}


@bp.route('/', methods=['GET'])
def get_sales():
    """Get all sales."""
    return {'message': 'Get sales - to be implemented'}

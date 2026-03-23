from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.cache_service import CacheService
from app.services.background_job_service import BackgroundJobService

performance_bp = Blueprint('performance', __name__)


def get_current_user():
    from flask_jwt_extended import get_jwt_identity
    from app.models.user import User
    return User.query.get(get_jwt_identity())


@performance_bp.route('/cache/stats', methods=['GET'])
@jwt_required()
def cache_stats():
    user = get_current_user()
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    return jsonify(CacheService.get_stats())


@performance_bp.route('/cache/flush', methods=['POST'])
@jwt_required()
def cache_flush():
    user = get_current_user()
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    CacheService.flush()
    return jsonify({'message': 'Cache flushed'})


@performance_bp.route('/jobs', methods=['GET'])
@jwt_required()
def list_jobs():
    user = get_current_user()
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    return jsonify({'jobs': BackgroundJobService.list_jobs()})


@performance_bp.route('/jobs/<job_id>', methods=['GET'])
@jwt_required()
def get_job(job_id):
    status = BackgroundJobService.get_job_status(job_id)
    if not status:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify({'job_id': job_id, **status})


@performance_bp.route('/jobs/stats', methods=['GET'])
@jwt_required()
def job_stats():
    user = get_current_user()
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    return jsonify(BackgroundJobService.get_queue_stats())


@performance_bp.route('/jobs/cleanup', methods=['POST'])
@jwt_required()
def cleanup_jobs():
    user = get_current_user()
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    BackgroundJobService.cleanup_old()
    return jsonify({'message': 'Old jobs cleaned up'})

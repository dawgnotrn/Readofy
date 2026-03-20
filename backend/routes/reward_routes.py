from flask import Blueprint, request, jsonify, session
import sys
import os

# Add the project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.supabase_config import get_supabase

reward_bp = Blueprint('reward', __name__)

def update_user_level(points):
    """Helper to determine the badge/level based on points"""
    if points < 50:
        return "Novice Reader"
    elif points < 150:
        return "Bookworm"
    elif points < 300:
        return "Avid Reader"
    elif points < 500:
        return "Bibliophile"
    else:
        return "Literary Scholar"

@reward_bp.route('/api/rewards', methods=['GET'])
def get_rewards():
    """API endpoint to fetch the user's reward points and level"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        supabase = get_supabase()
        # Fetch rewards
        response = supabase.table('userrewards').select('*').eq('user_id', session['user_id']).execute()
        
        if not response.data or len(response.data) == 0:
            # Create a reward entry if it doesn't exist
            supabase.table('userrewards').insert({
                'user_id': session['user_id'],
                'points': 0,
                'level': 'Novice Reader'
            }).execute()
            return jsonify({"points": 0, "level": "Novice Reader"})
            
        reward_data = response.data[0]
        return jsonify({"points": reward_data.get('points', 0), "level": reward_data.get('level', "Novice Reader")})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reward_bp.route('/api/rewards/add', methods=['POST'])
def add_points():
    """API endpoint to add points to a user. Used internally or after certain actions."""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    points_to_add = data.get('points', 0)
    
    if not points_to_add:
        return jsonify({"error": "Points are required"}), 400
        
    try:
        supabase = get_supabase()
        # Fetch current rewards
        response = supabase.table('userrewards').select('*').eq('user_id', session['user_id']).execute()
        
        if not response.data or len(response.data) == 0:
            new_level = update_user_level(points_to_add)
            supabase.table('userrewards').insert({
                'user_id': session['user_id'],
                'points': points_to_add,
                'level': new_level
            }).execute()
            return jsonify({"success": "Points added", "new_total": points_to_add, "level": new_level})
        else:
            current_points = response.data[0].get('points', 0)
            new_total = current_points + points_to_add
            new_level = update_user_level(new_total)
            
            supabase.table('userrewards').update({
                'points': new_total,
                'level': new_level
            }).eq('user_id', session['user_id']).execute()
            
            return jsonify({"success": "Points updated", "new_total": new_total, "level": new_level})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from flask import Blueprint, request, jsonify, session
import sys
import os

# Add the project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.supabase_config import get_supabase

club_bp = Blueprint('club', __name__)

@club_bp.route('/api/clubs', methods=['GET'])
def get_clubs():
    """API endpoint to get all community book clubs"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        supabase = get_supabase()
        response = supabase.table('bookclubs').select('*').execute()
        clubs = response.data if response.data else []
        return jsonify({"clubs": clubs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@club_bp.route('/api/clubs/<club_id>/messages', methods=['GET'])
def get_club_messages(club_id):
    """API endpoint to get messages for a specific club"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        supabase = get_supabase()
        response = supabase.table('clubmessages').select('*, users(name)').eq('club_id', club_id).order('created_at').execute()
        messages = response.data if response.data else []
        return jsonify({"messages": messages})
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return jsonify({"error": str(e)}), 500

@club_bp.route('/api/clubs/<club_id>/messages', methods=['POST'])
def send_club_message(club_id):
    """API endpoint to send a message to a club"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    message = data.get('message')
    
    if not message:
        return jsonify({"error": "Message is required"}), 400
        
    try:
        supabase = get_supabase()
        supabase.table('clubmessages').insert({
            'club_id': club_id,
            'user_id': session['user_id'],
            'message': message
        }).execute()
        return jsonify({"success": "Message sent"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@club_bp.route('/api/clubs/<club_id>/join', methods=['POST'])
def join_club(club_id):
    """API endpoint to join a club"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        supabase = get_supabase()
        
        # Check if already a member
        existing = supabase.table('clubmembers').select('*').eq('club_id', club_id).eq('user_id', session['user_id']).execute()
        if existing.data:
            return jsonify({"success": "Already joined"})
            
        supabase.table('clubmembers').insert({
            'club_id': club_id,
            'user_id': session['user_id']
        }).execute()
        return jsonify({"success": "Joined club successfully"})
    except Exception as e:
        # Ignore unique constraint errors
        return jsonify({"error": str(e)}), 500

@club_bp.route('/api/clubs/my', methods=['GET'])
def get_my_clubs():
    """API endpoint to get clubs the user has joined"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        supabase = get_supabase()
        response = supabase.table('clubmembers').select('club_id, bookclubs(*)').eq('user_id', session['user_id']).execute()
        clubs = [item['bookclubs'] for item in (response.data or []) if 'bookclubs' in item]
        return jsonify({"clubs": clubs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from flask import Blueprint, request, jsonify, session
import sys
import os

# Add the project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from api.openrouter_api import ask_chatbot

chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/api/chat', methods=['POST'])
def chat():
    """API endpoint to handle chatbot interactions"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    question = data.get('question', '')
    
    if not question:
        return jsonify({"response": "I didn't hear a question! Try asking me something."})
        
    try:
        response_text = ask_chatbot(question)
        return jsonify({"response": response_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

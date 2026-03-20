from flask import Blueprint, render_template, request, session, redirect, url_for, flash, jsonify
import sys
import os

# Add the project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.supabase_config import get_supabase
from api.google_books import search_books

book_bp = Blueprint('book', __name__)

@book_bp.route('/read/<google_books_id>')
def read_book(google_books_id):
    """Renders the embedded Google Books reader page"""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    return render_template('reader.html', book_id=google_books_id, name=session.get('user_name'))

@book_bp.route('/dashboard')
def dashboard():
    """Renders the main dashboard for logged-in users"""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
        
    try:
        supabase = get_supabase()
        # Fetch borrowed books
        borrowed_books_response = supabase.table('borrowedbooks').select('*').eq('user_id', session['user_id']).execute()
        borrowed_books = borrowed_books_response.data if borrowed_books_response.data else []
        
        # Fetch wishlist
        try:
            wishlist_response = supabase.table('wishlist').select('*').eq('user_id', session['user_id']).execute()
            wishlist_books = wishlist_response.data if wishlist_response.data else []
        except:
            wishlist_books = []
            
        # Fetch rewards
        try:
            rewards_response = supabase.table('userrewards').select('*').eq('user_id', session['user_id']).execute()
            if not rewards_response.data:
                supabase.table('userrewards').insert({'user_id': session['user_id'], 'points': 0, 'level': 'Novice Reader'}).execute()
                rewards = {'points': 0, 'level': 'Novice Reader'}
            else:
                rewards = rewards_response.data[0]
        except:
            rewards = {'points': 0, 'level': 'Novice Reader'}
            
        # Get Varied Recommendations (example categories)
        try:
            import random
            categories = ['Fiction', 'Technology', 'Science', 'Mystery', 'History']
            category = random.choice(categories)
            suggestions = search_books(f"subject:{category}")[:6]
        except:
            suggestions = []
        
        return render_template('dashboard.html', name=session.get('user_name'), borrowed_books=borrowed_books, wishlist_books=wishlist_books, rewards=rewards, suggestions=suggestions)
    except Exception as e:
        flash(f"Error loading dashboard: {e}", "error")
        return render_template('dashboard.html', name=session.get('user_name'), borrowed_books=[], wishlist_books=[], rewards={'points':0}, suggestions=[])

@book_bp.route('/api/search')
def search():
    """API endpoint to search for books via Google Books API"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    query = request.args.get('q', '')
    if not query:
        return jsonify({"books": []})
        
    books = search_books(query)
    return jsonify({"books": books})

@book_bp.route('/api/borrow', methods=['POST'])
def borrow_book():
    """API endpoint to borrow a book"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    book_title = data.get('title')
    book_author = data.get('author')
    google_books_id = data.get('id')
    
    if not book_title:
        return jsonify({"error": "Book title is required"}), 400
        
    try:
        supabase = get_supabase()
        # Check if already borrowed
        existing = supabase.table('borrowedbooks').select('*').eq('user_id', session['user_id']).eq('google_books_id', google_books_id).execute()
        
        if existing.data and len(existing.data) > 0:
            return jsonify({"error": "You already borrowed this book"}), 400
            
        supabase.table('borrowedbooks').insert({
            'user_id': session['user_id'],
            'book_title': book_title,
            'book_author': book_author,
            'google_books_id': google_books_id
        }).execute()
        
        # Add 10 points for borrowing a book (requires executing from backend context, we just do it via supabase)
        try:
            reward_res = supabase.table('userrewards').select('*').eq('user_id', session['user_id']).execute()
            if reward_res.data:
                curr_pts = reward_res.data[0].get('points', 0)
                new_pts = curr_pts + 10
                level = "Novice Reader"
                if new_pts >= 50: level = "Bookworm"
                if new_pts >= 150: level = "Avid Reader"
                if new_pts >= 300: level = "Bibliophile"
                if new_pts >= 500: level = "Literary Scholar"
                supabase.table('userrewards').update({'points': new_pts, 'level': level}).eq('user_id', session['user_id']).execute()
        except Exception as rew_e:
            pass # ignore reward error for now
        
        return jsonify({"success": "Book borrowed successfully! You earned 10 points."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@book_bp.route('/api/return', methods=['POST'])
def return_book():
    """API endpoint to return a borrowed book"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    borrow_id = data.get('borrow_id')
    
    if not borrow_id:
        return jsonify({"error": "Borrow ID is required"}), 400
        
    try:
        supabase = get_supabase()
        supabase.table('borrowedbooks').delete().eq('id', borrow_id).eq('user_id', session['user_id']).execute()
        return jsonify({"success": "Book returned successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@book_bp.route('/api/wishlist/add', methods=['POST'])
def add_wishlist():
    """API endpoint to save a book to wishlist"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    try:
        supabase = get_supabase()
        existing = supabase.table('wishlist').select('*').eq('user_id', session['user_id']).eq('google_books_id', data.get('id')).execute()
        if existing.data and len(existing.data) > 0:
            return jsonify({"error": "Book is already in your wishlist"}), 400
            
        supabase.table('wishlist').insert({
            'user_id': session['user_id'],
            'book_title': data.get('title'),
            'book_author': data.get('author'),
            'google_books_id': data.get('id'),
            'preview_link': data.get('preview_link', '#')
        }).execute()
        return jsonify({"success": "Added to wishlist"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@book_bp.route('/api/wishlist/remove', methods=['POST'])
def remove_wishlist():
    """API endpoint to remove from wishlist"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    try:
        supabase = get_supabase()
        supabase.table('wishlist').delete().eq('id', data.get('wish_id')).eq('user_id', session['user_id']).execute()
        return jsonify({"success": "Removed from wishlist"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

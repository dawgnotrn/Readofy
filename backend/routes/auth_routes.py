from flask import Blueprint, render_template, request, session, redirect, url_for, flash
import sys
import os
from werkzeug.security import generate_password_hash, check_password_hash

# Add the project root to path for absolute imports if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.supabase_config import get_supabase

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Handles user login"""
    if 'user_id' in session:
        return redirect(url_for('book.dashboard'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        try:
            supabase = get_supabase()
            user_response = supabase.table('users').select('*').eq('email', email).execute()
            
            if user_response.data and len(user_response.data) > 0:
                user = user_response.data[0]
                # Check password hash
                if check_password_hash(user['password'], password):
                    session['user_id'] = user['id']
                    session['user_name'] = user['name']
                    return redirect(url_for('book.dashboard'))
                else:
                    flash("Invalid email or password", "error")
            else:
                flash("Invalid email or password", "error")
        except Exception as e:
            flash(f"Error during login: {e}", "error")
            
    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Handles user registration"""
    if 'user_id' in session:
        return redirect(url_for('book.dashboard'))
        
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        try:
            supabase = get_supabase()
            # Check if email exists
            existing = supabase.table('users').select('id').eq('email', email).execute()
            if existing.data and len(existing.data) > 0:
                flash("Email already registered", "error")
                return render_template('register.html')
            
            # Hash password
            hashed_password = generate_password_hash(password)
            
            # Insert user
            supabase.table('users').insert({
                'name': name,
                'email': email,
                'password': hashed_password
            }).execute()
            
            flash("Registration successful. Please log in.", "success")
            return redirect(url_for('auth.login'))
        except Exception as e:
            flash(f"Error during registration: {e}", "error")
            
    return render_template('register.html')

@auth_bp.route('/logout')
def logout():
    """Logs the user out"""
    session.clear()
    return redirect(url_for('auth.login'))

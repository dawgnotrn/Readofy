from flask import Flask, redirect, url_for
from dotenv import load_dotenv
import os

from routes.auth_routes import auth_bp
from routes.book_routes import book_bp
from routes.chatbot_routes import chatbot_bp
from routes.club_routes import club_bp
from routes.reward_routes import reward_bp

# Load environment variables
load_dotenv()

# Initialize Flask app
# Specifying the exact templates and static folders based on the project structure requested
app = Flask(
    __name__, 
    template_folder='../frontend/templates',
    static_folder='../frontend/static'
)

# Set the secret key for session management
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "default_dev_key")

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(book_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(club_bp)
app.register_blueprint(reward_bp)

@app.route("/")
def index():
    """Route to root, redirect to login page as per project requirements."""
    return redirect(url_for('auth.login'))

if __name__ == "__main__":
    app.run(debug=True)

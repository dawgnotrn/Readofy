import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

def ask_chatbot(question):
    """
    Sends a book-related question to the OpenRouter API and returns a short, simple response.
    """
    if not OPENROUTER_API_KEY:
        return "Chatbot is currently disabled (API key not configured)."
        
    if not question:
        return "Please ask a question."
        
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "Readofy Library System",
            },
            json={
                "model": "openai/gpt-4o-mini", # Using the connected OpenAI provider config
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful and friendly library assistant for \"Readofy\". Keep your response short, simple, and limited to 2-3 sentences. Answer questions about books or reading."
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ]
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content']
        else:
            return f"OpenRouter Error {response.status_code}: {response.text}"
            
    except Exception as e:
        return f"An error occurred connecting to the chatbot: {str(e)}"

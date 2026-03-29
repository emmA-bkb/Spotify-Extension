import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configurações da aplicação"""
    
    # Spotify OAuth
    SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
    SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
    # URLs de redirect aceitas (local e Render)
    SPOTIFY_REDIRECT_URIS = [
        'http://127.0.0.1:5000/auth/spotify/callback',
        'https://spotify-extencao.onrender.com/auth/spotify/callback'
    ]
    SPOTIFY_REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI', 'http://127.0.0.1:5000/auth/spotify/callback')
    SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
    SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
    SPOTIFY_API_URL = 'https://api.spotify.com/v1'
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.getenv('FLASK_DEBUG', True)
    
    # CORS - Aceita extensões Firefox
    CORS_ORIGINS = ['*']

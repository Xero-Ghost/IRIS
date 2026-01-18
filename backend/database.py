from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration - supports multiple formats for flexibility
# Priority: DATABASE_URL (Render) > Individual DB_* vars > SQLite fallback

def get_database_url():
    """
    Get database URL with support for:
    1. DATABASE_URL environment variable (Render, Heroku)
    2. Individual DB_* environment variables (local PostgreSQL)
    3. SQLite fallback for development
    """
    # Check for DATABASE_URL first (used by Render, Heroku, etc.)
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        # Render uses postgres:// but SQLAlchemy requires postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return database_url
    
    # Check for individual PostgreSQL configuration
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "iris_db")
    
    if db_user and db_password:
        return f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"
    
    # Fallback to SQLite for development without PostgreSQL
    print("Warning: No PostgreSQL configuration found, using SQLite fallback")
    return "sqlite:///./iris_dev.db"

SQLALCHEMY_DATABASE_URL = get_database_url()

# Create engine with appropriate settings
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}  # Required for SQLite
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Verify connection on startup
try:
    with engine.connect() as connection:
        pass
    db_type = "SQLite" if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else "PostgreSQL"
    print(f"Connected to {db_type} database successfully")
except Exception as e:
    print(f"Warning: Database connection failed: {e}")
    print("The application will attempt to reconnect when needed.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    if SessionLocal is None:
        print("get_db Error: SessionLocal is None")
        raise Exception("Database not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


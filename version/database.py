from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use default credentials if not found in env
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "iris_db")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

# Fallback to sqlite if postgres is tricky to set up immediately, but goal is postgres
# SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    # Attempt to connect to verify Postgres availability
    with engine.connect() as connection:
        pass
    print(f"Connected to PostgreSQL database: {DB_NAME}")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"Warning: PostgreSQL connection failed ({e}). Falling back to SQLite.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    if SessionLocal is None:
        print("get_db Error: SessionLocal is None")
        raise Exception("Database not configured")
    db = SessionLocal()
    try:
        print("get_db: Session created")
        yield db
    finally:
        print("get_db: Session closed")
        db.close()

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL configuration
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "iris_db")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Verify connection on startup
try:
    with engine.connect() as connection:
        pass
    print(f"Connected to PostgreSQL database: {DB_NAME}")
except Exception as e:
    raise RuntimeError(f"Failed to connect to PostgreSQL database: {e}")

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

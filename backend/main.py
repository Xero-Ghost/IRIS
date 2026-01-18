from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import traffic_cycle
from sqlalchemy.orm import Session
from database import SessionLocal, engine, get_db
import models
from passlib.context import CryptContext
from decimal import Decimal
from datetime import datetime

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="IRIS Backend", description="Backend for Intelligent Roadway Infrastructure System")

# Mount static files for accident evidence images
evidence_dir = os.path.join(os.path.dirname(__file__), "accident_evidence")
if not os.path.exists(evidence_dir):
    os.makedirs(evidence_dir)
app.mount("/evidence", StaticFiles(directory=evidence_dir), name="evidence")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# CORS Middleware - Configure allowed origins
# In production, set ALLOWED_ORIGINS environment variable with comma-separated domains
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins == "*":
    origins = ["*"]
else:
    origins = [origin.strip() for origin in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    username: Optional[str] = None
    role: str

class TrafficCounts(BaseModel):
    two_wheelers: int
    light_motor_vehicles: int
    heavy_motor_vehicles: int

class PhaseData(BaseModel):
    phase: int
    counts: TrafficCounts

class ScheduleItem(BaseModel):
    traffic_light_no: int
    G: float
    Y: float
    R: float
    percentage_clearance: float

# --- Endpoints ---

@app.on_event("startup")
def startup_event():
    # Seed initial admin user if not exists
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if not user:
            print("Seeding initial admin user...")
            hashed_password = get_password_hash("admin123")
            db_user = models.User(username="admin", hashed_password=hashed_password, role="admin")
            db.add(db_user)
            db.commit()
            print("Admin user created.")
    except Exception as e:
        print(f"Database unavailable or error seeding: {e}")
    finally:
        db.close()

@app.post("/token", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        print(f"Login attempt for: {request.username}")
        # Authenticate against DB
        user = db.query(models.User).filter(models.User.username == request.username).first()
        print(f"User query result: {user}")
        
        if not user:
             print("User not found")
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        print(f"Verifying password for user {user.username}")
        # print(f"Stored hash: {user.hashed_password}") # Careful printing this, but safe for dev
        
        if not verify_password(request.password, user.hashed_password):
             print("Password verification failed")
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        print("Password verified")
        
        # Enforce role check if needed, or just return the user's role
        if request.role == 'admin':
             return Token(access_token="fake-jwt-token-admin", token_type="bearer", username=user.username, role="admin")
        
        # Public access might not require DB check or uses a shared account 'public'
        return Token(access_token="fake-jwt-token-public", token_type="bearer", role="public")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"LOGIN ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/traffic-data", response_model=List[PhaseData])
async def get_traffic_data():
    """
    Reads the latest vehicle counts from vehicle_data.txt
    """
    data_file = "vehicle_data.txt"
    if not os.path.exists(data_file):
        raise HTTPException(status_code=404, detail="Traffic data not available yet. Please run the simulation.")
    
    phases = []
    try:
        with open(data_file, 'r') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                 parts = line.strip().split(',')
                 if len(parts) >= 3:
                     phases.append(PhaseData(
                         phase=i + 1,
                         counts=TrafficCounts(
                             two_wheelers=int(parts[0]),
                             light_motor_vehicles=int(parts[1]),
                             heavy_motor_vehicles=int(parts[2])
                         )
                     ))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading traffic data: {str(e)}")
        
    return phases

@app.get("/schedule", response_model=List[ScheduleItem])
async def get_schedule(junction_id: str = "J-001"):
    """
    Calculates and returns the traffic light schedule based on latest database data.
    
    Args:
        junction_id: Junction ID to calculate schedule for (default: J-001)
    """
    try:
        schedule = traffic_cycle.calculate_schedule(junction_id=junction_id)
        return schedule
    except ValueError as e:
         raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating schedule: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# ===== NEW COMPREHENSIVE ENDPOINTS =====

# Import schemas
from schemas import (
    JunctionResponse, JunctionCreate,
    CameraResponse, CameraCreate,
    AlertResponse, AlertCreate,
    SignalTimingResponse, SignalTimingCreate,
    TrafficDataResponse, TrafficDataCreate,
    SystemStatsResponse,
    AccidentResponse, AccidentCreate
)

# Junction Endpoints
@app.get("/junctions", response_model=List[JunctionResponse])
async def get_junctions(db: Session = Depends(get_db)):
    """Get all junctions"""
    junctions = db.query(models.Junction).all()
    return junctions

@app.get("/junctions/{junction_id}", response_model=JunctionResponse)
async def get_junction(junction_id: str, db: Session = Depends(get_db)):
    """Get a specific junction by ID"""
    junction = db.query(models.Junction).filter(models.Junction.id == junction_id).first()
    if not junction:
        raise HTTPException(status_code=404, detail="Junction not found")
    return junction

@app.post("/junctions", response_model=JunctionResponse)
async def create_junction(junction: JunctionCreate, db: Session = Depends(get_db)):
    """Create a new junction"""
    db_junction = models.Junction(**junction.dict())
    db.add(db_junction)
    db.commit()
    db.refresh(db_junction)
    return db_junction

@app.put("/junctions/{junction_id}", response_model=JunctionResponse)
async def update_junction(junction_id: str, junction: JunctionCreate, db: Session = Depends(get_db)):
    """Update a junction"""
    db_junction = db.query(models.Junction).filter(models.Junction.id == junction_id).first()
    if not db_junction:
        raise HTTPException(status_code=404, detail="Junction not found")
    
    for key, value in junction.dict(exclude={'id'}).items():
        setattr(db_junction, key, value)
    
    db.commit()
    db.refresh(db_junction)
    return db_junction

@app.delete("/junctions/{junction_id}")
async def delete_junction(junction_id: str, db: Session = Depends(get_db)):
    """Delete a junction"""
    db_junction = db.query(models.Junction).filter(models.Junction.id == junction_id).first()
    if not db_junction:
        raise HTTPException(status_code=404, detail="Junction not found")
    
    db.delete(db_junction)
    db.commit()
    return {"message": "Junction deleted successfully"}


# Camera Endpoints
@app.get("/cameras", response_model=List[CameraResponse])
async def get_cameras(junction_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all cameras, optionally filtered by junction"""
    query = db.query(models.Camera)
    if junction_id:
        query = query.filter(models.Camera.junction_id == junction_id)
    return query.all()

@app.get("/cameras/{camera_id}", response_model=CameraResponse)
async def get_camera(camera_id: str, db: Session = Depends(get_db)):
    """Get a specific camera"""
    camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


# Alert Endpoints
@app.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(status: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)):
    """Get alerts, optionally filtered by status"""
    query = db.query(models.Alert).order_by(models.Alert.created_at.desc())
    if status:
        query = query.filter(models.Alert.status == status)
    return query.limit(limit).all()

@app.post("/alerts", response_model=AlertResponse)
async def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    """Create a new alert"""
    db_alert = models.Alert(**alert.dict())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@app.patch("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as resolved"""
    from datetime import datetime
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = 'resolved'
    alert.resolved_at = datetime.now()
    db.commit()
    return {"message": "Alert resolved"}


# Signal Timing Endpoints
@app.get("/signal-timings/{junction_id}", response_model=List[SignalTimingResponse])
async def get_signal_timings(junction_id: str, db: Session = Depends(get_db)):
    """Get signal timings for a junction"""
    timings = db.query(models.SignalTiming).filter(
        models.SignalTiming.junction_id == junction_id,
        models.SignalTiming.is_default == True
    ).all()
    return timings

@app.post("/signal-timings", response_model=SignalTimingResponse)
async def create_signal_timing(timing: SignalTimingCreate, db: Session = Depends(get_db)):
    """Create or update signal timing"""
    db_timing = models.SignalTiming(**timing.dict())
    db.add(db_timing)
    db.commit()
    db.refresh(db_timing)
    return db_timing


# Traffic Data Endpoints
@app.post("/traffic-data-record", response_model=TrafficDataResponse)
async def record_traffic_data(data: TrafficDataCreate, db: Session = Depends(get_db)):
    """Record new traffic data"""
    db_data = models.TrafficData(**data.dict())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

@app.get("/traffic-data-history/{junction_id}")
async def get_traffic_history(
    junction_id: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get historical traffic data for a junction"""
    data = db.query(models.TrafficData).filter(
        models.TrafficData.junction_id == junction_id
    ).order_by(models.TrafficData.timestamp.desc()).limit(limit).all()
    return data


# System Stats Endpoint
@app.get("/system-stats", response_model=SystemStatsResponse)
async def get_system_stats(db: Session = Depends(get_db)):
    """Get current system statistics"""
    stats = db.query(models.SystemStats).first()
    if not stats:
        # Create default stats if none exist
        stats = models.SystemStats(
            active_signals=0,
            avg_wait_time=0,
            co2_saved_today=0,
            incidents_today=0
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats


# ===== ACCIDENT DETECTION ENDPOINTS =====
# Note: Accident detection is handled by the standalone detect_accident.py script
# which processes video feeds and saves results to the database automatically.

@app.get("/accidents", response_model=List[AccidentResponse])
async def get_accidents(
    junction_id: Optional[str] = None,
    camera_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get accident records with optional filters
    
    Args:
        junction_id: Filter by junction ID
        camera_id: Filter by camera ID
        status: Filter by status ('active', 'resolved', 'false_positive')
        severity: Filter by severity ('low', 'medium', 'high', 'critical')
        limit: Maximum number of records to return (default: 50)
        db: Database session
    
    Returns:
        List of accident records
    """
    query = db.query(models.Accident).order_by(models.Accident.detected_at.desc())
    
    if junction_id:
        query = query.filter(models.Accident.junction_id == junction_id)
    if camera_id:
        query = query.filter(models.Accident.camera_id == camera_id)
    if status:
        query = query.filter(models.Accident.status == status)
    if severity:
        query = query.filter(models.Accident.severity == severity)
    
    accidents = query.limit(limit).all()
    # Convert to response with image URLs
    return [AccidentResponse.from_orm_with_image_url(acc) for acc in accidents]


@app.get("/accidents/{accident_id}", response_model=AccidentResponse)
async def get_accident(accident_id: int, db: Session = Depends(get_db)):
    """
    Get a specific accident record by ID
    
    Args:
        accident_id: Accident ID
        db: Database session
    
    Returns:
        Accident record details
    """
    accident = db.query(models.Accident).filter(models.Accident.id == accident_id).first()
    if not accident:
        raise HTTPException(status_code=404, detail="Accident not found")
    return AccidentResponse.from_orm_with_image_url(accident)


@app.patch("/accidents/{accident_id}/resolve")
async def resolve_accident(
    accident_id: int,
    resolved_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Mark an accident as resolved
    
    Args:
        accident_id: Accident ID to resolve
        resolved_by: Username of person resolving (optional)
        db: Database session
    
    Returns:
        Success message
    """
    accident = db.query(models.Accident).filter(models.Accident.id == accident_id).first()
    if not accident:
        raise HTTPException(status_code=404, detail="Accident not found")
    
    accident.status = 'resolved'
    accident.resolved_at = datetime.now()
    accident.resolved_by = resolved_by
    db.commit()
    
    return {"message": "Accident marked as resolved", "accident_id": accident_id}

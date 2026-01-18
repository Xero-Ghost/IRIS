"""
Additional Pydantic models and API endpoints for comprehensive schema
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal

# ===== Pydantic Models =====

class JunctionBase(BaseModel):
    name: str
    location: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    phases: int = 4
    status: str = 'active'
    mode: str = 'adaptive'
    
    # Nearest Hospital
    nearest_hospital_name: Optional[str] = None
    nearest_hospital_distance: Optional[Decimal] = None  # km
    nearest_hospital_eta: Optional[int] = None  # minutes
    nearest_hospital_latitude: Optional[Decimal] = None
    nearest_hospital_longitude: Optional[Decimal] = None
    
    # Nearest Police Station
    nearest_police_name: Optional[str] = None
    nearest_police_distance: Optional[Decimal] = None  # km
    nearest_police_eta: Optional[int] = None  # minutes
    nearest_police_latitude: Optional[Decimal] = None
    nearest_police_longitude: Optional[Decimal] = None

class JunctionCreate(JunctionBase):
    id: str

class JunctionResponse(JunctionBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CameraBase(BaseModel):
    junction_id: str
    phase: int
    status: str = 'online'
    stream_url: Optional[str] = None

class CameraCreate(CameraBase):
    id: str

class CameraResponse(CameraBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SignalTimingBase(BaseModel):
    junction_id: str
    phase: int
    green_time: int
    yellow_time: int = 3
    red_time: int
    is_default: bool = True

class SignalTimingCreate(SignalTimingBase):
    pass

class SignalTimingResponse(SignalTimingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Signal Phase schemas (handles lanes per phase and default timer)
class SignalPhaseBase(BaseModel):
    junction_id: str
    phase_number: int
    lane_count: int
    default_timer_sec: int = 30

class SignalPhaseCreate(SignalPhaseBase):
    pass

class SignalPhaseResponse(SignalPhaseBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Signal Adjacency schemas (handles adjacent traffic signals)
class SignalAdjacencyBase(BaseModel):
    from_junction_id: str
    to_junction_id: str
    direction: Optional[str] = None

class SignalAdjacencyCreate(SignalAdjacencyBase):
    pass

class SignalAdjacencyResponse(SignalAdjacencyBase):
    created_at: datetime

    class Config:
        from_attributes = True


class AlertBase(BaseModel):
    junction_id: Optional[str] = None
    type: str
    severity: str = 'info'
    message: str
    status: str = 'active'

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TrafficDataCreate(BaseModel):
    junction_id: str
    phase: int
    two_wheelers: int = 0
    light_vehicles: int = 0
    heavy_vehicles: int = 0
    total_count: int = 0
    avg_wait_time: Optional[Decimal] = None

class TrafficDataResponse(TrafficDataCreate):
    id: int
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class SystemStatsResponse(BaseModel):
    active_signals: int
    avg_wait_time: Optional[Decimal]
    co2_saved_today: Decimal
    incidents_today: int
    last_updated: datetime

    class Config:
        from_attributes = True


# ===== Accident Detection Schemas =====

class AccidentBase(BaseModel):
    junction_id: Optional[str] = None
    camera_id: Optional[str] = None
    confidence_score: Decimal
    severity: str = 'medium'  # 'low', 'medium', 'high', 'critical'
    description: Optional[str] = None
    image_path: Optional[str] = None
    video_path: Optional[str] = None
    bounding_boxes: Optional[str] = None  # JSON string
    detection_metadata: Optional[str] = None  # JSON string
    status: str = 'active'

class AccidentCreate(AccidentBase):
    pass

class AccidentResponse(AccidentBase):
    id: int
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    detected_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    evidence_image_path: Optional[str] = None  # URL path to evidence image

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_image_url(cls, obj):
        """Convert ORM object to response with image URL"""
        import os
        data = {
            "id": obj.id,
            "junction_id": obj.junction_id,
            "camera_id": obj.camera_id,
            "confidence_score": obj.confidence_score,
            "severity": obj.severity,
            "description": obj.description,
            "image_path": obj.image_path,
            "video_path": obj.video_path,
            "bounding_boxes": obj.bounding_boxes,
            "detection_metadata": obj.detection_metadata,
            "status": obj.status,
            "resolved_at": obj.resolved_at,
            "resolved_by": obj.resolved_by,
            "detected_at": obj.detected_at,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "evidence_image_path": None
        }
        # Convert absolute image_path to URL path
        if obj.image_path:
            filename = os.path.basename(obj.image_path)
            data["evidence_image_path"] = f"/evidence/{filename}"
        return cls(**data)


class BoundingBox(BaseModel):
    """Bounding box coordinates for detected objects"""
    x: float
    y: float
    width: float
    height: float
    class_name: str
    confidence: float


class AccidentDetectionResult(BaseModel):
    """Results from Roboflow accident detection"""
    accident_detected: bool
    confidence: float
    predictions: List[BoundingBox]
    image_dimensions: Optional[dict] = None
    model_version: str


# ===== Vehicle Classification Schemas =====

class VehicleClassificationBase(BaseModel):
    junction_id: str
    phase: int
    motorcycles: int = 0
    lmv: int = 0
    hmv: int = 0
    total_count: int = 0
    video_source: Optional[str] = None
    roi_coordinates: Optional[str] = None  # JSON string

class VehicleClassificationCreate(VehicleClassificationBase):
    pass

class VehicleClassificationUpdate(BaseModel):
    motorcycles: Optional[int] = None
    lmv: Optional[int] = None
    hmv: Optional[int] = None
    total_count: Optional[int] = None

class VehicleClassificationResponse(VehicleClassificationBase):
    id: int
    started_at: datetime
    last_updated: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, DateTime, Date, Text, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="public")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Junction(Base):
    __tablename__ = "junctions"

    id = Column(String, primary_key=True, index=True)  # e.g., 'J-001'
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    latitude = Column(DECIMAL(10, 8), nullable=True)
    longitude = Column(DECIMAL(11, 8), nullable=True)
    phases = Column(Integer, nullable=False, default=4)  # Number of traffic phases
    status = Column(String, default='active')  # 'active', 'maintenance', 'offline'
    mode = Column(String, default='adaptive')  # 'adaptive', 'default', 'manual'
    
    # Nearest Hospital Information
    nearest_hospital_name = Column(String, nullable=True)
    nearest_hospital_distance = Column(DECIMAL(5, 2), nullable=True)  # Distance in km
    nearest_hospital_eta = Column(Integer, nullable=True)  # Estimated arrival time in minutes
    nearest_hospital_latitude = Column(DECIMAL(10, 8), nullable=True)
    nearest_hospital_longitude = Column(DECIMAL(11, 8), nullable=True)
    
    # Nearest Police Station Information
    nearest_police_name = Column(String, nullable=True)
    nearest_police_distance = Column(DECIMAL(5, 2), nullable=True)  # Distance in km
    nearest_police_eta = Column(Integer, nullable=True)  # Estimated arrival time in minutes
    nearest_police_latitude = Column(DECIMAL(10, 8), nullable=True)
    nearest_police_longitude = Column(DECIMAL(11, 8), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    cameras = relationship("Camera", back_populates="junction", cascade="all, delete-orphan")
    signal_timings = relationship("SignalTiming", back_populates="junction", cascade="all, delete-orphan")
    signal_phases = relationship("SignalPhase", back_populates="junction", cascade="all, delete-orphan")
    traffic_data = relationship("TrafficData", back_populates="junction", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="junction")
    accidents = relationship("Accident", back_populates="junction")
    adjacent_to = relationship("SignalAdjacency", foreign_keys="[SignalAdjacency.from_junction_id]", back_populates="from_junction", cascade="all, delete-orphan")
    adjacent_from = relationship("SignalAdjacency", foreign_keys="[SignalAdjacency.to_junction_id]", back_populates="to_junction", cascade="all, delete-orphan")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, index=True)  # e.g., 'CAM-001'
    junction_id = Column(String, ForeignKey('junctions.id', ondelete='CASCADE'), nullable=False)
    phase = Column(Integer, nullable=False)  # Which phase this camera monitors (1-4)
    status = Column(String, default='online')  # 'online', 'offline', 'maintenance'
    stream_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    junction = relationship("Junction", back_populates="cameras")
    accidents = relationship("Accident", back_populates="camera")


class SignalTiming(Base):
    __tablename__ = "signal_timings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    junction_id = Column(String, ForeignKey('junctions.id', ondelete='CASCADE'), nullable=False)
    phase = Column(Integer, nullable=False)  # Phase number (1-4)
    green_time = Column(Integer, nullable=False)  # Green light duration (seconds)
    yellow_time = Column(Integer, nullable=False, default=3)  # Yellow light duration
    red_time = Column(Integer, nullable=False)  # Red light duration (seconds)
    is_default = Column(Boolean, default=True)  # Whether this is the default timing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    junction = relationship("Junction", back_populates="signal_timings")


class SignalPhase(Base):
    """Handles lanes per phase and default timer for traffic signals"""
    __tablename__ = "signal_phases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    junction_id = Column(String, ForeignKey('junctions.id', ondelete='CASCADE'), nullable=False)
    phase_number = Column(Integer, nullable=False)  # e.g., Phase 1, Phase 2
    lane_count = Column(Integer, nullable=False)  # Number of lanes that allow movement in this phase
    default_timer_sec = Column(Integer, default=30)  # Default green time in seconds
    
    # ROI coordinates for vehicle detection
    roi_x1 = Column(Integer, nullable=True)  # Top-left X coordinate
    roi_y1 = Column(Integer, nullable=True)  # Top-left Y coordinate
    roi_x2 = Column(Integer, nullable=True)  # Bottom-right X coordinate
    roi_y2 = Column(Integer, nullable=True)  # Bottom-right Y coordinate
    
    # Video source (file path or stream URL)
    video_source = Column(String, nullable=True)  # Path to video file or camera stream URL
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    junction = relationship("Junction", back_populates="signal_phases")


class SignalAdjacency(Base):
    """Handles adjacency between traffic signals/junctions"""
    __tablename__ = "signal_adjacency"

    from_junction_id = Column(String, ForeignKey('junctions.id', ondelete='CASCADE'), primary_key=True)
    to_junction_id = Column(String, ForeignKey('junctions.id', ondelete='CASCADE'), primary_key=True)
    direction = Column(String(20), nullable=True)  # e.g., 'North', 'South', 'East', 'West'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    from_junction = relationship("Junction", foreign_keys=[from_junction_id], back_populates="adjacent_to")
    to_junction = relationship("Junction", foreign_keys=[to_junction_id], back_populates="adjacent_from")


class TrafficData(Base):
    __tablename__ = "traffic_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    junction_id = Column(String, ForeignKey('junctions.id', ondelete='CASCADE'), nullable=False)
    phase = Column(Integer, nullable=False)  # Phase number
    two_wheelers = Column(Integer, default=0)
    light_vehicles = Column(Integer, default=0)
    heavy_vehicles = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    avg_wait_time = Column(DECIMAL(5, 2), nullable=True)  # Average wait time in seconds
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    junction = relationship("Junction", back_populates="traffic_data")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    junction_id = Column(String, ForeignKey('junctions.id', ondelete='SET NULL'), nullable=True)
    type = Column(String, nullable=False)  # 'violation', 'incident', 'maintenance', 'system'
    severity = Column(String, default='info')  # 'info', 'warning', 'danger'
    message = Column(Text, nullable=False)
    status = Column(String, default='active')  # 'active', 'resolved', 'dismissed'
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    junction = relationship("Junction", back_populates="alerts")


class AnalyticsSummary(Base):
    __tablename__ = "analytics_summary"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    junction_id = Column(String, ForeignKey('junctions.id', ondelete='CASCADE'), nullable=True)
    date = Column(Date, nullable=False, index=True)
    hour = Column(Integer, nullable=True)  # Hour of day (0-23) for hourly summaries, NULL for daily
    total_vehicles = Column(Integer, default=0)
    avg_wait_time = Column(DECIMAL(5, 2), nullable=True)
    co2_saved = Column(DECIMAL(10, 2), default=0)  # CO2 saved in kg
    incidents_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SystemStats(Base):
    __tablename__ = "system_stats"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    active_signals = Column(Integer, default=0)
    avg_wait_time = Column(DECIMAL(5, 2), nullable=True)
    co2_saved_today = Column(DECIMAL(10, 2), default=0)  # in tons
    incidents_today = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Accident(Base):
    """Stores accident detection records from Roboflow model"""
    __tablename__ = "accidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    junction_id = Column(String, ForeignKey('junctions.id', ondelete='SET NULL'), nullable=True, index=True)
    camera_id = Column(String, ForeignKey('cameras.id', ondelete='SET NULL'), nullable=True, index=True)
    
    # Detection metadata
    confidence_score = Column(DECIMAL(5, 4), nullable=False)  # 0.0000 to 1.0000
    severity = Column(String, default='medium')  # 'low', 'medium', 'high', 'critical'
    description = Column(Text, nullable=True)
    
    # Media paths
    image_path = Column(String, nullable=True)  # Path to saved image
    video_path = Column(String, nullable=True)  # Path to saved video clip
    
    # Detection results (stored as JSON string)
    bounding_boxes = Column(Text, nullable=True)  # JSON array of bounding box coordinates
    detection_metadata = Column(Text, nullable=True)  # Additional detection data from Roboflow
    
    # Status tracking
    status = Column(String, default='active', index=True)  # 'active', 'resolved', 'false_positive'
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String, nullable=True)  # User who resolved it
    
    # Timestamps
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    junction = relationship("Junction", back_populates="accidents")
    camera = relationship("Camera", back_populates="accidents")


class VehicleClassification(Base):
    """Stores cumulative vehicle classification counts from video analysis"""
    __tablename__ = "vehicle_classification"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    junction_id = Column(String, ForeignKey('junctions.id', ondelete='CASCADE'), nullable=False, index=True)
    phase = Column(Integer, nullable=False)
    
    # Cumulative counts (never decrease)
    motorcycles = Column(Integer, default=0)
    lmv = Column(Integer, default=0)  # Light Motor Vehicles
    hmv = Column(Integer, default=0)  # Heavy Motor Vehicles
    total_count = Column(Integer, default=0)
    
    # Video and ROI metadata
    video_source = Column(String, nullable=True)
    roi_coordinates = Column(String, nullable=True)  # JSON string: [x1, y1, x2, y2]
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

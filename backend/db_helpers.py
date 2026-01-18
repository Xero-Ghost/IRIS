"""
Database helper functions for vehicle detection script
"""
from database import SessionLocal
from models import SignalPhase, TrafficData
from sqlalchemy import func
import logging

logger = logging.getLogger(__name__)

def get_phase_config(junction_id: str, phase_number: int):
    """
    Fetch ROI coordinates and video source for a specific junction phase
    
    Args:
        junction_id: Junction ID (e.g., 'J-001')
        phase_number: Phase number (e.g., 1, 2, 3, 4)
    
    Returns:
        dict with keys: roi_coordinates (tuple), video_source (str)
        Returns None if not found
    """
    db = SessionLocal()
    try:
        phase = db.query(SignalPhase).filter(
            SignalPhase.junction_id == junction_id,
            SignalPhase.phase_number == phase_number
        ).first()
        
        if not phase:
            logger.error(f"No phase found for junction {junction_id}, phase {phase_number}")
            return None
        
        # Validate ROI coordinates exist
        if None in [phase.roi_x1, phase.roi_y1, phase.roi_x2, phase.roi_y2]:
            logger.error(f"ROI coordinates not set for junction {junction_id}, phase {phase_number}")
            return None
        
        # Validate video source exists
        if not phase.video_source:
            logger.error(f"Video source not set for junction {junction_id}, phase {phase_number}")
            return None
        
        return {
            'roi_coordinates': (phase.roi_x1, phase.roi_y1, phase.roi_x2, phase.roi_y2),
            'video_source': phase.video_source,
            'lane_count': phase.lane_count,
            'default_timer_sec': phase.default_timer_sec
        }
    
    except Exception as e:
        logger.error(f"Database error fetching phase config: {e}")
        return None
    finally:
        db.close()


def save_traffic_count(junction_id: str, phase_number: int, 
                       two_wheelers: int, light_vehicles: int, heavy_vehicles: int):
    """
    Save vehicle count data to traffic_data table
    
    Args:
        junction_id: Junction ID (e.g., 'J-001')
        phase_number: Phase number (e.g., 1, 2, 3, 4)
        two_wheelers: Count of two-wheelers
        light_vehicles: Count of light motor vehicles
        heavy_vehicles: Count of heavy motor vehicles
    
    Returns:
        bool: True if successful, False otherwise
    """
    db = SessionLocal()
    try:
        total_count = two_wheelers + light_vehicles + heavy_vehicles
        
        traffic_entry = TrafficData(
            junction_id=junction_id,
            phase=phase_number,
            two_wheelers=two_wheelers,
            light_vehicles=light_vehicles,
            heavy_vehicles=heavy_vehicles,
            total_count=total_count,
            avg_wait_time=None  # Can be calculated separately if needed
        )
        
        db.add(traffic_entry)
        db.commit()
        db.refresh(traffic_entry)
        
        logger.info(f"✓ Saved traffic data: Junction={junction_id}, Phase={phase_number}, "
                   f"Total={total_count} (2W={two_wheelers}, LV={light_vehicles}, HV={heavy_vehicles})")
        return True
    
    except Exception as e:
        db.rollback()
        logger.error(f"✗ Database error saving traffic count: {e}")
        return False
    finally:
        db.close()

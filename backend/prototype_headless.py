# prototype_headless.py - Headless vehicle detection for multi-junction traffic system
import cv2
import logging
import time
import argparse
import sys

# Import the custom classes and config
from vehicle_detector import VehicleDetector
from vehicle_tracker import VehicleTracker
from config import Config
from db_helpers import get_phase_config, save_traffic_count

# Configure logging
logging.basicConfig(level=Config.LOG_LEVEL, format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.FileHandler(Config.LOG_FILE), logging.StreamHandler()])
logger = logging.getLogger(__name__)

def parse_arguments():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(description='Headless vehicle detection for traffic monitoring')
    parser.add_argument('--junction_id', type=str, required=True, 
                        help='Junction ID (e.g., J-001)')
    parser.add_argument('--phase_number', type=int, required=True, 
                        help='Phase number (e.g., 1, 2, 3, 4)')
    return parser.parse_args()

def main():
    """
    Main function to run headless vehicle detection, tracking, and counting.
    """
    # Parse command-line arguments
    args = parse_arguments()
    junction_id = args.junction_id
    phase_number = args.phase_number
    
    logger.info(f"Starting headless vehicle detection for Junction={junction_id}, Phase={phase_number}")
    
    # Load configuration from database
    config = get_phase_config(junction_id, phase_number)
    if not config:
        logger.error(f"Failed to load configuration for Junction={junction_id}, Phase={phase_number}")
        logger.error("Please ensure ROI coordinates and video source are set in the database.")
        sys.exit(1)
    
    roi_coordinates = config['roi_coordinates']
    video_source = config['video_source']
    
    logger.info(f"Loaded configuration from database:")
    logger.info(f"  - ROI coordinates: {roi_coordinates}")
    logger.info(f"  - Video source: {video_source}")
    logger.info(f"  - Lane count: {config['lane_count']}")
    logger.info(f"  - Default timer: {config['default_timer_sec']}s")
    
    # Initialize VehicleDetector
    detector = VehicleDetector(model_path=Config.DEFAULT_MODEL)
    logger.info(f"Detector initialized using model: {detector.model_path}")
    
    # Set ROI from database
    roi_x1, roi_y1, roi_x2, roi_y2 = roi_coordinates
    detector.set_roi(roi_coordinates, enabled=True)
    logger.info(f"ROI set for detection: {roi_coordinates}")
    
    # Open video
    video = cv2.VideoCapture(video_source)
    
    if not video.isOpened():
        logger.error(f"Error: Could not open video source: {video_source}")
        sys.exit(1)
    
    # Initialize VehicleTracker
    tracker = VehicleTracker(max_track_age=Config.MAX_TRACK_AGE, min_hits=Config.MIN_HITS)
    
    logger.info("Starting headless video processing...")
    
    # For FPS calculation
    frame_count = 0
    start_time = time.time()
    
    # Initialize final counts
    final_two_wheeler_count = 0
    final_light_motor_count = 0
    final_heavy_motor_count = 0
    
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    logger.info(f"Total frames to process: {total_frames}")
    
    processed_frames = 0
    log_interval = max(1, total_frames // 10)  # Log progress every 10%
    
    while True:
        ret, frame = video.read()
        if not ret:
            logger.info("End of video stream.")
            break
        
        processed_frames += 1
        
        # Log progress periodically
        if processed_frames % log_interval == 0:
            progress = (processed_frames / total_frames) * 100
            logger.info(f"Progress: {progress:.1f}% ({processed_frames}/{total_frames} frames)")
        
        # 1. Detect Vehicles
        detections = detector.detect_vehicles(frame)
        
        # 2. Update Tracker
        tracked_objects = tracker.update_tracks(detections)
        
        # 3. Count vehicles within ROI
        current_two_wheeler_count = 0
        current_light_motor_count = 0
        current_heavy_motor_count = 0
        
        for track_id, track_data in tracked_objects.items():
            center_x, center_y = track_data['center']
            vehicle_class = track_data['vehicle_class']
            
            # Check if the tracked vehicle's center is within ROI
            if roi_x1 < center_x < roi_x2 and roi_y1 < center_y < roi_y2:
                if vehicle_class == "two_wheeler":
                    current_two_wheeler_count += 1
                elif vehicle_class == "light_motor":
                    current_light_motor_count += 1
                elif vehicle_class == "heavy_motor":
                    current_heavy_motor_count += 1
        
        # Update final counts
        final_two_wheeler_count = current_two_wheeler_count
        final_light_motor_count = current_light_motor_count
        final_heavy_motor_count = current_heavy_motor_count
        
        # Calculate FPS
        frame_count += 1
        if frame_count % 30 == 0:  # Log FPS every 30 frames
            elapsed_time = time.time() - start_time
            if elapsed_time > 0:
                current_fps = frame_count / elapsed_time
                logger.debug(f"Processing FPS: {current_fps:.2f}")
    
    video.release()
    logger.info("Video processing completed.")
    
    # Calculate final statistics
    total_vehicles = final_two_wheeler_count + final_light_motor_count + final_heavy_motor_count
    logger.info("="*60)
    logger.info("FINAL VEHICLE COUNTS:")
    logger.info(f"  Junction: {junction_id}")
    logger.info(f"  Phase: {phase_number}")
    logger.info(f"  Two-Wheelers: {final_two_wheeler_count}")
    logger.info(f"  Light Motor Vehicles: {final_light_motor_count}")
    logger.info(f"  Heavy Motor Vehicles: {final_heavy_motor_count}")
    logger.info(f"  TOTAL: {total_vehicles}")
    logger.info("="*60)
    
    # Save to database
    logger.info("Saving traffic data to database...")
    success = save_traffic_count(
        junction_id=junction_id,
        phase_number=phase_number,
        two_wheelers=final_two_wheeler_count,
        light_vehicles=final_light_motor_count,
        heavy_vehicles=final_heavy_motor_count
    )
    
    if success:
        logger.info("✓ Successfully saved traffic data to database")
    else:
        logger.error("✗ Failed to save traffic data to database")
        sys.exit(1)
    
    logger.info("Application finished successfully.")

if __name__ == "__main__":
    main()

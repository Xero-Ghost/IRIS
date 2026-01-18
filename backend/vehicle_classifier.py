# vehicle_classifier.py
"""
Vehicle Classification System using YOLO
Classifies vehicles in video ROI into three categories:
- Motorcycle (two-wheelers)
- LMV (Light Motor Vehicles)
- HMV (Heavy Motor Vehicles)

Supports two modes:
1. Manual mode: Interactive ROI selection and file output
2. Database mode: ROI from database, cumulative counting with entry/exit lines
"""

import cv2
import logging
import time
import json
import argparse
import os
from datetime import datetime
from typing import Optional, Dict, List

# Import the custom classes and config
from vehicle_detector import VehicleDetector
from vehicle_tracker import VehicleTracker
from manual_roi_selector import ManualROISelector
from config import Config

# Database imports
try:
    from database import SessionLocal
    from models import SignalPhase, VehicleClassification
    from sqlalchemy.orm import Session
    DATABASE_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Database imports failed: {e}. Database mode will not be available.")
    DATABASE_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=Config.LOG_LEVEL,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('vehicle_classifier.log'),
        logging.StreamHandler()
    ]
)


class VehicleClassifier:
    """
    Classifies vehicles in video into three categories: Motorcycle, LMV, HMV
    Supports manual mode and database mode with cumulative counting
    """
    
    def __init__(self, use_database: bool = False, junction_id: Optional[str] = None, 
                 phase: Optional[int] = None):
        """
        Initialize the classifier
        
        Args:
            use_database: Whether to use database mode
            junction_id: Junction ID for database mode
            phase: Phase number for database mode
        """
        self.detector = None
        self.tracker = None
        self.roi_coordinates = None
        self.use_database = use_database and DATABASE_AVAILABLE
        self.junction_id = junction_id
        self.phase = phase
        self.db_session: Optional[Session] = None
        self.db_record_id: Optional[int] = None
        
        # Cumulative vehicle counts (never decrease)
        self.vehicle_counts = {
            'motorcycle': 0,
            'lmv': 0,
            'hmv': 0
        }
        
        # Track IDs that have been counted (for cumulative counting)
        self.counted_track_ids = set()
        
        # Entry/exit line coordinates
        self.exit_line_y = None
        
        if self.use_database:
            if not DATABASE_AVAILABLE:
                logging.error("Database mode requested but database imports failed")
                self.use_database = False
            elif not junction_id or phase is None:
                logging.error("Database mode requires junction_id and phase")
                self.use_database = False
            else:
                self.db_session = SessionLocal()
                logging.info(f"Database mode enabled for junction {junction_id}, phase {phase}")
        
    def initialize_detector(self, model_path=None):
        """Initialize YOLO detector"""
        self.detector = VehicleDetector(model_path=model_path or Config.DEFAULT_MODEL)
        logging.info(f"Detector initialized using model: {self.detector.model_path}")
        
    def initialize_tracker(self):
        """Initialize vehicle tracker for cumulative counting"""
        self.tracker = VehicleTracker(
            max_track_age=Config.MAX_TRACK_AGE,
            min_hits=Config.MIN_HITS
        )
        logging.info("Vehicle tracker initialized for cumulative counting")
        
    def fetch_roi_from_database(self) -> bool:
        """
        Fetch ROI coordinates from database
        
        Returns:
            True if successful, False otherwise
        """
        if not self.use_database or not self.db_session:
            return False
            
        try:
            phase_record = self.db_session.query(SignalPhase).filter(
                SignalPhase.junction_id == self.junction_id,
                SignalPhase.phase_number == self.phase
            ).first()
            
            if not phase_record:
                logging.error(f"No phase record found for junction {self.junction_id}, phase {self.phase}")
                return False
                
            if not all([phase_record.roi_x1, phase_record.roi_y1, 
                       phase_record.roi_x2, phase_record.roi_y2]):
                logging.error(f"ROI coordinates not set in database for junction {self.junction_id}, phase {self.phase}")
                return False
                
            self.roi_coordinates = [
                phase_record.roi_x1,
                phase_record.roi_y1,
                phase_record.roi_x2,
                phase_record.roi_y2
            ]
            
            # Set exit line at 3/4 of ROI height
            roi_height = self.roi_coordinates[3] - self.roi_coordinates[1]
            self.exit_line_y = self.roi_coordinates[1] + int(roi_height * 0.75)
            
            # Configure detector with ROI
            self.detector.set_roi(self.roi_coordinates, enabled=True)
            
            logging.info(f"ROI loaded from database: {self.roi_coordinates}")
            logging.info(f"Exit line set at y={self.exit_line_y}")
            
            return True
            
        except Exception as e:
            logging.error(f"Error fetching ROI from database: {e}")
            return False
            
    def load_or_create_db_record(self, video_source: str) -> bool:
        """
        Load existing or create new vehicle classification record in database
        
        Args:
            video_source: Path to video file
            
        Returns:
            True if successful, False otherwise
        """
        if not self.use_database or not self.db_session:
            return False
            
        try:
            # Check if record exists for this junction/phase
            existing_record = self.db_session.query(VehicleClassification).filter(
                VehicleClassification.junction_id == self.junction_id,
                VehicleClassification.phase == self.phase
            ).first()
            
            if existing_record:
                # Load existing counts
                self.vehicle_counts['motorcycle'] = existing_record.motorcycles
                self.vehicle_counts['lmv'] = existing_record.lmv
                self.vehicle_counts['hmv'] = existing_record.hmv
                self.db_record_id = existing_record.id
                logging.info(f"Loaded existing record ID {self.db_record_id} with counts: {self.vehicle_counts}")
            else:
                # Create new record
                new_record = VehicleClassification(
                    junction_id=self.junction_id,
                    phase=self.phase,
                    motorcycles=0,
                    lmv=0,
                    hmv=0,
                    total_count=0,
                    video_source=video_source,
                    roi_coordinates=json.dumps(self.roi_coordinates)
                )
                self.db_session.add(new_record)
                self.db_session.commit()
                self.db_record_id = new_record.id
                logging.info(f"Created new database record ID {self.db_record_id}")
                
            return True
            
        except Exception as e:
            logging.error(f"Error loading/creating database record: {e}")
            self.db_session.rollback()
            return False
            
    def save_to_database(self) -> bool:
        """
        Save current counts to database
        
        Returns:
            True if successful, False otherwise
        """
        if not self.use_database or not self.db_session or not self.db_record_id:
            return False
            
        try:
            record = self.db_session.query(VehicleClassification).filter(
                VehicleClassification.id == self.db_record_id
            ).first()
            
            if record:
                record.motorcycles = self.vehicle_counts['motorcycle']
                record.lmv = self.vehicle_counts['lmv']
                record.hmv = self.vehicle_counts['hmv']
                record.total_count = sum(self.vehicle_counts.values())
                
                self.db_session.commit()
                logging.info(f"Saved counts to database: {self.vehicle_counts}")
                return True
            else:
                logging.error(f"Database record ID {self.db_record_id} not found")
                return False
                
        except Exception as e:
            logging.error(f"Error saving to database: {e}")
            self.db_session.rollback()
            return False
            
    def select_roi(self, frame) -> bool:
        """Select ROI interactively (manual mode only)"""
        roi_selector = ManualROISelector()
        self.roi_coordinates = roi_selector.select_roi_interactively(frame)
        
        if self.roi_coordinates is None:
            logging.warning("ROI selection aborted")
            return False
            
        # Set exit line at 3/4 of ROI height
        roi_height = self.roi_coordinates[3] - self.roi_coordinates[1]
        self.exit_line_y = self.roi_coordinates[1] + int(roi_height * 0.75)
            
        # Configure detector with ROI
        self.detector.set_roi(self.roi_coordinates, enabled=True)
        logging.info(f"ROI selected: {self.roi_coordinates}")
        logging.info(f"Exit line set at y={self.exit_line_y}")
        return True
        
    def classify_vehicle_simple(self, vehicle_class: str) -> str:
        """
        Map vehicle_class from detector to simplified categories
        
        Args:
            vehicle_class: Vehicle class from detector ('two_wheeler', 'light_motor', 'heavy_motor')
            
        Returns:
            Simplified category: 'motorcycle', 'lmv', or 'hmv'
        """
        if vehicle_class == 'two_wheeler':
            return 'motorcycle'
        elif vehicle_class == 'light_motor':
            return 'lmv'
        elif vehicle_class == 'heavy_motor':
            return 'hmv'
        else:
            return 'lmv'  # Default to LMV for unknown
            
    def count_vehicles_at_exit_line(self, tracked_objects: Dict) -> Dict[str, int]:
        """
        Count vehicles crossing exit line (cumulative counting)
        
        Args:
            tracked_objects: Dictionary of tracked vehicles from tracker
            
        Returns:
            Dictionary with newly counted vehicles
        """
        new_counts = {
            'motorcycle': 0,
            'lmv': 0,
            'hmv': 0
        }
        
        if not self.roi_coordinates or self.exit_line_y is None:
            return new_counts
            
        roi_x1, roi_y1, roi_x2, roi_y2 = self.roi_coordinates
        
        for track_id, track_data in tracked_objects.items():
            # Skip if already counted
            if track_id in self.counted_track_ids:
                continue
                
            center_x, center_y = track_data['center']
            
            # Check if vehicle is within ROI horizontally and has crossed exit line
            if roi_x1 < center_x < roi_x2 and center_y > self.exit_line_y:
                vehicle_class = track_data['vehicle_class']
                simplified_class = self.classify_vehicle_simple(vehicle_class)
                
                # Count this vehicle
                new_counts[simplified_class] += 1
                self.vehicle_counts[simplified_class] += 1
                self.counted_track_ids.add(track_id)
                
                logging.debug(f"Counted vehicle ID {track_id} as {simplified_class}")
                
        return new_counts
        
    def draw_classification_info(self, frame, current_counts: Dict[str, int]) -> cv2.Mat:
        """
        Draw classification information on frame
        
        Args:
            frame: Video frame
            current_counts: Dictionary with current frame vehicle counts
            
        Returns:
            Frame with annotations
        """
        result_frame = frame.copy()
        
        # Draw ROI rectangle
        if self.roi_coordinates:
            roi_x1, roi_y1, roi_x2, roi_y2 = self.roi_coordinates
            cv2.rectangle(result_frame, (roi_x1, roi_y1), (roi_x2, roi_y2), (0, 255, 255), 3)
            cv2.putText(result_frame, "Classification ROI", (roi_x1 + 10, roi_y1 + 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            
            # Draw exit line
            if self.exit_line_y:
                cv2.line(result_frame, (roi_x1, self.exit_line_y), (roi_x2, self.exit_line_y), 
                        (255, 0, 255), 2)
                cv2.putText(result_frame, "Exit Line", (roi_x2 - 100, self.exit_line_y - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)
        
        # Calculate total
        total = self.vehicle_counts['motorcycle'] + self.vehicle_counts['lmv'] + self.vehicle_counts['hmv']
        
        # Draw classification counts with background
        y_offset = 60
        line_height = 45
        box_width = 400
        box_height = 220
        
        # Semi-transparent background
        overlay = result_frame.copy()
        cv2.rectangle(overlay, (30, 30), (30 + box_width, 30 + box_height), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, result_frame, 0.4, 0, result_frame)
        
        # Title
        mode_text = "CUMULATIVE" if self.use_database or self.tracker else "CURRENT"
        cv2.putText(result_frame, f"Vehicle Count ({mode_text})", (40, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        y_offset += line_height
        
        # Draw separator line
        cv2.line(result_frame, (40, y_offset - 10), (410, y_offset - 10), (255, 255, 255), 1)
        
        # Motorcycle count
        cv2.putText(result_frame, f"Motorcycle: {self.vehicle_counts['motorcycle']}", (40, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        y_offset += line_height
        
        # LMV count
        cv2.putText(result_frame, f"LMV: {self.vehicle_counts['lmv']}", (40, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
        y_offset += line_height
        
        # HMV count
        cv2.putText(result_frame, f"HMV: {self.vehicle_counts['hmv']}", (40, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        y_offset += line_height
        
        # Total count
        cv2.line(result_frame, (40, y_offset - 10), (410, y_offset - 10), (255, 255, 255), 1)
        cv2.putText(result_frame, f"Total: {total}", (40, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
        
        return result_frame
        
    def process_video(self, video_path: str, display: bool = True, save_output: bool = True) -> Optional[Dict]:
        """
        Process video and classify vehicles
        
        Args:
            video_path: Path to video file
            display: Whether to display video
            save_output: Whether to save results to file (manual mode only)
            
        Returns:
            Dictionary with final classification results
        """
        logging.info(f"Processing video: {video_path}")
        
        # Open video
        video = cv2.VideoCapture(video_path)
        
        if not video.isOpened():
            logging.error(f"Error: Could not open video file {video_path}")
            return None
            
        # Read first frame
        ret, frame = video.read()
        if not ret:
            logging.error("Error: Could not read first frame from video")
            return None
            
        # Setup ROI
        if self.use_database:
            # Fetch ROI from database
            if not self.fetch_roi_from_database():
                logging.error("Failed to fetch ROI from database")
                video.release()
                return None
                
            # Load or create database record
            if not self.load_or_create_db_record(video_path):
                logging.error("Failed to load/create database record")
                video.release()
                return None
                
            # Initialize tracker for cumulative counting
            self.initialize_tracker()
        else:
            # Manual ROI selection
            if not self.select_roi(frame):
                logging.error("ROI selection failed")
                video.release()
                cv2.destroyAllWindows()
                return None
                
            # Initialize tracker 
            self.initialize_tracker()
            
        # Reset video to beginning
        video.set(cv2.CAP_PROP_POS_FRAMES, 0)
        
        logging.info("Starting video processing...")
        
        # Processing variables
        frame_count = 0
        start_time = time.time()
        fps = 0
        save_interval = 100  # Save to DB every 100 frames
        
        # Get video properties
        frame_width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        
        while True:
            ret, frame = video.read()
            if not ret:
                logging.info("End of video stream")
                break
                
            # Detect vehicles
            detections = self.detector.detect_vehicles(frame)
            
            # Update tracker
            tracked_objects = self.tracker.update_tracks(detections)
            
            # Count vehicles crossing exit line (cumulative)
            new_counts = self.count_vehicles_at_exit_line(tracked_objects)
            
            # Draw detections
            result_frame = self.detector.draw_detections(frame.copy(), detections, tracked_objects)
            
            # Draw classification info
            result_frame = self.draw_classification_info(result_frame, new_counts)
            
            # Calculate and display FPS
            frame_count += 1
            elapsed_time = time.time() - start_time
            if elapsed_time > 1.0:
                fps = frame_count / elapsed_time
                frame_count = 0
                start_time = time.time()
                
            # Display FPS and progress
            cv2.putText(result_frame, f"FPS: {fps:.1f}", (frame_width - 150, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            current_frame = int(video.get(cv2.CAP_PROP_POS_FRAMES))
            progress = int((current_frame / total_frames) * 100)
            cv2.putText(result_frame, f"Progress: {progress}%", (frame_width - 200, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Periodically save to database
            if self.use_database and current_frame % save_interval == 0:
                self.save_to_database()
            
            # Display frame
            if display:
                cv2.imshow("Vehicle Classification", result_frame)
                key = cv2.waitKey(1) & 0xFF
                if key == 27:  # ESC key
                    logging.info("User requested exit")
                    break
                elif key == ord('p'):  # Pause
                    cv2.waitKey(0)
                    
        video.release()
        cv2.destroyAllWindows()
        
        # Final save/output
        if self.use_database:
            self.save_to_database()
        elif save_output:
            self.save_results()
            
        return self.vehicle_counts
        
    def save_results(self):
        """Save classification results to files (manual mode only)"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save as JSON
        json_filename = f"vehicle_classification_{timestamp}.json"
        results = {
            'timestamp': timestamp,
            'roi_coordinates': self.roi_coordinates,
            'vehicle_counts': self.vehicle_counts,
            'total_vehicles': sum(self.vehicle_counts.values()),
            'mode': 'cumulative'
        }
        
        with open(json_filename, 'w') as f:
            json.dump(results, f, indent=4)
        logging.info(f"Results saved to {json_filename}")
        
        # Save as simple text file
        txt_filename = "vehicle_classification_data.txt"
        with open(txt_filename, 'w') as f:
            f.write(f"Motorcycle, LMV, HMV\n")
            f.write(f"{self.vehicle_counts['motorcycle']}, {self.vehicle_counts['lmv']}, {self.vehicle_counts['hmv']}\n")
        logging.info(f"Results saved to {txt_filename}")
        
        # Print summary to console
        print("\n" + "="*50)
        print("VEHICLE CLASSIFICATION SUMMARY (CUMULATIVE)")
        print("="*50)
        print(f"Motorcycle:  {self.vehicle_counts['motorcycle']}")
        print(f"LMV:         {self.vehicle_counts['lmv']}")
        print(f"HMV:         {self.vehicle_counts['hmv']}")
        print(f"Total:       {sum(self.vehicle_counts.values())}")
        print("="*50 + "\n")
        
    def __del__(self):
        """Cleanup database session"""
        if self.db_session:
            self.db_session.close()


def main():
    """Main function to run vehicle classification"""
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Vehicle Classification System')
    parser.add_argument('--database', action='store_true', 
                       help='Use database mode (fetch ROI and save to DB)')
    parser.add_argument('--junction', type=str, 
                       help='Junction ID (required for database mode)')
    parser.add_argument('--phase', type=int, 
                       help='Phase number (required for database mode)')
    parser.add_argument('--video', type=str, 
                       help='Path to video file (optional, defaults to video2.mp4)')
    parser.add_argument('--no-display', action='store_true',
                       help='Run without display window')
    
    args = parser.parse_args()
    
    logging.info("Starting Vehicle Classification System...")
    
    # Validate database mode arguments
    if args.database:
        if not args.junction or args.phase is None:
            logging.error("Database mode requires --junction and --phase arguments")
            parser.print_help()
            return
            
        if not DATABASE_AVAILABLE:
            logging.error("Database mode not available (import failed)")
            return
    
    # Initialize classifier
    classifier = VehicleClassifier(
        use_database=args.database,
        junction_id=args.junction,
        phase=args.phase
    )
    classifier.initialize_detector()
    
    # Determine video path
    if args.video:
        video_path = args.video
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        video_path = os.path.join(script_dir, "video2.mp4")
    
    # Check if video exists
    if not os.path.exists(video_path):
        logging.error(f"Video file not found: {video_path}")
        logging.info("Please specify a valid video file with --video argument")
        return
    
    logging.info(f"Using video: {video_path}")
    
    # Process video
    results = classifier.process_video(
        video_path=video_path,
        display=not args.no_display,
        save_output=not args.database  # Only save files in manual mode
    )
    
    if results:
        logging.info("Classification completed successfully")
        logging.info(f"Final counts: {results}")
    else:
        logging.error("Classification failed")
        
    logging.info("Application finished")


if __name__ == "__main__":
    main()

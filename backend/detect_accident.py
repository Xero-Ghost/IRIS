"""
Accident Detection System - Headless Backend Mode
Processes video feeds using YOLO to detect accidents and saves results to database.
Designed for automated surveillance without GUI display.
"""

import cv2
import os
import time
import logging
import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from decimal import Decimal

from ultralytics import YOLO
from database import SessionLocal
from models import SignalPhase, Accident, Junction
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('accident_detector.log'),
        logging.StreamHandler()
    ]
)


class AccidentMonitor:
    """
    Headless accident monitoring system using YOLO
    Fetches video from database and saves detections
    """
    
    def __init__(
        self,
        junction_id: str,
        model_path: str = 'best.pt',
        confidence_threshold: float = 0.75,
        camera_id: Optional[str] = None
    ):
        """
        Initialize accident monitor
        
        Args:
            junction_id: Junction ID to monitor
            model_path: Path to trained YOLO model
            confidence_threshold: Minimum confidence for detection (0.0-1.0)
            camera_id: Optional camera ID
        """
        self.junction_id = junction_id
        self.camera_id = camera_id
        self.confidence_threshold = confidence_threshold
        self.model_path = model_path
        self.model = None
        self.video_source = None
        self.db_session: Optional[Session] = None
        
        # Create evidence directory
        self.evidence_dir = Path("accident_evidence")
        self.evidence_dir.mkdir(exist_ok=True)
        
        # Accident class IDs (from trained model)
        self.accident_class_ids = [1, 2, 3, 4]
        
        # Cooldown to prevent duplicate saves
        self.last_save_time = 0
        self.save_cooldown = 5.0  # seconds
        
        logging.info(f"Initializing Accident Monitor for junction {junction_id}")
        logging.info(f"Confidence threshold: {confidence_threshold}")
        
    def initialize(self) -> bool:
        """
        Initialize model and database connection
        
        Returns:
            True if successful, False otherwise
        """
        # Load YOLO model
        if not os.path.exists(self.model_path):
            logging.error(f"Model not found at {self.model_path}")
            return False
            
        try:
            logging.info(f"Loading YOLO model from {self.model_path}...")
            self.model = YOLO(self.model_path)
            logging.info("Model loaded successfully")
        except Exception as e:
            logging.error(f"Error loading model: {e}")
            return False
            
        # Initialize database session
        try:
            self.db_session = SessionLocal()
            logging.info("Database session created")
        except Exception as e:
            logging.error(f"Error creating database session: {e}")
            return False
            
        # Fetch video source from database
        if not self.fetch_video_source():
            return False
            
        return True
        
    def fetch_video_source(self) -> bool:
        """
        Fetch video source path from database
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # First check if junction exists
            junction = self.db_session.query(Junction).filter(
                Junction.id == self.junction_id
            ).first()
            
            if not junction:
                logging.error(f"Junction {self.junction_id} not found in database")
                return False
                
            # Try to get video source from signal_phases (phase 1 by default)
            phase = self.db_session.query(SignalPhase).filter(
                SignalPhase.junction_id == self.junction_id,
                SignalPhase.phase_number == 1
            ).first()
            
            if phase and phase.video_source:
                self.video_source = phase.video_source
                logging.info(f"Video source loaded from database: {self.video_source}")
                
                # Convert relative path to absolute if needed
                if not os.path.isabs(self.video_source):
                    script_dir = os.path.dirname(os.path.abspath(__file__))
                    self.video_source = os.path.join(script_dir, self.video_source)
                    
                return True
            else:
                logging.error(f"No video source found for junction {self.junction_id}")
                logging.info("Please set video_source in signal_phases table")
                return False
                
        except Exception as e:
            logging.error(f"Error fetching video source: {e}")
            return False
            
    def determine_severity(self, confidence: float, num_detections: int = 1) -> str:
        """
        Determine accident severity based on confidence and count
        
        Args:
            confidence: Detection confidence (0.0-1.0)
            num_detections: Number of detections in frame
            
        Returns:
            Severity level: 'low', 'medium', 'high', or 'critical'
        """
        if confidence >= 0.9 or num_detections >= 3:
            return 'critical'
        elif confidence >= 0.80 or num_detections >= 2:
            return 'high'
        elif confidence >= 0.75:
            return 'medium'
        else:
            return 'low'
            
    def save_accident_evidence(
        self,
        frame,
        confidence: float,
        detected_class: str,
        bbox_data: list
    ) -> Optional[str]:
        """
        Save evidence photo and create database record
        
        Args:
            frame: Video frame with accident
            confidence: Detection confidence
            detected_class: Detected class name
            bbox_data: Bounding box data
            
        Returns:
            Path to saved evidence file, or None if failed
        """
        try:
            # Generate filename with junction, timestamp, and confidence
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            conf_str = f"{confidence:.2f}".replace('.', '_')
            class_str = detected_class.replace(' ', '_')
            filename = f"{self.junction_id}_{timestamp}_conf_{conf_str}_{class_str}.jpg"
            filepath = self.evidence_dir / filename
            
            # Save image
            cv2.imwrite(str(filepath), frame)
            logging.info(f"Evidence photo saved: {filepath}")
            
            # Create database record
            accident = Accident(
                junction_id=self.junction_id,
                camera_id=self.camera_id,
                confidence_score=Decimal(str(confidence)),
                severity=self.determine_severity(confidence, len(bbox_data)),
                description=f"{detected_class} detected with {confidence:.2%} confidence",
                image_path=str(filepath.absolute()),
                bounding_boxes=json.dumps(bbox_data),
                detection_metadata=json.dumps({
                    'model_path': self.model_path,
                    'detected_class': detected_class,
'detection_time': timestamp
                }),
                status='active'
            )
            
            self.db_session.add(accident)
            self.db_session.commit()
            
            logging.info(f"✅ Accident record created in database (ID: {accident.id})")
            logging.info(f"   Severity: {accident.severity} | Confidence: {confidence:.2%}")
            
            return str(filepath)
            
        except Exception as e:
            logging.error(f"Error saving accident evidence: {e}")
            if self.db_session:
                self.db_session.rollback()
            return None
            
    def process_video(self, max_frames: Optional[int] = None) -> int:
        """
        Process video feed for accident detection
        
        Args:
            max_frames: Maximum frames to process (None for entire video)
            
        Returns:
            Number of accidents detected
        """
        logging.info(f"Opening video source: {self.video_source}")
        
        cap = cv2.VideoCapture(self.video_source)
        
        if not cap.isOpened():
            logging.error(f"Could not open video file: {self.video_source}")
            return 0
            
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        logging.info(f"Video properties: {total_frames} frames @ {fps:.2f} FPS")
        
        frame_count = 0
        accident_count = 0
        start_time = time.time()
        
        logging.info("Starting headless accident detection...")
        logging.info(f"Confidence threshold: {self.confidence_threshold}")
        
        while True:
            success, frame = cap.read()
            if not success:
                logging.info("End of video stream")
                break
                
            frame_count += 1
            
            # Check max frames limit
            if max_frames and frame_count > max_frames:
                logging.info(f"Reached maximum frame limit: {max_frames}")
                break
                
            # Run YOLO inference
            results = self.model(frame, conf=self.confidence_threshold, verbose=False)
            
            # Check for accidents
            accident_detected = False
            detected_class = ""
            max_confidence = 0.0
            bbox_list = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        cls_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        
                        if cls_id in self.accident_class_ids and confidence >= self.confidence_threshold:
                            accident_detected = True
                            detected_class = self.model.names[cls_id]
                            max_confidence = max(max_confidence, confidence)
                            
                            # Store bbox data
                            bbox = box.xyxy[0].tolist()
                            bbox_list.append({
                                'class': detected_class,
                                'confidence': confidence,
                                'bbox': bbox
                            })
                            
            # Save evidence if accident detected and cooldown passed
            if accident_detected:
                current_time = time.time()
                if current_time - self.last_save_time > self.save_cooldown:
                    # Ignore 'minor' class detections - only process 'moderate' or 'severe'
                    if 'minor' in detected_class.lower():
                        logging.info(f"Minor class accident detected at frame {frame_count} - Ignoring")
                        continue
                    
                    logging.warning(f"⚠️ ACCIDENT DETECTED at frame {frame_count}!")
                    logging.info(f"Class: {detected_class} | Confidence: {max_confidence:.2%}")
                    
                    # Get annotated frame
                    annotated_frame = results[0].plot()
                    
                    # Save evidence
                    evidence_path = self.save_accident_evidence(
                        annotated_frame,
                        max_confidence,
                        detected_class,
                        bbox_list
                    )
                    
                    if evidence_path:
                        accident_count += 1
                        self.last_save_time = current_time
                        
                        # Stop after first significant accident
                        logging.info("🛑 Stopping detection after first significant accident")
                        break
                        
            # Progress logging every 100 frames
            if frame_count % 100 == 0:
                elapsed = time.time() - start_time
                current_fps = frame_count / elapsed if elapsed > 0 else 0
                progress = (frame_count / total_frames) * 100 if total_frames > 0 else 0
                logging.info(f"Progress: {frame_count}/{total_frames} frames ({progress:.1f}%) | "
                           f"FPS: {current_fps:.1f} | Accidents detected: {accident_count}")
                    
        cap.release()
        
        # Final report
        elapsed_time = time.time() - start_time
        logging.info("="*60)
        logging.info("ACCIDENT DETECTION COMPLETED")
        logging.info("="*60)
        logging.info(f"Frames processed: {frame_count}")
        logging.info(f"Total accidents detected: {accident_count}")
        logging.info(f"Processing time: {elapsed_time:.2f} seconds")
        logging.info(f"Average FPS: {frame_count/elapsed_time:.2f}")
        logging.info("="*60)
        
        return accident_count
        
    def cleanup(self):
        """Cleanup resources"""
        if self.db_session:
            self.db_session.close()
            logging.info("Database session closed")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Accident Detection System - Headless Backend Mode',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Monitor junction J-002 with default settings
  python detect_accident.py --junction J-002
  
  # Custom confidence threshold
  python detect_accident.py --junction J-002 --confidence 0.80
  
  # Process only first 500 frames (for testing)
  python detect_accident.py --junction J-002 --max-frames 500
        """
    )
    
    parser.add_argument(
        '--junction',
        type=str,
        required=True,
        help='Junction ID to monitor (e.g., J-002)'
    )
    
    parser.add_argument(
        '--camera',
        type=str,
        help='Camera ID (optional)'
    )
    
    parser.add_argument(
        '--confidence',
        type=float,
        default=0.75,
        help='Confidence threshold for detection (default: 0.75)'
    )
    
    parser.add_argument(
        '--model',
        type=str,
        default='best.pt',
        help='Path to YOLO model weights'
    )
    
    parser.add_argument(
        '--max-frames',
        type=int,
        help='Maximum frames to process (for testing)'
    )
    
    args = parser.parse_args()
    
    # Create monitor instance
    monitor = AccidentMonitor(
        junction_id=args.junction,
        model_path=args.model,
        confidence_threshold=args.confidence,
        camera_id=args.camera
    )
    
    # Initialize
    if not monitor.initialize():
        logging.error("Failed to initialize accident monitor")
        return 1
        
    try:
        # Process video
        accident_count = monitor.process_video(max_frames=args.max_frames)
        
        return 0 if accident_count >= 0 else 1
        
    except KeyboardInterrupt:
        logging.info("\nMonitoring interrupted by user")
        return 0
        
    except Exception as e:
        logging.error(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1
        
    finally:
        monitor.cleanup()


if __name__ == '__main__':
    exit(main())
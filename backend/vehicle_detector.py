import cv2
import numpy as np
from ultralytics import YOLO
import logging
from typing import List, Dict, Tuple, Optional
from config import Config
import os

class VehicleDetector:
    """YOLOv11-based vehicle detection system"""
    
    def __init__(self, model_path: Optional[str] = None):
        """Initialize the vehicle detector"""
        self.model_path = model_path or Config.DEFAULT_MODEL
        self.model = None
        self.confidence_threshold = Config.CONFIDENCE_THRESHOLD
        self.iou_threshold = Config.IOU_THRESHOLD
        self.roi_config = Config.DEFAULT_ROI.copy()
        
        # Vehicle class mapping
        self.vehicle_classes = Config.COCO_VEHICLE_CLASSES
        self.class_mapping = Config.VEHICLE_CLASSES
        
        self.load_model()
        
    def load_model(self):
        """Load YOLOv11 model"""
        try:
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                logging.info(f"Loaded model from {self.model_path}")
            else:
                # Download default model if not exists
                self.model = YOLO(Config.DEFAULT_MODEL)
                logging.info(f"Loaded default YOLOv11 model: {Config.DEFAULT_MODEL}")
        except Exception as e:
            logging.error(f"Error loading model: {str(e)}")
            raise
    
    def set_roi(self, coordinates: List[int], enabled: bool = True):
        """Set region of interest for detection"""
        self.roi_config = {
            'enabled': enabled,
            'coordinates': coordinates,
            'name': 'custom_roi'
        }
        logging.info(f"ROI set: {self.roi_config}")
    
    def classify_vehicle(self, class_id: int, bbox: List[float]) -> str:
        """Enhanced vehicle classification"""
        class_names = self.model.names
        detected_class = class_names.get(class_id, 'unknown')
        
        # Calculate bbox area for size-based classification
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
        area = width * height
        
        # Enhanced classification logic
        if detected_class in ['motorcycle', 'bicycle']:
            return 'two_wheeler'
        elif detected_class == 'car':
            # Distinguish between car and light truck based on size
            if area > 15000: # Larger vehicles might be SUVs/light trucks
                return 'light_motor'
            return 'light_motor'
        elif detected_class == 'truck':
            # Distinguish between light and heavy trucks based on size
            if area > 25000:
                return 'heavy_motor'
            return 'light_motor'
        elif detected_class == 'bus':
            return 'heavy_motor'
        else:
            return 'unknown'
    
    def detect_vehicles(self, frame: np.ndarray) -> List[Dict]:
        """Detect vehicles in a frame"""
        if self.model is None:
            logging.error("Model not loaded")
            return []
        
        try:
            # Apply ROI if enabled
            detection_frame = frame
            roi_offset = [0, 0]
            
            if self.roi_config['enabled']:
                x1, y1, x2, y2 = self.roi_config['coordinates']
                detection_frame = frame[y1:y2, x1:x2]
                roi_offset = [x1, y1]
            
            # Run inference
            results = self.model(
                detection_frame,
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                verbose=False
            )
            
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Extract detection data
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        bbox = box.xyxy[0].tolist()
                        
                        # Filter for vehicle classes only
                        if class_id in self.vehicle_classes:
                            # Adjust coordinates for ROI offset
                            adjusted_bbox = [
                                bbox[0] + roi_offset[0],
                                bbox[1] + roi_offset[1],
                                bbox[2] + roi_offset[0],
                                bbox[3] + roi_offset[1]
                            ]
                            
                            # Enhanced vehicle classification
                            vehicle_class = self.classify_vehicle(class_id, adjusted_bbox)
                            
                            detection = {
                                'class_id': class_id,
                                'class_name': self.model.names[class_id],
                                'vehicle_class': vehicle_class,
                                'confidence': confidence,
                                'bbox': adjusted_bbox,
                                'center': [
                                    (adjusted_bbox[0] + adjusted_bbox[2]) / 2,
                                    (adjusted_bbox[1] + adjusted_bbox[3]) / 2
                                ]
                            }
                            detections.append(detection)
            
            return detections
            
        except Exception as e:
            logging.error(f"Error during detection: {str(e)}")
            return []
    
    def draw_detections(self, frame: np.ndarray, detections: List[Dict], 
                        tracked_objects: Optional[Dict] = None) -> np.ndarray:
        """Draw detection results on frame"""
        result_frame = frame.copy()
        
        # Draw ROI if enabled
        if self.roi_config['enabled']:
            x1, y1, x2, y2 = self.roi_config['coordinates']
            cv2.rectangle(result_frame, (x1, y1), (x2, y2), (255, 255, 0), 2)
            cv2.putText(result_frame, 'ROI', (x1, y1-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        
        # Color mapping for vehicle classes
        class_colors = {
            'two_wheeler': (0, 255, 0),      # Green
            'light_motor': (255, 0, 0),      # Blue
            'heavy_motor': (0, 0, 255),      # Red
            'unknown': (128, 128, 128)       # Gray
        }
        
        for detection in detections:
            bbox = detection['bbox']
            vehicle_class = detection['vehicle_class']
            confidence = detection['confidence']
            
            # Get color for vehicle class
            color = class_colors.get(vehicle_class, (255, 255, 255))
            
            # Draw bounding box
            x1, y1, x2, y2 = map(int, bbox)
            cv2.rectangle(result_frame, (x1, y1), (x2, y2), color, 2)
            
            # Prepare label
            label = f"{vehicle_class}: {confidence:.2f}"
            
            # Add tracking ID if available
            if tracked_objects:
                center = detection['center']
                for track_id, track_data in tracked_objects.items():
                    if abs(track_data['center'][0] - center[0]) < 50 and \
                       abs(track_data['center'][1] - center[1]) < 50:
                        label = f"ID:{track_id} {label}"
                        break
            
            # Draw label background
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(result_frame, (x1, y1-25), (x1+label_size[0], y1), color, -1)
            
            # Draw label text
            cv2.putText(result_frame, label, (x1, y1-5), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        return result_frame
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        if self.model is None:
            return {'error': 'Model not loaded'}
        
        return {
            'model_path': self.model_path,
            'model_type': 'YOLOv11',
            'confidence_threshold': self.confidence_threshold,
            'iou_threshold': self.iou_threshold,
            'vehicle_classes': list(self.class_mapping.keys()),
            'roi_enabled': self.roi_config['enabled']

        }
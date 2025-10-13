# config.py
import os
import logging

class Config:
    """
    Configuration settings for the Vehicle Detection and Tracking system.
    """

    # Model Settings
    # Path to your YOLOv11 model file. If not found, Ultralytics might download a default.
    # For RTX 4060, ensure you have the correct CUDA-enabled PyTorch/TensorFlow setup.
    # NOTE: YOLOv11 is a conceptual model name. If not officially released by Ultralytics
    # by this name, you might use yolov8x.pt or a custom-trained model.
    DEFAULT_MODEL: str = "yolo11x.pt" # Using yolov8x.pt as a placeholder for a high-performance YOLO model.
                                     # Replace with "yolo11x.pt" if an official YOLOv11 becomes available
                                     # or path to your custom trained YOLOv11 model.

    # Detection Thresholds
    CONFIDENCE_THRESHOLD: float = 0.5  # Minimum confidence score for a detection
    IOU_THRESHOLD: float = 0.45      # Intersection Over Union threshold for Non-Maximum Suppression

    # Region of Interest (ROI) - This will be overridden by manual selection in prototype.py
    DEFAULT_ROI: dict = {
        'enabled': False,
        'coordinates': [0, 0, 1280, 720],
        'name': 'default_roi'
    }

    # Vehicle Class Mappings (based on COCO dataset indices)
    # These are common COCO object detection class IDs for vehicles.
    # You might need to adjust these based on the specific model you use and its dataset.
    COCO_VEHICLE_CLASSES: list = [
        2,  # car
        3,  # motorcycle
        5,  # bus
        7,  # truck
        6,  # train (optional, depending on your use case)
        0,  # person (often excluded for pure vehicle detection, but included if two-wheelers with riders are a concern)
        1,  # bicycle
    ]

    # Custom Vehicle Classification Mapping
    # This maps the raw detected COCO classes to your custom categories
    # as used in vehicle_detector.py's classify_vehicle method.
    VEHICLE_CLASSES: dict = {
        'two_wheeler': ['motorcycle', 'bicycle'],
        'light_motor': ['car'],
        'heavy_motor': ['truck', 'bus'],
    }

    # Logging Settings
    LOG_LEVEL: str = 'INFO' # DEBUG, INFO, WARNING, ERROR, CRITICAL
    LOG_FILE: str = 'application.log'

    # Display Settings (for the main application)
    DISPLAY_WIDTH: int = 1280
    DISPLAY_HEIGHT: int = 720
    DISPLAY_WINDOW_NAME: str = "Vehicle Detection and Tracking"

    # Tracking Settings (placeholders, will be used by a tracking module)
    MAX_TRACK_AGE: int = 30 # Number of frames a track can be 'lost' before being deleted
    MIN_HITS: int = 3      # Minimum number of detections required to establish a track

# Configure logging early based on Config settings
logging.basicConfig(level=Config.LOG_LEVEL, format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.FileHandler(Config.LOG_FILE), logging.StreamHandler()])

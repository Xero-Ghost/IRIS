# vehicle_tracker.py
import math
import logging
from typing import List, Dict, Tuple
from collections import OrderedDict
from config import Config

# Using Config.LOG_LEVEL as defined in config.py
logging.basicConfig(level=Config.LOG_LEVEL, format='%(asctime)s - %(levelname)s - %(message)s')

class VehicleTracker:
    """
    A simple centroid-based object tracker for vehicles.
    Assigns unique IDs and tracks vehicles across frames.
    """

    def __init__(self, max_track_age: int = Config.MAX_TRACK_AGE,
                 min_hits: int = Config.MIN_HITS):
        """
        Initializes the tracker.

        Args:
            max_track_age: Number of frames a track can be 'lost' before being deleted.
            min_hits: Minimum number of detections required to establish a track.
        """
        self.next_object_id = 0
        # Store tracked objects: {object_id: {'center': [x, y], 'bbox': [...], 'vehicle_class': '...', 'hits': 0, 'lost_frames': 0}}
        self.tracked_objects = OrderedDict()
        self.max_track_age = max_track_age
        self.min_hits = min_hits
        logging.info(f"VehicleTracker initialized with max_track_age={max_track_age}, min_hits={min_hits}")

    def _get_distance(self, p1: List[float], p2: List[float]) -> float:
        """Calculates Euclidean distance between two points."""
        return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

    def update_tracks(self, detections: List[Dict]) -> Dict:
        """
        Updates existing tracks and creates new ones based on current detections.

        Args:
            detections: A list of dictionaries, where each dict represents a detection
                        and contains at least 'center' and 'vehicle_class'.
                        (e.g., from VehicleDetector.detect_vehicles output).

        Returns:
            A dictionary of currently active tracked objects,
            {track_id: {'center': [x, y], 'bbox': [...], 'vehicle_class': '...', 'hits': int, 'lost_frames': int}}
        """
        if not detections:
            # If no detections, increment lost_frames for all existing tracks
            for obj_id in list(self.tracked_objects.keys()):
                self.tracked_objects[obj_id]['lost_frames'] += 1
                if self.tracked_objects[obj_id]['lost_frames'] > self.max_track_age:
                    logging.debug(f"Track {obj_id} removed due to age.")
                    del self.tracked_objects[obj_id]
            return self.tracked_objects

        current_detection_centers = [d['center'] for d in detections]
        current_detection_bboxes = [d['bbox'] for d in detections]
        current_detection_classes = [d['vehicle_class'] for d in detections]

        matched_detection_indices = set()
        
        # Try to match current detections with existing tracked objects
        for obj_id, obj_data in list(self.tracked_objects.items()):
            min_dist = float('inf')
            best_match_idx = -1

            for i, det_center in enumerate(current_detection_centers):
                if i in matched_detection_indices: # Skip already matched detections
                    continue
                
                # Check if classes are compatible
                # Note: The original tracker code has a class compatibility check.
                # If your `classify_vehicle` method is robust, this might be simplified,
                # but keeping it provides an additional layer of filtering.
                if obj_data['vehicle_class'] != current_detection_classes[i]:
                    continue

                dist = self._get_distance(obj_data['center'], det_center)
                if dist < min_dist and dist < 100: # Threshold for matching
                    min_dist = dist
                    best_match_idx = i

            if best_match_idx != -1:
                # Update matched tracked object
                self.tracked_objects[obj_id]['center'] = current_detection_centers[best_match_idx]
                self.tracked_objects[obj_id]['bbox'] = current_detection_bboxes[best_match_idx]
                self.tracked_objects[obj_id]['vehicle_class'] = current_detection_classes[best_match_idx] # Update class in case of re-classification
                self.tracked_objects[obj_id]['hits'] += 1
                self.tracked_objects[obj_id]['lost_frames'] = 0
                matched_detection_indices.add(best_match_idx)
                logging.debug(f"Track {obj_id} matched with detection {best_match_idx}.")
            else:
                # No match for this tracked object, increment lost frames
                self.tracked_objects[obj_id]['lost_frames'] += 1
                if self.tracked_objects[obj_id]['lost_frames'] > self.max_track_age:
                    logging.debug(f"Track {obj_id} removed due to age.")
                    del self.tracked_objects[obj_id]

        # Create new tracks for unmatched detections
        for i, det_center in enumerate(current_detection_centers):
            if i not in matched_detection_indices:
                new_id = self.next_object_id
                self.tracked_objects[new_id] = {
                    'center': det_center,
                    'bbox': current_detection_bboxes[i],
                    'vehicle_class': current_detection_classes[i],
                    'hits': 1,
                    'lost_frames': 0
                }
                self.next_object_id += 1
                logging.debug(f"New track {new_id} created for detection {i}.")

        # Filter out tracks that haven't met min_hits yet
        active_tracks = {
            k: v for k, v in self.tracked_objects.items()
            if v['hits'] >= self.min_hits
        }

        return active_tracks
# prototype.py
import cv2
import logging
import time

# Import the custom classes and config
from vehicle_detector import VehicleDetector
from vehicle_tracker import VehicleTracker
from manual_roi_selector import ManualROISelector
from config import Config

# Configure logging (already done in config.py, but good to ensure)
logging.basicConfig(level=Config.LOG_LEVEL, format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.FileHandler(Config.LOG_FILE), logging.StreamHandler()])

def main():
    """
    Main function to run the vehicle detection, tracking, and counting application.
    """
    logging.info("Starting Vehicle Detection, Tracking, and Counting Application...")

    # Initialize VehicleDetector (will load YOLOv11 model based on Config.DEFAULT_MODEL)
    detector = VehicleDetector(model_path=Config.DEFAULT_MODEL)
    logging.info(f"Detector initialized using model: {detector.model_path}")

    # Open video
    video_path = "video2.mp4" # Ensure this video file exists in the same directory or provide full path
    video = cv2.VideoCapture(video_path)

    if not video.isOpened():
        logging.error(f"Error: Could not open video file {video_path}")
        return

    # Read the first frame for ROI selection
    ret, frame = video.read()
    if not ret:
        logging.error("Error: Could not read first frame from video.")
        return
    
    # Initialize ROI Selector
    roi_selector = ManualROISelector()
    selected_roi_coordinates = roi_selector.select_roi_interactively(frame)

    if selected_roi_coordinates is None:
        logging.info("ROI selection aborted. Exiting application.")
        video.release()
        cv2.destroyAllWindows()
        return

    # Configure detector with the manually selected ROI
    detector.set_roi(selected_roi_coordinates, enabled=True)
    roi_x1, roi_y1, roi_x2, roi_y2 = selected_roi_coordinates
    logging.info(f"Manually selected ROI for detection and counting: {selected_roi_coordinates}")

    # Initialize VehicleTracker
    tracker = VehicleTracker(max_track_age=Config.MAX_TRACK_AGE, min_hits=Config.MIN_HITS)

    # Reset video to the beginning for processing after ROI selection
    video.set(cv2.CAP_PROP_POS_FRAMES, 0)

    logging.info("Starting video processing with selected ROI...")

    # For FPS calculation
    frame_count = 0
    start_time = time.time()

    # Get video properties for FPS display
    frame_width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    
    # Initialize final counts for file saving
    final_two_wheeler_count = 0
    final_light_motor_count = 0
    final_heavy_motor_count = 0

    while True:
        ret, frame = video.read()
        if not ret:
            logging.info("End of video stream or error reading frame.")
            break

        # 1. Detect Vehicles using VehicleDetector
        detections = detector.detect_vehicles(frame)
        
        # 2. Update Tracker with current detections
        tracked_objects = tracker.update_tracks(detections)

        # 3. Draw Detections and Tracks on frame
        result_frame = detector.draw_detections(frame.copy(), detections, tracked_objects)

        # --- Counting Logic for Manually Selected ROI ---
        # Initialize counts for the current frame
        current_two_wheeler_count = 0
        current_light_motor_count = 0
        current_heavy_motor_count = 0

        # Iterate through currently tracked objects to count those within the custom ROI
        for track_id, track_data in tracked_objects.items():
            center_x, center_y = track_data['center']
            vehicle_class = track_data['vehicle_class']

            # Check if the tracked vehicle's center is within the manually selected ROI
            if roi_x1 < center_x < roi_x2 and roi_y1 < center_y < roi_y2:
                if vehicle_class == "two_wheeler":
                    current_two_wheeler_count += 1
                elif vehicle_class == "light_motor":
                    current_light_motor_count += 1
                elif vehicle_class == "heavy_motor":
                    current_heavy_motor_count += 1
        
        # Update final counts (simple sum for now; for actual traffic counting,
        # you'd need entry/exit lines logic with track IDs)
        final_two_wheeler_count = current_two_wheeler_count
        final_light_motor_count = current_light_motor_count
        final_heavy_motor_count = current_heavy_motor_count

        total_current_roi_vehicles = final_two_wheeler_count + final_light_motor_count + final_heavy_motor_count
        
        # Display the ROI box on the result frame
        cv2.rectangle(result_frame, (roi_x1, roi_y1), (roi_x2, roi_y2), (255, 0, 255), 2) # Magenta color for selected ROI
        cv2.putText(result_frame, "Custom ROI", (roi_x1 + 10, roi_y1 + 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 255), 2)

        # Display current vehicle counts
        cv2.putText(result_frame, f"ROI Total: {total_current_roi_vehicles}", (50, 50),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)
        cv2.putText(result_frame, f"Two-Wheelers: {final_two_wheeler_count}", (50, 80),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)
        cv2.putText(result_frame, f"Light Motor: {final_light_motor_count}", (50, 110),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)
        cv2.putText(result_frame, f"Heavy Motor: {final_heavy_motor_count}", (50, 140),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)
        
        # Display FPS
        frame_count += 1
        elapsed_time = time.time() - start_time
        if elapsed_time > 1.0: # Update FPS every second
            current_fps = frame_count / elapsed_time
            cv2.putText(result_frame, f"FPS: {current_fps:.2f}", (frame_width - 150, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2, cv2.LINE_AA)
            frame_count = 0
            start_time = time.time()


        cv2.imshow("Vehicle Detection and Tracking with Custom ROI", result_frame)
        if cv2.waitKey(1) & 0xFF == 27: # Press 'Esc' to exit during video processing
            logging.info("User requested exit during video processing.")
            break

    video.release()
    cv2.destroyAllWindows()

    # Save final counts to a file
    with open("vehicle_data.txt", "w") as file:
        file.write(f"{final_two_wheeler_count}, {final_light_motor_count}, {final_heavy_motor_count}\n")
    logging.info("Final counts saved to vehicle_data.txt")
    logging.info("Application finished.")

if __name__ == "__main__":

    main()
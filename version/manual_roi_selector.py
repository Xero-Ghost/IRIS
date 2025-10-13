# manual_roi_selector.py
import cv2
import logging

class ManualROISelector:
    """
    A utility class to allow users to manually select a Region of Interest (ROI)
    on a given frame using mouse interaction.
    """
    def __init__(self, window_name: str = "Select ROI - Press 'C' to confirm, 'R' to reset, 'Esc' to exit"):
        self.window_name = window_name
        self.drawing = False      # True if mouse is pressed
        self.ix, self.iy = -1, -1 # Initial click coordinates
        self.fx, self.fy = -1, -1 # Final release coordinates
        self.roi_selected = False # Flag to indicate if ROI has been selected
        self.current_frame_copy = None # To draw on a temporary copy of the frame
        self.selected_coordinates = None # Store the final selected ROI [x1, y1, x2, y2]

    def _mouse_callback(self, event, x, y, flags, param):
        """Callback function for mouse events."""
        if event == cv2.EVENT_LBUTTONDOWN:
            self.drawing = True
            self.ix, self.iy = x, y
            self.fx, self.fy = x, y # Initialize fx, fy to current position on click

        elif event == cv2.EVENT_MOUSEMOVE:
            if self.drawing:
                self.fx, self.fy = x, y # Update end point as mouse moves

        elif event == cv2.EVENT_LBUTTONUP:
            self.drawing = False
            self.fx, self.fy = x, y # Finalize end point
            self.roi_selected = True

    def select_roi_interactively(self, frame: cv2.Mat) -> list:
        """
        Allows interactive selection of an ROI on a given frame.

        Args:
            frame: The OpenCV image (numpy array) on which to select the ROI.

        Returns:
            A list of [x1, y1, x2, y2] coordinates of the selected ROI,
            or None if the selection is aborted.
        """
        cv2.namedWindow(self.window_name)
        cv2.setMouseCallback(self.window_name, self._mouse_callback)

        logging.info("Please click and drag to select a rectangular ROI for vehicle counting.")
        logging.info("Press 'C' to confirm the selection and start processing.")
        logging.info("Press 'R' to reset the selection.")
        logging.info("Press 'Esc' to exit.")

        while not self.roi_selected:
            self.current_frame_copy = frame.copy() # Work on a copy to avoid drawing on original frame permanently

            if self.drawing:
                # Draw the rectangle as the user drags the mouse (green while drawing)
                cv2.rectangle(self.current_frame_copy, (self.ix, self.iy), (self.fx, self.fy), (0, 255, 0), 2)
                cv2.putText(self.current_frame_copy, "Selecting ROI...", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            elif self.ix != -1 and self.iy != -1 and self.fx != -1 and self.fy != -1:
                # Draw the finalized rectangle if selection is done but not confirmed (red when ready for confirmation)
                cv2.rectangle(self.current_frame_copy, (self.ix, self.iy), (self.fx, self.fy), (0, 0, 255), 2)
                cv2.putText(self.current_frame_copy, "ROI Selected. Press 'C' to confirm.", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow(self.window_name, self.current_frame_copy)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('c'): # Press 'C' to confirm
                if self.ix != -1 and self.iy != -1 and self.fx != -1 and self.fy != -1:
                    # Basic check for a non-zero area rectangle
                    if abs(self.ix - self.fx) > 5 and abs(self.iy - self.fy) > 5: # Require at least 5x5 pixel area
                        self.roi_selected = True
                        # Ensure coordinates are sorted (top-left, bottom-right)
                        self.selected_coordinates = [
                            min(self.ix, self.fx),
                            min(self.iy, self.fy),
                            max(self.ix, self.fx),
                            max(self.iy, self.fy)
                        ]
                        logging.info(f"ROI confirmed: {self.selected_coordinates}")
                    else:
                        logging.warning("Selected ROI is too small. Please select a larger region.")
                        self._reset_selection()
                else:
                    logging.warning("No ROI selected yet. Please click and drag.")
            elif key == ord('r'): # Press 'R' to reset
                self._reset_selection()
                logging.info("ROI selection reset. Please select again.")
            elif key == 27: # Press 'Esc' to exit
                self.roi_selected = True # Exit the loop
                self.selected_coordinates = None # Indicate that selection was aborted
                logging.info("ROI selection aborted by user.")

        cv2.destroyWindow(self.window_name)
        return self.selected_coordinates

    def _reset_selection(self):
        """Resets all ROI selection related variables."""
        self.drawing = False
        self.roi_selected = False
        self.ix, self.iy = -1, -1
        self.fx, self.fy = -1, -1
        self.selected_coordinates = None
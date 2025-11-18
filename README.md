IRIS – Intelligent Roadway Infrastructure System (Prototype)

A basic computer-vision prototype for detecting vehicles from CCTV feeds, counting traffic inside a selected ROI, and generating a simple traffic-light timing cycle.

🚀 How the Current Version Works

The workflow runs in two steps:

Vehicle Counting → prototype.py

Traffic Timer Calculation → traffic_cycle.py

<br>
🟩 Step 1: Run Vehicle Detection & Counting

Navigate to the versions/ folder and run:

python prototype.py

✔ What this does:

Loads the sample video video2.mp4

Shows the first frame and asks you to select an ROI (Region of Interest)

Detects & tracks vehicles using YOLO

Counts:

Two-wheelers

Light Motor Vehicles

Heavy Motor Vehicles

Saves the output to:

vehicle_data.txt

<br>
📌 Generated Output Example
2,5,1


(two-wheelers, LMVs, HMVs)

<br>
⚠️ Important Limitation (Current Version)

The current prototype supports only one input video and one ROI selection.

Therefore, it generates only one line in vehicle_data.txt.

However, the timing calculator (traffic_cycle.py) requires 4 lines (one for each phase).

<br>
📝 Step 2: Manually Prepare vehicle_data.txt

Before running the timer, edit vehicle_data.txt so it contains four lines, like:

2,5,1
2,5,1
2,5,1
2,5,1


or write different values for each phase.

<br>
🟧 Step 3: Run the Traffic Signal Timer

Run:

python traffic_cycle.py

✔ This will calculate:

Green time (G)

Yellow time (Y)

Red time (R)

Clearance % (placeholder)

<br>
🛑 Clearance Value Notice

The Clearance (%) shown in the output is not functional yet.

It is currently manually set to 80 percent

Real clearance calculation logic is not implemented in this version

You will see values such as:

Clearance (%): 80.00


Future updates will contain the real computation.

<br>
📂 Files Overview
versions/
│── prototype.py              # Vehicle detection + ROI + counting<br>
│── traffic_cycle.py          # Traffic timer calculator<br>
│── green_time_simulation.py  # Backend logic for timing<br>
│── video2.mp4                # Sample test video<br>
│── vehicle_detector.py       # YOLO detection wrapper<br>
│── vehicle_tracker.py        # Tracking logic<br>
│── manual_roi_selector.py    # Interactive ROI selector<br>
│── config.py                 # Configurations<br>
│── vehicle_data.txt          # Output data file (1 line, must be edited)<br>

<br>
⛔ Current Limitations

Only one ROI and one video per run

Only one line of vehicle data generated

Must manually duplicate/edit data to create 4-phase input

Clearance value is hard-coded

No real-time CCTV input

RL-based optimization not added yet

<br>
🛣️ Planned Upgrades

Multi-ROI & automatic multi-phase data generation

Real CCTV RTSP stream support

RL-based adaptive traffic control

Auto lane detection & smart ROI

Real clearance calculation

Multi-intersection network optimization

Web dashboard & analytics

<br>

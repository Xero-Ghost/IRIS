IRIS – Intelligent Roadway Infrastructure System (Prototype)

A basic computer-vision prototype for detecting vehicles from a CCTV feed, counting them inside a selected ROI, and generating a simple traffic-light cycle timing.

How the Current Version Works

The prototype runs in two steps:

Vehicle Counting (prototype.py)

Traffic Timer Calculation (traffic_cycle.py)

Each step must be executed manually.

Step 1: Run Vehicle Detection & Counting

Inside the versions/ folder, run:

python prototype.py


What happens:

The sample video video2.mp4 loads

You select a Region of Interest (ROI) using your mouse

The system:

detects vehicles

tracks them

counts two-wheelers, LMVs, and HMVs inside the ROI

The result is saved into a file:

vehicle_data.txt


Important:
This version supports only one input video and one ROI, so the file will contain ONE line like:

2,5,1


(two-wheelers, LMVs, HMVs)

Step 2: Prepare vehicle_data.txt for Timer Calculation

The timer code (traffic_cycle.py) requires 4 lines of vehicle data (one for each traffic phase).

Since the current prototype only generates one line,
you must manually edit the file and add four lines, for example:

2,5,1
2,5,1
2,5,1
2,5,1


Or write any other values you want to test.

Step 3: Run Traffic Timer

Run:

python traffic_cycle.py


This will calculate:

Green time

Yellow time

Red time

Clearance percentage (currently placeholder)

Note About Clearance Calculation

The clearance (%) shown in the output is not functional yet.

It is currently manually set to 80 percent

The algorithm for real clearance calculation is not implemented

You will see values like:

Clearance (%): 80.00


This will be updated in future versions.

Limitations of Current Prototype

Only one ROI and one video per run

Only one line of vehicle data generated

User must manually create 4 lines for timer testing

Clearance value is hard-coded

No real-time CCTV support yet

No reinforcement-learning module yet

Files Needed

prototype.py → vehicle detection & counting

traffic_cycle.py → traffic signal timer

video2.mp4 → sample video

vehicle_data.txt → created automatically, then manually edited

green_time_simulation.py → backend timing logic

Next Steps (Planned)

Multi-phase detection (auto-generate all 4 lines)

Auto-ROI or lane detection

Live CCTV input

Real clearance calculation

Reinforcement Learning optimization

Multi-intersection networking

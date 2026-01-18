# IRIS - Intelligent Roadway Infrastructure System

A comprehensive traffic management platform that leverages computer vision and machine learning to optimize traffic signal timing, detect accidents, and provide real-time traffic analytics.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Computer Vision Scripts](#computer-vision-scripts)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Current Limitations](#current-limitations)
- [Production Roadmap](#production-roadmap)

---

## Overview

IRIS is an intelligent traffic management system designed to modernize urban traffic infrastructure. The system uses YOLO-based object detection models to analyze traffic footage, classify vehicles, detect accidents, and calculate optimal signal timings based on real-time traffic density.

### Key Objectives

- **Adaptive Signal Control**: Dynamically adjust traffic signal timings based on real-time vehicle counts
- **Accident Detection**: Automated detection of road accidents with evidence capture and alerting
- **Traffic Analytics**: Comprehensive data collection and visualization for traffic patterns
- **Green Corridor Management**: Priority routing for emergency vehicles across multiple junctions

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              IRIS System                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │   Frontend   │────▶│   Backend    │────▶│    PostgreSQL Database   │ │
│  │  (React/Vite)│◀────│  (FastAPI)   │◀────│                          │ │
│  └──────────────┘     └──────────────┘     └──────────────────────────┘ │
│                              │                                           │
│                              │                                           │
│                    ┌─────────▼─────────┐                                 │
│                    │  YOLO CV Scripts  │                                 │
│                    │  (Manual Execution)│                                │
│                    └───────────────────┘                                 │
│                              │                                           │
│                    ┌─────────▼─────────┐                                 │
│                    │   Video Sources   │                                 │
│                    │  (Prerecorded)    │                                 │
│                    └───────────────────┘                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
| Component | Technology |
|-----------|------------|
| API Framework | FastAPI |
| Database ORM | SQLAlchemy |
| Database | PostgreSQL (with SQLite fallback) |
| Authentication | Passlib with bcrypt |
| Computer Vision | YOLO (Ultralytics), OpenCV |
| Object Tracking | Custom vehicle tracker |

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router DOM 6 |
| Charts | Chart.js, Recharts |
| Maps | Leaflet, React-Leaflet |
| Icons | Lucide React |

---

## Project Structure

```
IRIS_WEB/
├── backend/                      # FastAPI backend application
│   ├── main.py                   # API endpoints and application entry
│   ├── models.py                 # SQLAlchemy database models
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── database.py               # Database connection configuration
│   ├── config.py                 # Application configuration
│   ├── seed_database.py          # Initial data seeding script
│   │
│   │  # Computer Vision Scripts
│   ├── vehicle_classifier.py     # Vehicle classification system
│   ├── vehicle_detector.py       # YOLO detection wrapper
│   ├── vehicle_tracker.py        # Object tracking logic
│   ├── prototype_headless.py     # Headless vehicle counting
│   ├── detect_accident.py        # Accident detection system
│   │
│   │  # Signal Timing
│   ├── traffic_cycle.py          # Signal timing calculator
│   ├── green_time_simulation.py  # Green time optimization logic
│   ├── db_helpers.py             # Database helper functions
│   │
│   │  # YOLO Models
│   ├── yolo11x.pt                # Primary YOLO model for vehicles
│   ├── best.pt                   # Trained model for accidents
│   │
│   │  # Test Data
│   ├── testing.mp4               # Sample test video
│   ├── video2.mp4                # Additional test video
│   ├── video211.mp4              # Additional test video
│   │
│   ├── accident_evidence/        # Saved accident evidence images
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment configuration
│
├── frontend/                     # React frontend application
│   ├── src/
│   │   ├── App.jsx               # Main application component
│   │   ├── main.jsx              # Application entry point
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # React context providers
│   │   ├── layouts/              # Page layout components
│   │   ├── pages/                # Application pages
│   │   │   ├── Landing.jsx       # Public landing page
│   │   │   ├── Login.jsx         # Authentication page
│   │   │   ├── admin/            # Admin dashboard pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── LiveTraffic.jsx
│   │   │   │   ├── SignalControl.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   ├── Alerts.jsx
│   │   │   │   ├── GreenCorridor.jsx
│   │   │   │   └── Settings.jsx
│   │   │   └── public/           # Public view pages
│   │   ├── services/             # API service functions
│   │   └── styles/               # CSS stylesheets
│   ├── package.json              # Node.js dependencies
│   └── vite.config.js            # Vite configuration
│
└── version/                      # Legacy prototype files
```

---

## Features

### Admin Dashboard
- **Dashboard Overview**: Real-time system statistics, active signals, and key metrics
- **Live Traffic View**: Interactive map with junction monitoring and traffic flow visualization
- **Signal Control**: Manual and adaptive signal timing management per junction
- **Analytics**: Historical traffic data, trends, and performance metrics visualization
- **Alerts Management**: Incident notifications, accident alerts, and system warnings
- **Green Corridor**: Emergency vehicle priority routing across multiple junctions
- **Settings**: System configuration and user management

### Public Interface
- **Landing Page**: Overview of the IRIS system and its capabilities
- **Public Traffic View**: Limited access to traffic information

### Computer Vision Capabilities
- **Vehicle Detection**: Real-time detection of vehicles using YOLO
- **Vehicle Classification**: Categorization into three classes:
  - Motorcycles / Two-wheelers
  - Light Motor Vehicles (LMV): cars, SUVs, vans
  - Heavy Motor Vehicles (HMV): trucks, buses
- **Accident Detection**: Automated accident detection with confidence scoring
- **Object Tracking**: Continuous tracking of vehicles across video frames

---

## Computer Vision Scripts

> **Important Note**: The YOLO-based Python scripts currently process **prerecorded video data** stored locally and update specific junction records in the database. The rest of the database is populated with **mock data** for development and demonstration purposes.

### Vehicle Classification (`vehicle_classifier.py`)

Classifies vehicles in video footage into three categories using YOLO object detection.

**Modes:**
- **Manual Mode**: Interactive ROI selection with visual display
- **Database Mode**: Fetches ROI and video source from database, runs headlessly

**Usage:**
```bash
# Manual mode with visual display
python vehicle_classifier.py

# Database mode (headless)
python vehicle_classifier.py --use-database --junction-id J-001 --phase 1
```

### Headless Vehicle Detection (`prototype_headless.py`)

Runs vehicle detection without GUI for server deployment.

**Usage:**
```bash
python prototype_headless.py --junction_id J-001 --phase_number 1
```

**What it does:**
1. Fetches ROI coordinates and video source from database
2. Processes video frames using YOLO
3. Tracks and counts vehicles by category
4. Saves traffic counts to the `traffic_data` table

### Accident Detection (`detect_accident.py`)

Monitors video feeds for accident detection using a trained YOLO model.

**Usage:**
```bash
python detect_accident.py --junction-id J-002

# With verbose output
python detect_accident.py --junction-id J-002 --verbose
```

**What it does:**
1. Fetches video source from database for the specified junction
2. Processes frames through accident detection model (confidence threshold: 0.75)
3. Saves evidence photos to `accident_evidence/` directory
4. Creates accident records in the `accidents` table with:
   - Timestamp of detection
   - Confidence score
   - Severity level
   - Evidence image path
   - Associated junction and camera

### Current Execution Model (Development)

These scripts must be **run manually** from the command line. Each script:
- Connects to the PostgreSQL database
- Fetches configuration (ROI, video source) from relevant tables
- Processes the prerecorded video file
- Updates the database with results

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User authentication and roles |
| `junctions` | Traffic junction information with coordinates |
| `cameras` | Camera configurations per junction |
| `signal_phases` | Phase configuration with ROI and video source |
| `signal_timings` | Signal timing configurations |
| `signal_adjacency` | Junction connectivity for routing |
| `traffic_data` | Historical vehicle counts per phase |
| `alerts` | System alerts and notifications |
| `accidents` | Detected accident records with evidence |
| `analytics_summary` | Aggregated traffic analytics |
| `system_stats` | Real-time system statistics |
| `vehicle_classification` | Cumulative vehicle classification counts |

---

## Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+ (or SQLite for development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Install YOLO dependencies
pip install ultralytics opencv-python

# Configure environment
# Edit .env file with database credentials
```

**.env Configuration:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/iris_db
ROBOFLOW_API_KEY=your_roboflow_key
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

### Database Initialization

```bash
cd backend

# Run database seeding (creates tables and initial data)
python seed_database.py
```

---

## Running the Application

### Start Backend Server

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Running CV Scripts (Manual)

```bash
cd backend

# Vehicle classification for a junction
python vehicle_classifier.py --use-database --junction-id J-001 --phase 1

# Vehicle counting (headless)
python prototype_headless.py --junction_id J-001 --phase_number 1

# Accident detection
python detect_accident.py --junction-id J-002
```

---

## API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/token` | POST | User login |

### Junctions
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/junctions` | GET | List all junctions |
| `/junctions/{id}` | GET | Get specific junction |
| `/junctions` | POST | Create junction |
| `/junctions/{id}` | PUT | Update junction |
| `/junctions/{id}` | DELETE | Delete junction |

### Traffic Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/traffic-data` | GET | Get current traffic data |
| `/traffic-data-record` | POST | Record new traffic data |
| `/traffic-data-history/{junction_id}` | GET | Get historical data |
| `/schedule` | GET | Get calculated signal timings |

### Alerts and Accidents
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/alerts` | GET | List alerts |
| `/alerts` | POST | Create alert |
| `/alerts/{id}/resolve` | PATCH | Resolve alert |
| `/accidents` | GET | List detected accidents |
| `/accidents/{id}` | GET | Get accident details |
| `/accidents/{id}/resolve` | PATCH | Resolve accident |

### Cameras and Signals
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cameras` | GET | List cameras |
| `/cameras/{id}` | GET | Get camera details |
| `/signal-timings/{junction_id}` | GET | Get signal timings |

---

## Current Limitations

- **Data Source**: CV scripts process prerecorded video files, not live camera feeds
- **Manual Execution**: YOLO scripts must be run manually from command line
- **Mock Data**: Most database records are seeded mock data for demonstration
- **Single Video Processing**: Scripts process one video/junction at a time
- **No Real-time Updates**: Frontend requires manual refresh to see updated data
- **Authentication**: Using simplified token-based auth (not production-ready JWT)

---

## Production Roadmap

### Planned Enhancements

1. **Live Camera Integration**
   - Replace prerecorded video sources with RTSP streams from traffic cameras
   - Real-time video processing with frame buffering

2. **Automated Script Execution**
   - Integration with Celery for task queuing
   - API-triggered CV script execution
   - Scheduled periodic processing jobs

3. **Real-time Data Updates**
   - WebSocket implementation for live dashboard updates
   - Automatic frontend refresh on database changes
   - Push notifications for alerts and accidents

4. **Enhanced Authentication**
   - JWT-based authentication with refresh tokens
   - Role-based access control (RBAC)
   - API key management for external integrations

5. **Scalability**
   - Multi-worker Celery deployment
   - Redis for caching and message brokering
   - Horizontal scaling for CV processing

6. **Advanced Analytics**
   - Machine learning for traffic prediction
   - Reinforcement learning for adaptive signal optimization
   - Historical trend analysis and reporting

---

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |

---

## License

Copyright (c) 2026 IRIS Development Team. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited. See the [LICENSE](LICENSE) file for details.

For licensing inquiries or partnership opportunities, please contact the development team.

---

## Contact

For questions or support, contact the IRIS development team.

"""
Seed initial data for IRIS database
"""
from database import SessionLocal, engine
import models
from datetime import datetime, date

# Create all tables
print("Creating database tables...")
models.Base.metadata.create_all(bind=engine)
print("[OK] Tables created successfully")

db = SessionLocal()

try:
    # Check if data already exists
    existing_junctions = db.query(models.Junction).count()
    if existing_junctions > 0:
        print(f"Database already has {existing_junctions} junctions. Skipping seed.")
        db.close()
        exit(0)

    print("\nSeeding junctions...")
    junctions_data = [
        {
            "id": "J-001",
            "name": "City Center",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "phases": 4,
            "status": "active",
            "mode": "adaptive",
            "nearest_hospital_name": "City General Hospital",
            "nearest_hospital_distance": 1.2,
            "nearest_hospital_eta": 4,
            "nearest_hospital_latitude": 28.6150,
            "nearest_hospital_longitude": 77.2100,
            "nearest_police_name": "Central Police Station",
            "nearest_police_distance": 0.8,
            "nearest_police_eta": 3,
            "nearest_police_latitude": 28.6148,
            "nearest_police_longitude": 77.2100
        },
        {
            "id": "J-002",
            "name": "MG Road Crossing",
            "latitude": 28.6180,
            "longitude": 77.2150,
            "phases": 4,
            "status": "active",
            "mode": "adaptive",
            "nearest_hospital_name": "MG Road Medical Center",
            "nearest_hospital_distance": 2.5,
            "nearest_hospital_eta": 7,
            "nearest_hospital_latitude": 28.6200,
            "nearest_hospital_longitude": 77.2160,
            "nearest_police_name": "MG Road Police Post",
            "nearest_police_distance": 1.1,
            "nearest_police_eta": 4,
            "nearest_police_latitude": 28.6185,
            "nearest_police_longitude": 77.2120
        },
        {
            "id": "J-003",
            "name": "Railway Station",
            "latitude": 28.6420,
            "longitude": 77.2190,
            "phases": 3,
            "status": "active",
            "mode": "default",
            "nearest_hospital_name": "Railway Hospital",
            "nearest_hospital_distance": 0.5,
            "nearest_hospital_eta": 2,
            "nearest_hospital_latitude": 28.6430,
            "nearest_hospital_longitude": 77.2200,
            "nearest_police_name": "Railway Police Station",
            "nearest_police_distance": 0.3,
            "nearest_police_eta": 1,
            "nearest_police_latitude": 28.6425,
            "nearest_police_longitude": 77.2195
        },
        {
            "id": "J-004",
            "name": "Industrial Area",
            "latitude": 28.5950,
            "longitude": 77.2400,
            "phases": 4,
            "status": "maintenance",
            "mode": "manual",
            "nearest_hospital_name": "Industrial District Hospital",
            "nearest_hospital_distance": 3.8,
            "nearest_hospital_eta": 10,
            "nearest_hospital_latitude": 28.5980,
            "nearest_hospital_longitude": 77.2420,
            "nearest_police_name": "Industrial Area Police Station",
            "nearest_police_distance": 2.2,
            "nearest_police_eta": 6,
            "nearest_police_latitude": 28.5960,
            "nearest_police_longitude": 77.2380
        },
        {
            "id": "J-005",
            "name": "Hospital Road",
            "latitude": 28.6280,
            "longitude": 77.2250,
            "phases": 4,
            "status": "active",
            "mode": "adaptive",
            "nearest_hospital_name": "Max Super Specialty Hospital",
            "nearest_hospital_distance": 0.4,
            "nearest_hospital_eta": 2,
            "nearest_hospital_latitude": 28.6290,
            "nearest_hospital_longitude": 77.2260,
            "nearest_police_name": "Greenpark Police Station",
            "nearest_police_distance": 1.5,
            "nearest_police_eta": 5,
            "nearest_police_latitude": 28.6275,
            "nearest_police_longitude": 77.2240
        },
        {
            "id": "J-006",
            "name": "Market Square",
            "latitude": 28.6350,
            "longitude": 77.2280,
            "phases": 4,
            "status": "active",
            "mode": "adaptive",
            "nearest_hospital_name": "Apollo Clinic",
            "nearest_hospital_distance": 1.8,
            "nearest_hospital_eta": 5,
            "nearest_hospital_latitude": 28.6360,
            "nearest_hospital_longitude": 77.2290,
            "nearest_police_name": "Market Police Chowki",
            "nearest_police_distance": 0.6,
            "nearest_police_eta": 2,
            "nearest_police_latitude": 28.6355,
            "nearest_police_longitude": 77.2285
        },
        {
            "id": "J-007",
            "name": "Tech Park Gate",
            "latitude": 28.5550,
            "longitude": 77.2600,
            "phases": 4,
            "status": "active",
            "mode": "adaptive",
            "nearest_hospital_name": "Tech Park Medical Center",
            "nearest_hospital_distance": 2.1,
            "nearest_hospital_eta": 6,
            "nearest_hospital_latitude": 28.5570,
            "nearest_hospital_longitude": 77.2620,
            "nearest_police_name": "Cyber City Police Station",
            "nearest_police_distance": 1.3,
            "nearest_police_eta": 4,
            "nearest_police_latitude": 28.5560,
            "nearest_police_longitude": 77.2590
        },
        {
            "id": "J-008",
            "name": "Stadium Junction",
            "latitude": 28.6100,
            "longitude": 77.2320,
            "phases": 4,
            "status": "active",
            "mode": "default",
            "nearest_hospital_name": "Sports Medicine Hospital",
            "nearest_hospital_distance": 1.6,
            "nearest_hospital_eta": 5,
            "nearest_hospital_latitude": 28.6110,
            "nearest_hospital_longitude": 77.2330,
            "nearest_police_name": "Stadium Security Office",
            "nearest_police_distance": 0.9,
            "nearest_police_eta": 3,
            "nearest_police_latitude": 28.6105,
            "nearest_police_longitude": 77.2315
        },
    ]

    for j_data in junctions_data:
        junction = models.Junction(**j_data)
        db.add(junction)
    
    db.commit()
    print(f"✓ Seeded {len(junctions_data)} junctions with emergency services data")

    # Seed cameras
    print("\nSeeding cameras...")
    cameras_data = []
    cam_counter = 1
    for j_data in junctions_data:
        for phase in range(1, j_data["phases"] + 1):
            cameras_data.append({
                "id": f"CAM-{cam_counter:03d}",
                "junction_id": j_data["id"],
                "phase": phase,
                "status": "online"
            })
            cam_counter += 1

    for c_data in cameras_data:
        camera = models.Camera(**c_data)
        db.add(camera)
    
    db.commit()
    print(f"✓ Seeded {len(cameras_data)} cameras")

    # Seed default signal timings
    print("\nSeeding signal timings...")
    timings_data = []
    for j_data in junctions_data:
        if j_data["phases"] == 4:
            default_timings = [45, 30, 45, 30]
        else:  # 3 phases
            default_timings = [50, 40, 50]
        
        for phase_num, green_time in enumerate(default_timings, 1):
            timings_data.append({
                "junction_id": j_data["id"],
                "phase": phase_num,
                "green_time": green_time,
                "yellow_time": 3,
                "red_time": sum(default_timings) - green_time,
                "is_default": True
            })

    for t_data in timings_data:
        timing = models.SignalTiming(**t_data)
        db.add(timing)
    
    db.commit()
    print(f"✓ Seeded {len(timings_data)} signal timings")

    # Seed signal phases with ROI coordinates and video sources
    print("\nSeeding signal phases with ROI coordinates...")
    phases_data = []
    for j_data in junctions_data:
        for phase_num in range(1, j_data["phases"] + 1):
            # Sample ROI coordinates (these should be customized per junction/phase in production)
            # Format: top-left (x1, y1) to bottom-right (x2, y2)
            phases_data.append({
                "junction_id": j_data["id"],
                "phase_number": phase_num,
                "lane_count": 2 if phase_num % 2 == 0 else 3,  # Alternating lane counts
                "default_timer_sec": 30,
                # Sample ROI coordinates - should be configured based on actual camera view
                "roi_x1": 100 + (phase_num * 50),
                "roi_y1": 200 + (phase_num * 30),
                "roi_x2": 800 + (phase_num * 50),
                "roi_y2": 600 + (phase_num * 30),
                # Video source - using video2.mp4 for testing (should be per-camera in production)
                "video_source": "video2.mp4"
            })

    for p_data in phases_data:
        phase = models.SignalPhase(**p_data)
        db.add(phase)
    
    db.commit()
    print(f"✓ Seeded {len(phases_data)} signal phases with ROI coordinates")

    # Seed some sample alerts
    print("\nSeeding sample alerts...")
    alerts_data = [
        {
            "junction_id": "J-001",
            "type": "violation",
            "severity": "warning",
            "message": "Signal violation detected at Junction 1",
            "status": "active"
        },
        {
            "junction_id": "J-002",
            "type": "incident",
            "severity": "danger",
            "message": "Accident reported near MG Road",
            "status": "active"
        },
        {
            "junction_id": "J-008",
            "type": "maintenance",
            "severity": "warning",
            "message": "Camera offline at Junction 8",
            "status": "active"
        }
    ]

    for a_data in alerts_data:
        alert = models.Alert(**a_data)
        db.add(alert)
    
    db.commit()
    print(f"✓ Seeded {len(alerts_data)} alerts")

    # Initialize system stats
    print("\nInitializing system stats...")
    system_stats = models.SystemStats(
        active_signals=7,  # 7 active junctions (excluding J-004 which is in maintenance)
        avg_wait_time=32.0,
        co2_saved_today=2.4,
        incidents_today=3
    )
    db.add(system_stats)
    db.commit()
    print("✓ System stats initialized")

    print("\n" + "="*50)
    print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print("="*50)
    print(f"Junctions: {len(junctions_data)}")
    print(f"Cameras: {len(cameras_data)}")
    print(f"Signal Timings: {len(timings_data)}")
    print(f"Signal Phases: {len(phases_data)}")
    print(f"Alerts: {len(alerts_data)}")
    print(f"System Stats: 1")

except Exception as e:
    print(f"\n✗ Error during seeding: {e}")
    db.rollback()
    raise
finally:
    db.close()

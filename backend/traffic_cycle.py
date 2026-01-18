import green_time_simulation as gts
from database import SessionLocal
from models import TrafficData, SignalPhase
from sqlalchemy import func

def calculate_schedule(junction_id="J-001"):
    """
    Calculates the traffic light schedule using real-time data from database.
    
    Args:
        junction_id (str): Junction ID to calculate schedule for
    
    Returns:
        schedule list or raises an exception on error.
    """
    db = SessionLocal()
    
    try:
        # Get number of phases for this junction
        phases = db.query(SignalPhase).filter(
            SignalPhase.junction_id == junction_id
        ).all()
        
        if not phases:
            raise ValueError(f"No phases found for junction {junction_id}")
        
        num_phases = len(phases)
        d_value_hardcoded = 10.0  # meters/feet
        
        # Get lane counts from signal_phases table
        lanes_per_phase = [phase.lane_count for phase in sorted(phases, key=lambda p: p.phase_number)]
        
        # Initialize lists to store data for each phase
        raw_phase_vehicle_counts = []
        
        # Query latest traffic data for each phase
        for phase_num in range(1, num_phases + 1):
            # Get the most recent traffic count for this phase
            latest_data = db.query(TrafficData).filter(
                TrafficData.junction_id == junction_id,
                TrafficData.phase == phase_num
            ).order_by(TrafficData.timestamp.desc()).first()
            
            if latest_data:
                two_wheelers = latest_data.two_wheelers
                light_motor_vehicles = latest_data.light_vehicles
                heavy_motor_vehicles = latest_data.heavy_vehicles
            else:
                # Default values if no data exists
                two_wheelers = 0
                light_motor_vehicles = 0
                heavy_motor_vehicles = 0
            
            raw_phase_vehicle_counts.append({
                'd': d_value_hardcoded,
                'two_wheelers': two_wheelers,
                'light_motor_vehicles': light_motor_vehicles,
                'heavy_motor_vehicles': heavy_motor_vehicles
            })

        # Convert raw vehicle counts into the format expected by green_time_simulation
        formatted_phases_data = []
        for phase_counts in raw_phase_vehicle_counts:
            vehicles_for_phase = gts.convert_raw_to_vehicle_data(
                phase_counts['d'],
                phase_counts['two_wheelers'],
                phase_counts['light_motor_vehicles'],
                phase_counts['heavy_motor_vehicles']
            )
            formatted_phases_data.append(vehicles_for_phase)

        # --- Simulation Parameters ---
        p_service_fraction = 0.8  # Target service fraction
        T_red_interval = 60.0  # Red interval time

        # Run the simulation cycle
        schedule = gts.run_cycle(
            formatted_phases_data,
            p_service_fraction,
            T_red_interval,
            lanes_per_phase
        )
        
        return schedule
    
    finally:
        db.close()


def main():
    print("--- Traffic Light Simulation Setup ---")
    try:
        schedule = calculate_schedule()
        
        # Display the calculated schedule
        print("\n--- Calculated Traffic Light Schedule ---")
        print("{:<18} {:<15} {:<15} {:<15} {:<25}".format(
            "Traffic Light No.", "Green (s)", "Yellow (s)", "Red (s)", "Clearance (%)"
        ))
        print("-" * 90)
        for s in schedule:
            print("{:<18} {:<15.2f} {:<15.2f} {:<15.2f} {:<25.2f}".format(
                s['traffic_light_no'], s['G'], s['Y'], s['R'], s['percentage_clearance']
            ))
        print("-" * 90)

        # Verification (from green_time_simulation, adapted for new schedule structure)
        if schedule:
            # Note: total_cycle is consistent across all phases in the schedule
            total_cycle_calculated = schedule[0]['G'] + schedule[0]['Y'] + schedule[0]['R']
            num_phases_in_schedule = len(schedule)
            expected_total_cycle = sum(s['G'] for s in schedule) + \
                                   num_phases_in_schedule * gts.YELLOW_TIME + \
                                   num_phases_in_schedule * gts.ALL_RED_TIME
            
            print(f"\nCalculated Total Cycle Time based on first phase: {total_cycle_calculated:.2f}s")
            print(f"Expected Total Cycle Time (Sum of all G + n*Y + n*AR): {expected_total_cycle:.2f}s")
            if abs(total_cycle_calculated - expected_total_cycle) < 0.01:
                print("Total cycle time calculations are consistent.")
            else:
                print("Warning: Total cycle time calculations are inconsistent. Check logic.")

    except Exception as e:
        print(f"Error during simulation: {e}")

if __name__ == "__main__":
    main()

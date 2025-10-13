import green_time_simulation as gts

def main():
    print("--- Traffic Light Simulation Setup ---")

    # Hardcoded values as per request
    num_phases = 4
    d_value_hardcoded = 10.0 # meters/feet
    # Hardcoded lanes for each phase (e.g., [2, 3, 2, 1] for 4 phases)
    # Make sure this list has exactly 'num_phases' elements.
    hardcoded_lanes_per_phase = [2, 3, 2, 1] 

    # Initialize lists to store data for each phase
    raw_phase_vehicle_counts = [] # To store counts like two_wheelers, etc.

    data_file = "vehicle_data.txt"

    # Validate that hardcoded_lanes_per_phase matches num_phases
    if len(hardcoded_lanes_per_phase) != num_phases:
        print(f"Error: The number of hardcoded lanes ({len(hardcoded_lanes_per_phase)}) does not match the total number of phases ({num_phases}). Please adjust `hardcoded_lanes_per_phase`.")
        return

    try:
        with open(data_file, 'r') as f:
            lines = f.readlines()
            if len(lines) != num_phases:
                raise ValueError(f"Expected {num_phases} lines in {data_file}, but found {len(lines)}. Please ensure the file has data for all 4 phases.")

            for i, line in enumerate(lines):
                parts = line.strip().split(',')
                # Now expecting only 3 parts: two_wheelers, light_motor_vehicles, heavy_motor_vehicles
                if len(parts) != 3:
                    raise ValueError(f"Invalid data format in line {i+1} of {data_file}. Expected 'two_wheelers,light_motor_vehicles,heavy_motor_vehicles'.")

                try:
                    two_wheelers = int(parts[0])
                    light_motor_vehicles = int(parts[1])
                    heavy_motor_vehicles = int(parts[2])

                    if any(val < 0 for val in [two_wheelers, light_motor_vehicles, heavy_motor_vehicles]):
                        raise ValueError(f"Vehicle counts for phase {i+1} cannot be negative.")

                    raw_phase_vehicle_counts.append({
                        'd': d_value_hardcoded, # Using the hardcoded distance
                        'two_wheelers': two_wheelers,
                        'light_motor_vehicles': light_motor_vehicles,
                        'heavy_motor_vehicles': heavy_motor_vehicles
                    })
                except ValueError as e:
                    print(f"Error parsing data for Phase {i+1} from {data_file}: {e}")
                    return # Exit if data parsing fails

    except FileNotFoundError:
        print(f"Error: The file '{data_file}' was not found. Please create it with vehicle data.")
        return
    except Exception as e:
        print(f"An unexpected error occurred while reading {data_file}: {e}")
        return

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

    # --- Simulation Parameters (can be made user-input too if desired) ---
    p_service_fraction = 0.8 # Target service fraction
    T_red_interval = 60.0 # Red interval time (for theoretical arrival rate, not direct G calc)

    print("\nCalculating traffic light schedule...")

    # Run the simulation cycle, passing the hardcoded_lanes_per_phase
    schedule = gts.run_cycle(
        formatted_phases_data,
        p_service_fraction,
        T_red_interval,
        hardcoded_lanes_per_phase # Use the hardcoded lanes list here
    )

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


if __name__ == "__main__":
    main()
# green_time_simulation.py

import math
import random # Kept for potential future random generation or if 'x' values vary randomly

# --- Constants ---
YELLOW_TIME = 3.0
ALL_RED_TIME = 1.0 # Time for all lights to be red between phases (clearance)

# Typical saturation flow rate for a single lane in PCU per second (e.g., 1800 PCU/hour / 3600 sec/hour = 0.5 PCU/sec)
SATURATION_FLOW_RATE_PER_LANE = 0.5 # PCU per second per lane

# Start-up lost time per phase (in seconds). This accounts for the initial delay for vehicles to start moving efficiently.
START_UP_LOST_TIME_PER_PHASE = 3.0 # seconds (typical range 2-4 seconds)

# Headway calibration by vehicle class (still used in individual vehicle data structure for completeness, but not direct in G calculation)
CALIBRATION_FACTORS = {
    'two_wheeler': 0.8,
    'light_motor_vehicle': 1.0,
    'heavy_motor_vehicle': 1.5
}

# Average starting velocity for each vehicle type (meters/second or feet/second)
AVERAGE_STARTING_VELOCITIES = {
    'two_wheeler': 4.0,
    'light_motor_vehicle': 5.0,
    'heavy_motor_vehicle': 3.5
}

# Passenger Car Equivalent (PCE) values for each vehicle type
PCE_VALUES = {
    'two_wheeler': 0.5,
    'light_motor_vehicle': 1.0,
    'heavy_motor_vehicle': 2.5
}


# --- Functions ---

def calibrate_headways(vehicles, calibration_factors):
    """
    Calibrates the headway for each vehicle based on its class.
    NOTE: In the multi-lane model, this primarily affects simulated vehicle data,
    but the primary green time calculation uses saturation flow rate directly,
    making individual 'h' values less critical for 'G'.
    """
    for v in vehicles:
        factor = calibration_factors.get(v.get('class'), 1.0)
        v['h'] *= factor
    return vehicles

def compute_green_time(vehicles, p, T_red, num_lanes):
    """
    Computes the required green time G for a phase based on the provided
    vehicles, target service fraction p, and number of lanes, using saturation flow rate.

    Args:
        vehicles (list): A list of dictionaries, each representing a vehicle.
        p (float): The target service fraction (proportion of vehicles to clear).
                   Expected range [0.8, 1.0].
        T_red (float): The red interval time (for arrival rate definition, not directly used in G).
        num_lanes (int): The number of active lanes for this phase.

    Returns:
        tuple: (Calculated green time G in seconds, N_tot, N_targ).
               N_tot and N_targ are returned for contextual output.
    """
    # N_equiv is total equivalent demand in the queue
    N_equiv = sum(v['e'] for v in vehicles)
    N_arr = N_equiv # Assuming N_arr = N_equiv for simplicity in this model
    N_tot = N_equiv + N_arr # Total equivalent traffic demand
    N_targ = min(N_tot, p * N_tot) # Target equivalent vehicles to clear

    # Handle cases with no demand or no lanes
    if N_targ <= 0 or num_lanes <= 0:
        return 0.0, N_tot, N_targ

    total_saturation_flow = SATURATION_FLOW_RATE_PER_LANE * num_lanes
    time_to_clear_vehicles = N_targ / total_saturation_flow

    G = START_UP_LOST_TIME_PER_PHASE + time_to_clear_vehicles
    G = max(G, 0.0) # Ensure green time is not negative

    return G, N_tot, N_targ


def enforce_cycle_cap(green_times_info, n_phases, max_per_phase=150):
    """
    Enforces a global cycle time cap on the sum of green times.
    'green_times_info' is a list of (G_val, N_tot, N_targ) tuples.
    """
    G_vals = [info[0] for info in green_times_info]
    
    cap = n_phases * max_per_phase
    capped_G_vals = [min(G, max_per_phase) for G in G_vals]
    total_capped_G = sum(capped_G_vals)

    if total_capped_G <= cap:
        return [(capped_G_vals[i], green_times_info[i][1], green_times_info[i][2]) 
                for i in range(n_phases)]
    else:
        scale = cap / total_capped_G
        scaled_greens_info = []
        for i in range(n_phases):
            original_G, N_tot, N_targ = green_times_info[i]
            scaled_G = original_G * scale
            scaled_greens_info.append((scaled_G, N_tot, N_targ))
        return scaled_greens_info

def schedule_phases(phases_data, p, T_red, num_lanes_per_phase, max_per_phase=150):
    """
    Schedules the green, yellow, red, and all-red times for all traffic phases,
    incorporating all-red clearance intervals.

    Args:
        phases_data (list): A list of lists, each inner list representing a phase's vehicles.
        p (float): The target service fraction.
        T_red (float): The red interval time.
        num_lanes_per_phase (list): List of integers, number of lanes for each phase.
        max_per_phase (float): Maximum allowed green time per phase.

    Returns:
        list: The calculated schedule for all phases.
    """
    n_phases = len(phases_data)
    
    # Calibrate headways if necessary (though less critical for G in this model)
    calibrated_phases = [calibrate_headways(list(ph), CALIBRATION_FACTORS) for ph in phases_data]
    
    # --- Handling Single Active Phase ---
    # Need to get demands to check for active phases
    demands = [sum(v['e'] for v in ph) for ph in calibrated_phases]
    active_phases_indices = [i for i, d in enumerate(demands) if d > 0]

    # Special case: only one phase has demand
    if len(active_phases_indices) == 1:
        idx = active_phases_indices[0]
        # Call compute_green_time with relevant phase data and its lane count
        G, N_tot, N_targ = compute_green_time(
            calibrated_phases[idx], p, T_red, num_lanes_per_phase[idx]
        )
        
        schedule = []
        for i in range(n_phases):
            percentage_clearance = p * 100 if N_tot > 0 else 0.0
            if i == idx:
                schedule.append({
                    'traffic_light_no': i + 1,
                    'G': G,
                    'Y': YELLOW_TIME,
                    'R': 0.0, # This phase is active, others are red
                    'percentage_clearance': percentage_clearance
                })
            else:
                # Other phases are red for the active phase's G+Y + all other All-Red times
                # This ensures the total cycle concept holds even if only one phase is running.
                schedule.append({
                    'traffic_light_no': i + 1,
                    'G': 0.0,
                    'Y': 0.0,
                    'R': G + YELLOW_TIME + (n_phases - 1) * ALL_RED_TIME,
                    'percentage_clearance': 0.0 # No clearance if not active
                })
        return schedule


    # --- For multiple active phases ---
    # raw_green_info now includes (G_val, N_tot, N_targ)
    raw_green_info = [
        compute_green_time(calibrated_phases[i], p, T_red, num_lanes_per_phase[i])
        for i in range(n_phases)
    ]
    
    # Enforce the global cycle capacity on green times
    greens_info = enforce_cycle_cap(raw_green_info, n_phases, max_per_phase)
    
    # Extract just the green values for total_cycle calculation
    greens_only = [info[0] for info in greens_info]

    total_cycle = sum(greens_only) + (n_phases * YELLOW_TIME) + (n_phases * ALL_RED_TIME)

    schedule = []
    for i, (G_val, N_tot, N_targ) in enumerate(greens_info):
        R_val = total_cycle - G_val - YELLOW_TIME - ALL_RED_TIME
        
        percentage_clearance = p * 100 if N_tot > 0 else 0.0 # Based on target 'p'
        
        schedule.append({
            'traffic_light_no': i + 1,
            'G': G_val,
            'Y': YELLOW_TIME,
            'R': R_val,
            'percentage_clearance': percentage_clearance
        })
    return schedule

def run_cycle(phases_data, p, T_red, num_lanes_per_phase):
    """
    Runs a single traffic light cycle simulation.

    Args:
        phases_data (list): Formatted list of lists of vehicle data for each phase.
        p (float): The target service fraction.
        T_red (float): The red interval time.
        num_lanes_per_phase (list): List of integers, number of lanes for each phase.

    Returns:
        list: The calculated schedule for all phases.
    """
    # schedule_phases now directly accepts the prepared phases_data
    return schedule_phases(phases_data, p, T_red, num_lanes_per_phase)


# Helper function to convert raw counts to the expected vehicle data structure
def convert_raw_to_vehicle_data(d_value, two_wheelers, light_motor_vehicles, heavy_motor_vehicles):
    """
    Converts raw vehicle counts for a phase into the detailed vehicle data structure
    expected by the green time calculation functions.
    """
    phase_vehicles = []
    
    # Add two-wheelers
    for k in range(two_wheelers):
        phase_vehicles.append({
            'class': 'two_wheeler',
            'e': PCE_VALUES['two_wheeler'],
            'x': 0.5 if k > 0 else 2.0, # Startup delay logic for first vehicle
            'h': random.uniform(2.0, 3.0), # Base headway (will be calibrated by PCE and factors)
            'd': d_value,
            'v': AVERAGE_STARTING_VELOCITIES['two_wheeler']
        })
    
    # Add light motor vehicles
    for k in range(light_motor_vehicles):
        phase_vehicles.append({
            'class': 'light_motor_vehicle',
            'e': PCE_VALUES['light_motor_vehicle'],
            'x': 0.5 if k > 0 else 2.0,
            'h': random.uniform(2.0, 3.0),
            'd': d_value,
            'v': AVERAGE_STARTING_VELOCITIES['light_motor_vehicle']
        })

    # Add heavy motor vehicles
    for k in range(heavy_motor_vehicles):
        phase_vehicles.append({
            'class': 'heavy_motor_vehicle',
            'e': PCE_VALUES['heavy_motor_vehicle'],
            'x': 0.5 if k > 0 else 2.0,
            'h': random.uniform(2.0, 3.0),
            'd': d_value,
            'v': AVERAGE_STARTING_VELOCITIES['heavy_motor_vehicle']
        })
    
    # Sort for consistency, although less critical with saturation flow
    phase_vehicles.sort(key=lambda v: (v['x'], v['d']))
    
    return phase_vehicles

# No _main_ block needed here anymore, as main.py will drive the execution.
# The original _main_ block content is moved to main.py or removed.
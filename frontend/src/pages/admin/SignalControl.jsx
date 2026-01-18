import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Camera, Settings, Clock, X, Check, ChevronDown, AlertTriangle, Route, Loader } from 'lucide-react'
import { useCorridor } from '../../context/CorridorContext'
import { Link } from 'react-router-dom'
import './SignalControl.css'
import { junctionsAPI, camerasAPI } from '../../services/api'

// Constants
const YELLOW_TIME = 3 // Yellow is always 3 seconds
const ALL_RED_TIME_PER_PHASE = 1 // All-red time is 1 second per phase

// Generate phase details from green times
const generatePhaseDetails = (greenTimes, numPhases) => {
    const totalGreen = greenTimes.reduce((a, b) => a + b, 0)
    const totalYellow = numPhases * YELLOW_TIME
    const allRedTime = numPhases * ALL_RED_TIME_PER_PHASE

    return greenTimes.map((green, index) => {
        // Red time for this phase = total cycle time - this phase's green - this phase's yellow
        const otherGreenTime = totalGreen - green
        const otherYellowTime = (numPhases - 1) * YELLOW_TIME
        const red = otherGreenTime + otherYellowTime + allRedTime
        return { green, yellow: YELLOW_TIME, red }
    })
}

// Sample junction data with phase-wise timing details and location
const initialJunctions = [
    {
        id: 'J-001',
        name: 'City Center',
        phases: 4,
        cameras: ['CAM-001', 'CAM-002', 'CAM-003', 'CAM-004'],
        greenTimes: [40, 25, 40, 25],
        status: 'active',
        mode: 'adaptive',
        location: { lat: 12.9716, lng: 77.5946 }
    },
    {
        id: 'J-002',
        name: 'MG Road Crossing',
        phases: 4,
        cameras: ['CAM-005', 'CAM-006', 'CAM-007', 'CAM-008'],
        greenTimes: [35, 30, 35, 30],
        status: 'active',
        mode: 'adaptive',
        location: { lat: 12.9756, lng: 77.6066 }
    },
    {
        id: 'J-003',
        name: 'Railway Station',
        phases: 3,
        cameras: ['CAM-009', 'CAM-010', 'CAM-011'],
        greenTimes: [45, 35, 45],
        status: 'active',
        mode: 'default',
        location: { lat: 12.9779, lng: 77.5728 }
    },
    {
        id: 'J-004',
        name: 'Industrial Area',
        phases: 4,
        cameras: ['CAM-012', 'CAM-013', 'CAM-014', 'CAM-015'],
        greenTimes: [30, 20, 30, 20],
        status: 'maintenance',
        mode: 'manual',
        manualGreenTimes: [30, 20, 30, 20],
        location: { lat: 12.9850, lng: 77.6150 }
    },
    {
        id: 'J-005',
        name: 'Hospital Road',
        phases: 4,
        cameras: ['CAM-016', 'CAM-017', 'CAM-018', 'CAM-019'],
        greenTimes: [35, 25, 35, 25],
        status: 'active',
        mode: 'adaptive',
        location: { lat: 12.9600, lng: 77.5800 }
    },
    {
        id: 'J-006',
        name: 'Tech Park Gate',
        phases: 4,
        cameras: ['CAM-020', 'CAM-021', 'CAM-022', 'CAM-023'],
        greenTimes: [30, 30, 30, 30],
        status: 'active',
        mode: 'default',
        location: { lat: 12.9680, lng: 77.6200 }
    },
    {
        id: 'J-007',
        name: 'Stadium Junction',
        phases: 4,
        cameras: ['CAM-024', 'CAM-025', 'CAM-026', 'CAM-027'],
        greenTimes: [35, 25, 35, 25],
        status: 'active',
        mode: 'adaptive',
        location: { lat: 12.9550, lng: 77.5900 }
    },
    {
        id: 'J-008',
        name: 'Market Square',
        phases: 4,
        cameras: ['CAM-028', 'CAM-029', 'CAM-030', 'CAM-031'],
        greenTimes: [40, 20, 40, 20],
        status: 'active',
        mode: 'default',
        location: { lat: 12.9620, lng: 77.6100 }
    },
]

// Available camera devices
const availableCameras = [
    'CAM-001', 'CAM-002', 'CAM-003', 'CAM-004', 'CAM-005',
    'CAM-006', 'CAM-007', 'CAM-008', 'CAM-009', 'CAM-010',
    'CAM-011', 'CAM-012', 'CAM-013', 'CAM-014', 'CAM-015',
    'CAM-016', 'CAM-017', 'CAM-018', 'CAM-019', 'CAM-020',
]

// Calculate total cycle time
// Total = sum of all green times + sum of all yellow times + all-red time
const calculateTotalCycleTime = (junction) => {
    const greenTimes = junction.mode === 'manual' && junction.manualGreenTimes
        ? junction.manualGreenTimes
        : junction.greenTimes
    const totalGreen = greenTimes.reduce((a, b) => a + b, 0)
    const totalYellow = junction.phases * YELLOW_TIME
    const allRedTime = junction.phases * ALL_RED_TIME_PER_PHASE
    return totalGreen + totalYellow + allRedTime
}

// Get phase details for a junction
const getPhaseDetails = (junction) => {
    const greenTimes = junction.mode === 'manual' && junction.manualGreenTimes
        ? junction.manualGreenTimes
        : junction.greenTimes
    return generatePhaseDetails(greenTimes, junction.phases)
}

export default function SignalControl() {
    const { activeCorridor, corridorStatus, isJunctionInCorridor, getJunctionPhaseState } = useCorridor()
    const [junctions, setJunctions] = useState([])
    const [availableCameras, setAvailableCameras] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showManualModal, setShowManualModal] = useState(false)
    const [editingJunction, setEditingJunction] = useState(null)
    const [selectedJunction, setSelectedJunction] = useState(null)
    const [openDropdownId, setOpenDropdownId] = useState(null)

    // Fetch junctions and cameras on mount
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [junctionsData, camerasData] = await Promise.all([
                junctionsAPI.getAll(),
                camerasAPI.getAll()
            ])

            // Map junctions from API to component format
            const mappedJunctions = junctionsData.map(j => ({
                id: j.id,
                name: j.name,
                phases: j.total_phases || 4,
                cameras: [], // Will be populated from cameras API
                greenTimes: Array(j.total_phases || 4).fill(30),
                status: j.status || 'active',
                mode: 'adaptive',
                location: {
                    lat: parseFloat(j.latitude) || 12.9716,
                    lng: parseFloat(j.longitude) || 77.5946
                }
            }))

            // Map cameras to junctions
            camerasData.forEach(cam => {
                const junction = mappedJunctions.find(j => j.id === cam.junction_id)
                if (junction) {
                    junction.cameras.push(cam.id)
                }
            })

            setJunctions(mappedJunctions)
            setAvailableCameras(camerasData.map(c => c.id))
            if (mappedJunctions.length > 0) {
                setSelectedJunction(mappedJunctions[0])
            }
        } catch (err) {
            console.error('Failed to fetch data:', err)
            // Fall back to default data if API fails
            setJunctions(initialJunctions)
            setAvailableCameras(['CAM-001', 'CAM-002', 'CAM-003', 'CAM-004'])
            setSelectedJunction(initialJunctions[0])
        } finally {
            setLoading(false)
        }
    }

    // Timer states - always running
    const [activePhase, setActivePhase] = useState(0)
    const [currentLight, setCurrentLight] = useState('green') // 'green', 'yellow', 'red'
    const [timeRemaining, setTimeRemaining] = useState(0)
    const timerRef = useRef(null)
    const dropdownRef = useRef(null)

    // Get the current light state for a specific phase
    const getPhaseLight = (phaseIndex) => {
        if (phaseIndex === activePhase) {
            return currentLight // Active phase shows green/yellow/red based on timer
        }
        return 'red' // All other phases are red
    }

    // Get remaining red time for inactive phases
    const getRedTimeRemaining = (phaseIndex, phaseDetails) => {
        if (phaseIndex === activePhase) return null

        // Calculate how much time until this phase becomes green
        let timeUntilGreen = 0

        if (phaseIndex > activePhase) {
            // Phase is coming up - add remaining time of current phase + all phases in between
            if (currentLight === 'green') {
                timeUntilGreen += timeRemaining + YELLOW_TIME + ALL_RED_TIME_PER_PHASE
            } else if (currentLight === 'yellow') {
                timeUntilGreen += timeRemaining + ALL_RED_TIME_PER_PHASE
            } else {
                timeUntilGreen += timeRemaining
            }

            // Add time for phases between current and target
            for (let i = activePhase + 1; i < phaseIndex; i++) {
                timeUntilGreen += phaseDetails[i].green + YELLOW_TIME + ALL_RED_TIME_PER_PHASE
            }
        } else {
            // Phase already passed - need to go through remaining phases + wrap around
            if (currentLight === 'green') {
                timeUntilGreen += timeRemaining + YELLOW_TIME + ALL_RED_TIME_PER_PHASE
            } else if (currentLight === 'yellow') {
                timeUntilGreen += timeRemaining + ALL_RED_TIME_PER_PHASE
            } else {
                timeUntilGreen += timeRemaining
            }

            // Add remaining phases till end
            for (let i = activePhase + 1; i < phaseDetails.length; i++) {
                timeUntilGreen += phaseDetails[i].green + YELLOW_TIME + ALL_RED_TIME_PER_PHASE
            }

            // Add phases from start to target
            for (let i = 0; i < phaseIndex; i++) {
                timeUntilGreen += phaseDetails[i].green + YELLOW_TIME + ALL_RED_TIME_PER_PHASE
            }
        }

        return timeUntilGreen
    }

    // Manual mode form data - only green times per phase
    const [manualFormData, setManualFormData] = useState({
        id: '',
        junctionName: '',
        greenTimes: []
    })

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phases: 4,
        cameras: ['', '', '', ''],
        greenTimes: [30, 30, 30, 30]
    })

    // Initialize and auto-start timer when junction is selected
    useEffect(() => {
        if (selectedJunction) {
            const phaseDetails = getPhaseDetails(selectedJunction)
            setActivePhase(0)
            setCurrentLight('green')
            setTimeRemaining(phaseDetails[0].green)
        }
    }, [selectedJunction?.id, selectedJunction?.mode, selectedJunction?.manualGreenTimes])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Timer logic - always running
    useEffect(() => {
        if (selectedJunction) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        const phaseDetails = getPhaseDetails(selectedJunction)

                        if (currentLight === 'green') {
                            setCurrentLight('yellow')
                            return YELLOW_TIME
                        } else if (currentLight === 'yellow') {
                            setCurrentLight('red')
                            return ALL_RED_TIME_PER_PHASE // All-red time
                        } else {
                            // Move to next phase
                            const nextPhase = (activePhase + 1) % selectedJunction.phases
                            setActivePhase(nextPhase)
                            setCurrentLight('green')
                            return phaseDetails[nextPhase].green
                        }
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(timerRef.current)
    }, [currentLight, activePhase, selectedJunction])

    // Mode switching handler
    const handleModeChange = (junctionId, newMode) => {
        const junction = junctions.find(j => j.id === junctionId)

        if (newMode === 'manual') {
            // Open manual modal to set green times
            setManualFormData({
                id: junction.id,
                junctionName: junction.name,
                greenTimes: junction.manualGreenTimes || [...junction.greenTimes]
            })
            setShowManualModal(true)
        } else {
            setJunctions(junctions.map(j =>
                j.id === junctionId ? { ...j, mode: newMode } : j
            ))
            if (selectedJunction?.id === junctionId) {
                setSelectedJunction({ ...junction, mode: newMode })
            }
        }
    }

    // Manual modal submit handler
    const handleManualSubmit = (e) => {
        e.preventDefault()
        const junctionId = manualFormData.id

        const updatedJunction = junctions.find(j => j.id === junctionId)
        const newJunction = {
            ...updatedJunction,
            mode: 'manual',
            manualGreenTimes: [...manualFormData.greenTimes]
        }

        setJunctions(junctions.map(j =>
            j.id === junctionId ? newJunction : j
        ))

        if (selectedJunction?.id === junctionId) {
            setSelectedJunction(newJunction)
        }

        setShowManualModal(false)
    }

    const openAddModal = () => {
        setEditingJunction(null)
        setFormData({
            name: '',
            phases: 4,
            cameras: ['', '', '', ''],
            greenTimes: [30, 30, 30, 30]
        })
        setShowModal(true)
    }

    const openEditModal = (junction) => {
        setEditingJunction(junction)
        setFormData({
            name: junction.name,
            phases: junction.phases,
            cameras: [...junction.cameras],
            greenTimes: [...junction.greenTimes]
        })
        setShowModal(true)
    }

    const handlePhaseChange = (count) => {
        const phases = parseInt(count)
        setFormData({
            ...formData,
            phases,
            cameras: Array(phases).fill(''),
            greenTimes: Array(phases).fill(30)
        })
    }

    const handleCameraChange = (index, value) => {
        const newCameras = [...formData.cameras]
        newCameras[index] = value
        setFormData({ ...formData, cameras: newCameras })
    }

    const handleGreenTimeChange = (index, value) => {
        const newGreenTimes = [...formData.greenTimes]
        newGreenTimes[index] = parseInt(value) || 0
        setFormData({ ...formData, greenTimes: newGreenTimes })
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (editingJunction) {
            const updated = {
                ...editingJunction,
                name: formData.name,
                phases: formData.phases,
                cameras: formData.cameras,
                greenTimes: formData.greenTimes
            }
            setJunctions(junctions.map(j =>
                j.id === editingJunction.id ? updated : j
            ))
            if (selectedJunction?.id === editingJunction.id) {
                setSelectedJunction(updated)
            }
        } else {
            const newJunction = {
                id: `J-${String(junctions.length + 1).padStart(3, '0')}`,
                name: formData.name,
                phases: formData.phases,
                cameras: formData.cameras,
                greenTimes: formData.greenTimes,
                status: 'active',
                mode: 'adaptive'
            }
            setJunctions([...junctions, newJunction])
        }

        setShowModal(false)
    }

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this junction?')) {
            setJunctions(junctions.filter(j => j.id !== id))
            if (selectedJunction?.id === id) {
                setSelectedJunction(junctions[0] || null)
            }
        }
    }

    // Get current phase details for selected junction
    const currentPhaseDetails = selectedJunction ? getPhaseDetails(selectedJunction) : []

    // Check if selected junction is in corridor
    const isSelectedInCorridor = selectedJunction ? isJunctionInCorridor(selectedJunction.id) : false
    const selectedCorridorPhase = selectedJunction ? getJunctionPhaseState(selectedJunction.id) : null

    return (
        <div className="signal-control">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Signal Control</h1>
                    <p className="page-subtitle">Manage junctions, cameras, and signal timing</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={18} />
                    Add Junction
                </button>
            </header>

            {/* Active Corridor Banner */}
            {corridorStatus === 'active' && activeCorridor && (
                <div className="corridor-active-banner">
                    <div className="corridor-banner-content">
                        <Route size={20} />
                        <div className="corridor-banner-text">
                            <strong>🚨 Green Corridor Active</strong>
                            <span>
                                {activeCorridor.junctions.length} junctions: {activeCorridor.junctions.map(j => j.name).join(' → ')}
                            </span>
                        </div>
                        <Link to="/admin/green-corridor" className="btn btn-sm btn-secondary">
                            View Corridor
                        </Link>
                    </div>
                </div>
            )}

            <div className="signal-control-grid">
                {/* Junctions Table */}
                <div className="card junctions-table-card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Junction Name</th>
                                    <th>Phases</th>
                                    <th>Cycle Time</th>
                                    <th>Mode</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {junctions.map((junction) => {
                                    const inCorridor = isJunctionInCorridor(junction.id)
                                    return (
                                        <tr
                                            key={junction.id}
                                            className={`${selectedJunction?.id === junction.id ? 'selected' : ''} ${inCorridor ? 'in-corridor' : ''}`}
                                            onClick={() => setSelectedJunction(junction)}
                                        >
                                            <td>
                                                <strong>{junction.id}</strong>
                                                {inCorridor && <span className="corridor-badge">🚨</span>}
                                            </td>
                                            <td>{junction.name}</td>
                                            <td>{junction.phases}</td>
                                            <td><span className="cycle-time">{calculateTotalCycleTime(junction)}s</span></td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className="custom-dropdown" ref={openDropdownId === junction.id ? dropdownRef : null}>
                                                    <button
                                                        className={`dropdown-trigger ${junction.mode}`}
                                                        onClick={() => setOpenDropdownId(openDropdownId === junction.id ? null : junction.id)}
                                                    >
                                                        <span className={`mode-icon ${junction.mode}`}></span>
                                                        <span className="mode-text">{junction.mode}</span>
                                                        <ChevronDown size={14} className={`dropdown-arrow ${openDropdownId === junction.id ? 'open' : ''}`} />
                                                    </button>
                                                    {openDropdownId === junction.id && (
                                                        <div className="dropdown-menu">
                                                            <div className="dropdown-header">Select Mode</div>
                                                            <button
                                                                className={`dropdown-item ${junction.mode === 'default' ? 'active' : ''}`}
                                                                onClick={() => { handleModeChange(junction.id, 'default'); setOpenDropdownId(null); }}
                                                            >
                                                                <span className="mode-icon default"></span>
                                                                <div className="dropdown-item-content">
                                                                    <span className="dropdown-item-title">Default</span>
                                                                    <span className="dropdown-item-desc">Fixed timing cycle</span>
                                                                </div>
                                                            </button>
                                                            <button
                                                                className={`dropdown-item ${junction.mode === 'manual' ? 'active' : ''}`}
                                                                onClick={() => { handleModeChange(junction.id, 'manual'); setOpenDropdownId(null); }}
                                                            >
                                                                <span className="mode-icon manual"></span>
                                                                <div className="dropdown-item-content">
                                                                    <span className="dropdown-item-title">Manual</span>
                                                                    <span className="dropdown-item-desc">Custom timing control</span>
                                                                </div>
                                                            </button>
                                                            <button
                                                                className={`dropdown-item ${junction.mode === 'adaptive' ? 'active' : ''}`}
                                                                onClick={() => { handleModeChange(junction.id, 'adaptive'); setOpenDropdownId(null); }}
                                                            >
                                                                <span className="mode-icon adaptive"></span>
                                                                <div className="dropdown-item-content">
                                                                    <span className="dropdown-item-title">Adaptive</span>
                                                                    <span className="dropdown-item-desc">AI-based optimization</span>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${junction.status === 'active' ? 'success' : 'warning'}`}>
                                                    {junction.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); openEditModal(junction); }}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); handleDelete(junction.id); }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Junction Details */}
                {selectedJunction && (
                    <div className="card junction-config">
                        <div className="config-header">
                            <h3 className="card-title">{selectedJunction.name} Configuration</h3>
                            <span className="total-cycle-badge">
                                Total Cycle: {calculateTotalCycleTime(selectedJunction)}s
                            </span>
                        </div>

                        {/* Location Info */}
                        {selectedJunction.location && (
                            <div className="config-section location-section">
                                <h4>📍 Location Coordinates</h4>
                                <div className="location-info">
                                    <div className="coord-item">
                                        <span className="coord-label">Latitude</span>
                                        <span className="coord-value">{selectedJunction.location.lat}</span>
                                    </div>
                                    <div className="coord-item">
                                        <span className="coord-label">Longitude</span>
                                        <span className="coord-value">{selectedJunction.location.lng}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="config-section">
                            <h4><Camera size={16} /> Camera/Sensor Assignment</h4>
                            <div className="phases-grid">
                                {selectedJunction.cameras.map((camera, index) => (
                                    <div key={index} className="phase-item">
                                        <span className="phase-label">Phase {index + 1}</span>
                                        <span className="phase-value">{camera || 'Not assigned'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="config-section">
                            <h4><Clock size={16} /> Phase-wise Timing Details</h4>
                            <div className="timing-summary">
                                <div className="timing-info-row">
                                    <span>Yellow Time (fixed):</span>
                                    <strong>{YELLOW_TIME}s per phase</strong>
                                </div>
                                <div className="timing-info-row">
                                    <span>All-Red Time:</span>
                                    <strong>{selectedJunction.phases * ALL_RED_TIME_PER_PHASE}s ({selectedJunction.phases} phases × {ALL_RED_TIME_PER_PHASE}s)</strong>
                                </div>
                            </div>
                            <div className="phase-timing-grid">
                                {currentPhaseDetails.map((phase, index) => (
                                    <div
                                        key={index}
                                        className={`phase-timing-card ${activePhase === index ? 'active-phase' : ''}`}
                                    >
                                        <div className="phase-timing-header">
                                            <span className="phase-number">Phase {index + 1}</span>
                                            {activePhase === index && (
                                                <span className="active-indicator">ACTIVE</span>
                                            )}
                                        </div>
                                        <div className="timing-lights">
                                            <div className={`timing-light green ${activePhase === index && currentLight === 'green' ? 'active' : ''}`}>
                                                <span className="light-icon"></span>
                                                <span className="light-time">{phase.green}s</span>
                                            </div>
                                            <div className={`timing-light yellow ${activePhase === index && currentLight === 'yellow' ? 'active' : ''}`}>
                                                <span className="light-icon"></span>
                                                <span className="light-time">{phase.yellow}s</span>
                                            </div>
                                            <div className={`timing-light red ${activePhase === index && currentLight === 'red' ? 'active' : ''}`}>
                                                <span className="light-icon"></span>
                                                <span className="light-time">{phase.red}s</span>
                                            </div>
                                        </div>
                                        <div className="phase-total">
                                            Phase Total: {phase.green + phase.yellow + phase.red}s
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Live Signal Timer - Real Traffic Signal Simulation */}
                        <div className="config-section timer-section">
                            <h4><Clock size={16} /> Live Signal Simulation</h4>

                            {/* Corridor Override Notice */}
                            {isSelectedInCorridor && selectedCorridorPhase && (
                                <div className="corridor-override-notice">
                                    <AlertTriangle size={16} />
                                    <span>Signal timing overridden by active Green Corridor</span>
                                </div>
                            )}

                            <div className="traffic-signal-simulation">
                                {/* All phases shown as traffic signals */}
                                <div className="signal-phases-row">
                                    {currentPhaseDetails.map((phase, index) => {
                                        // Check if this junction is in corridor and get phase directions
                                        const phaseDirections = ['north', 'east', 'south', 'west']
                                        const currentDirection = phaseDirections[index] || 'north'

                                        // If in corridor, override the light based on corridor phase state
                                        let phaseLight = getPhaseLight(index)
                                        let isCorridorOverride = false
                                        let corridorPhaseStatus = null

                                        if (isSelectedInCorridor && selectedCorridorPhase) {
                                            corridorPhaseStatus = selectedCorridorPhase.phases[currentDirection]
                                            phaseLight = corridorPhaseStatus // green or red based on corridor
                                            isCorridorOverride = true
                                        }

                                        const redTimeLeft = getRedTimeRemaining(index, currentPhaseDetails)

                                        return (
                                            <div key={index} className={`signal-pole ${index === activePhase && !isCorridorOverride ? 'active' : ''} ${isCorridorOverride ? 'corridor-override' : ''}`}>
                                                <div className="signal-header">
                                                    Phase {index + 1}
                                                    {isCorridorOverride && <span className="direction-tag">{currentDirection.charAt(0).toUpperCase()}</span>}
                                                </div>
                                                <div className="traffic-light-box">
                                                    <div className={`signal-bulb red ${phaseLight === 'red' ? 'on' : ''}`}>
                                                        <span className="bulb-glow"></span>
                                                    </div>
                                                    <div className={`signal-bulb yellow ${phaseLight === 'yellow' ? 'on' : ''}`}>
                                                        <span className="bulb-glow"></span>
                                                    </div>
                                                    <div className={`signal-bulb green ${phaseLight === 'green' ? 'on' : ''}`}>
                                                        <span className="bulb-glow"></span>
                                                    </div>
                                                </div>
                                                <div className="signal-timer-display">
                                                    {isCorridorOverride ? (
                                                        <span className={`timer-value ${corridorPhaseStatus}`}>
                                                            {corridorPhaseStatus === 'green' ? '∞' : '--'}
                                                        </span>
                                                    ) : index === activePhase ? (
                                                        <span className={`timer-value ${currentLight}`}>{timeRemaining}s</span>
                                                    ) : (
                                                        <span className="timer-value red">{redTimeLeft}s</span>
                                                    )}
                                                </div>
                                                <div className="signal-status">
                                                    {isCorridorOverride ? (
                                                        corridorPhaseStatus === 'green' ? (
                                                            <span className="status-badge green corridor">CORRIDOR</span>
                                                        ) : (
                                                            <span className="status-badge halted">HALTED</span>
                                                        )
                                                    ) : index === activePhase ? (
                                                        <span className={`status-badge ${currentLight}`}>
                                                            {currentLight === 'green' ? 'GO' : currentLight === 'yellow' ? 'SLOW' : 'STOP'}
                                                        </span>
                                                    ) : (
                                                        <span className="status-badge red">WAIT</span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Current cycle info */}
                                <div className="cycle-progress-info">
                                    <div className="current-cycle-display">
                                        <span className="cycle-label">Active Phase</span>
                                        <span className="cycle-value">Phase {activePhase + 1} - {currentLight.toUpperCase()}</span>
                                    </div>
                                    <div className="phase-progress-bar">
                                        {Array.from({ length: selectedJunction.phases }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`progress-segment ${i === activePhase ? `active ${currentLight}` : ''} ${i < activePhase ? 'completed' : ''}`}
                                            >
                                                <span>{i + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="config-actions">
                            <button className="btn btn-secondary" onClick={() => openEditModal(selectedJunction)}>
                                <Settings size={16} />
                                Edit Configuration
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingJunction ? 'Edit Junction' : 'Add New Junction'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Junction Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter junction name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Number of Phases</label>
                                <select
                                    className="form-select"
                                    value={formData.phases}
                                    onChange={(e) => handlePhaseChange(e.target.value)}
                                >
                                    <option value={2}>2 Phases</option>
                                    <option value={3}>3 Phases</option>
                                    <option value={4}>4 Phases</option>
                                    <option value={5}>5 Phases</option>
                                    <option value={6}>6 Phases</option>
                                </select>
                            </div>

                            <div className="form-section">
                                <h4>Camera/Sensor Assignment per Phase</h4>
                                <div className="phases-form-grid">
                                    {Array.from({ length: formData.phases }).map((_, index) => (
                                        <div key={index} className="form-group">
                                            <label className="form-label">Phase {index + 1} Camera</label>
                                            <select
                                                className="form-select"
                                                value={formData.cameras[index] || ''}
                                                onChange={(e) => handleCameraChange(index, e.target.value)}
                                            >
                                                <option value="">Select camera...</option>
                                                {availableCameras.map(cam => (
                                                    <option key={cam} value={cam}>{cam}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-section">
                                <h4>Green Time per Phase (seconds)</h4>
                                <p className="form-hint">Yellow time ({YELLOW_TIME}s) and All-Red time ({ALL_RED_TIME_PER_PHASE}s) are automatically calculated.</p>
                                <div className="phases-form-grid">
                                    {Array.from({ length: formData.phases }).map((_, index) => (
                                        <div key={index} className="form-group">
                                            <label className="form-label">
                                                <span className="light-dot green"></span> Phase {index + 1} Green
                                            </label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                min="10"
                                                max="120"
                                                value={formData.greenTimes[index] || 30}
                                                onChange={(e) => handleGreenTimeChange(index, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="calculated-times">
                                    <div className="calc-item">
                                        <span>Total Green:</span>
                                        <strong>{formData.greenTimes.slice(0, formData.phases).reduce((a, b) => a + b, 0)}s</strong>
                                    </div>
                                    <div className="calc-item">
                                        <span>Total Yellow:</span>
                                        <strong>{formData.phases * YELLOW_TIME}s</strong>
                                    </div>
                                    <div className="calc-item">
                                        <span>All-Red Time:</span>
                                        <strong>{formData.phases * ALL_RED_TIME_PER_PHASE}s</strong>
                                    </div>
                                    <div className="calc-item total">
                                        <span>Total Cycle:</span>
                                        <strong>{formData.greenTimes.slice(0, formData.phases).reduce((a, b) => a + b, 0) + (formData.phases * YELLOW_TIME) + (formData.phases * ALL_RED_TIME_PER_PHASE)}s</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Check size={18} />
                                    {editingJunction ? 'Save Changes' : 'Add Junction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manual Mode Modal - Only Green Times Input */}
            {showManualModal && (
                <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
                    <div className="modal modal-manual" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Manual Timer Configuration</h3>
                            <button className="modal-close" onClick={() => setShowManualModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleManualSubmit}>
                            <div className="manual-form-grid">
                                <div className="form-group">
                                    <label className="form-label">Junction ID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={manualFormData.id}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Junction Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={manualFormData.junctionName}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="timing-inputs-section">
                                <h4>Set Green Time per Phase (seconds)</h4>
                                <p className="form-hint">Yellow ({YELLOW_TIME}s) and All-Red ({ALL_RED_TIME_PER_PHASE}s) times are fixed.</p>
                                <div className="manual-green-inputs">
                                    {manualFormData.greenTimes.map((greenTime, index) => (
                                        <div key={index} className="form-group">
                                            <label className="form-label">
                                                <span className="light-dot green"></span> Phase {index + 1} Green Time
                                            </label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                min="5"
                                                max="120"
                                                value={greenTime}
                                                onChange={(e) => {
                                                    const newGreenTimes = [...manualFormData.greenTimes]
                                                    newGreenTimes[index] = parseInt(e.target.value) || 0
                                                    setManualFormData({
                                                        ...manualFormData,
                                                        greenTimes: newGreenTimes
                                                    })
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="calculated-times">
                                    <div className="calc-item">
                                        <span>Total Green:</span>
                                        <strong>{manualFormData.greenTimes.reduce((a, b) => a + b, 0)}s</strong>
                                    </div>
                                    <div className="calc-item">
                                        <span>Total Yellow:</span>
                                        <strong>{manualFormData.greenTimes.length * YELLOW_TIME}s</strong>
                                    </div>
                                    <div className="calc-item">
                                        <span>All-Red Time:</span>
                                        <strong>{manualFormData.greenTimes.length * ALL_RED_TIME_PER_PHASE}s</strong>
                                    </div>
                                    <div className="calc-item total">
                                        <span>Total Cycle:</span>
                                        <strong>{manualFormData.greenTimes.reduce((a, b) => a + b, 0) + (manualFormData.greenTimes.length * YELLOW_TIME) + (manualFormData.greenTimes.length * ALL_RED_TIME_PER_PHASE)}s</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowManualModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Check size={18} />
                                    Apply Manual Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

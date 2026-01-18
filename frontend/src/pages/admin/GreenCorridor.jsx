import { useState, useEffect } from 'react'
import { Route, Clock, Play, X, Check, AlertTriangle, Bell, Timer, Navigation } from 'lucide-react'
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useCorridor, signalJunctions } from '../../context/CorridorContext'
import './GreenCorridor.css'

// Map center (Delhi, India)
const mapCenter = [28.6139, 77.2090]

export default function GreenCorridor() {
    const {
        activeCorridor,
        corridorStatus,
        phaseStates,
        noticeCountdown,
        startCorridorNotice,
        cancelCorridor,
    } = useCorridor()

    const [selectedJunctions, setSelectedJunctions] = useState([])
    const [duration, setDuration] = useState(15)
    const [corridorType, setCorridorType] = useState('emergency')
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [routePath, setRoutePath] = useState([]) // Actual road path from OSRM

    // Restore selected junctions from active corridor on mount
    useEffect(() => {
        if (activeCorridor && corridorStatus === 'active') {
            setSelectedJunctions(activeCorridor.junctions)
            setDuration(activeCorridor.duration)
            setCorridorType(activeCorridor.type)
        }
    }, [])

    // Elapsed time timer for active corridor
    useEffect(() => {
        let timer
        if (corridorStatus === 'active' && activeCorridor && activeCorridor.startTime) {
            timer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - new Date(activeCorridor.startTime).getTime()) / 1000)
                setElapsedSeconds(elapsed)
            }, 1000)
        }
        return () => {
            if (timer) clearInterval(timer)
        }
    }, [corridorStatus, activeCorridor])

    // Fetch actual road route from OSRM when junctions change
    useEffect(() => {
        const fetchRoute = async () => {
            const junctions = corridorStatus === 'active' && activeCorridor
                ? activeCorridor.junctions
                : selectedJunctions

            if (junctions.length < 2) {
                setRoutePath([])
                return
            }

            try {
                // Build OSRM coordinates string (lng,lat format)
                const coords = junctions.map(j => `${j.lng},${j.lat}`).join(';')
                const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`

                const response = await fetch(url)
                const data = await response.json()

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    // OSRM returns [lng, lat], we need [lat, lng] for Leaflet
                    const path = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]])
                    setRoutePath(path)
                } else {
                    // Fallback to straight lines if OSRM fails
                    setRoutePath(junctions.map(j => [j.lat, j.lng]))
                }
            } catch (error) {
                console.error('Failed to fetch route from OSRM:', error)
                // Fallback to straight lines
                setRoutePath(junctions.map(j => [j.lat, j.lng]))
            }
        }

        fetchRoute()
    }, [selectedJunctions, activeCorridor, corridorStatus])

    // Check if two junctions are adjacent
    const areAdjacent = (junction1, junction2) => {
        return junction1.adjacentTo.includes(junction2.id)
    }

    // Get available junctions
    const getAvailableJunctions = () => {
        if (selectedJunctions.length === 0) {
            return signalJunctions
        }
        const lastSelected = selectedJunctions[selectedJunctions.length - 1]
        return signalJunctions.filter(j =>
            !selectedJunctions.find(s => s.id === j.id) &&
            areAdjacent(lastSelected, j)
        )
    }

    const toggleJunction = (junction) => {
        if (corridorStatus !== 'idle') return

        const isSelected = selectedJunctions.find(j => j.id === junction.id)

        if (isSelected) {
            if (selectedJunctions[selectedJunctions.length - 1].id === junction.id) {
                setSelectedJunctions(selectedJunctions.filter(j => j.id !== junction.id))
            }
        } else {
            const availableJunctions = getAvailableJunctions()
            if (availableJunctions.find(j => j.id === junction.id)) {
                setSelectedJunctions([...selectedJunctions, junction])
            }
        }
    }

    const getJunctionStatus = (junction) => {
        const index = selectedJunctions.findIndex(j => j.id === junction.id)
        if (activeCorridor?.junctions.find(j => j.id === junction.id)) {
            return 'corridor-active'
        }
        if (corridorStatus === 'notice' && index >= 0) {
            return 'notice-pending'
        }
        if (index >= 0) {
            return 'selected'
        }
        const availableJunctions = getAvailableJunctions()
        if (availableJunctions.find(j => j.id === junction.id)) {
            return 'available'
        }
        return 'normal'
    }

    const getMarkerColor = (junction) => {
        const status = getJunctionStatus(junction)
        switch (status) {
            case 'corridor-active': return '#16a34a'
            case 'notice-pending': return '#f59e0b'
            case 'selected': return '#2563eb'
            case 'available': return '#3b82f6'
            default: return '#64748b'
        }
    }

    const generateCorridor = () => {
        if (selectedJunctions.length < 2) {
            alert('Please select at least 2 adjacent junctions for the corridor')
            return
        }
        setShowConfirmModal(true)
    }

    const confirmCorridor = () => {
        setShowConfirmModal(false)
        startCorridorNotice(selectedJunctions, duration, corridorType)
    }

    const handleCancelCorridor = () => {
        cancelCorridor()
        setSelectedJunctions([])
        setElapsedSeconds(0)
    }

    const clearSelection = () => {
        setSelectedJunctions([])
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatTimeHMS = (seconds) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hrs > 0) {
            return `${hrs}h ${mins}m ${secs}s`
        }
        return `${mins}m ${secs}s`
    }

    const formatDateTime = (date) => {
        if (!date) return '--:--:--'
        const d = new Date(date)
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    const getRemainingSeconds = () => {
        if (!activeCorridor || !activeCorridor.startTime) return 0
        const totalSeconds = activeCorridor.duration * 60
        return Math.max(0, totalSeconds - elapsedSeconds)
    }

    const getProgressPercent = () => {
        if (!activeCorridor || !activeCorridor.startTime) return 0
        const totalSeconds = activeCorridor.duration * 60
        return Math.min(100, (elapsedSeconds / totalSeconds) * 100)
    }

    // Create polyline path
    const displayJunctions = corridorStatus === 'active' && activeCorridor ? activeCorridor.junctions : selectedJunctions
    const corridorPath = displayJunctions.map(j => [j.lat, j.lng])

    return (
        <div className="green-corridor">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Green Corridor</h1>
                    <p className="page-subtitle">Create emergency and VIP corridors with automatic signal control</p>
                </div>
            </header>

            {/* Notice Banner */}
            {corridorStatus === 'notice' && (
                <div className="notice-banner">
                    <div className="notice-content">
                        <Bell size={24} className="notice-icon" />
                        <div className="notice-text">
                            <h3>🚨 Emergency Corridor Notice</h3>
                            <p>
                                A {corridorType} corridor is being generated from <strong>{selectedJunctions[0]?.name}</strong> to <strong>{selectedJunctions[selectedJunctions.length - 1]?.name}</strong>
                            </p>
                            <p className="notice-junctions">
                                Route: {selectedJunctions.map(j => j.name).join(' → ')}
                            </p>
                        </div>
                        <div className="notice-timer">
                            <Timer size={20} />
                            <span className="countdown">{formatTime(noticeCountdown)}</span>
                            <span className="countdown-label">until activation</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Waiting for Cycle Banner */}
            {corridorStatus === 'waiting-cycle' && (
                <div className="notice-banner waiting">
                    <div className="notice-content">
                        <Clock size={24} className="notice-icon spinning" />
                        <div className="notice-text">
                            <h3>Waiting for Current Traffic Cycle to Complete...</h3>
                            <p>Signals will switch after current cycle ends at each junction</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="corridor-layout">
                {/* OpenStreetMap */}
                <div className="card map-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Navigation size={18} />
                            Select Corridor Route
                        </h3>
                        {corridorStatus === 'idle' && selectedJunctions.length > 0 && (
                            <button className="btn btn-secondary btn-sm" onClick={clearSelection}>
                                Clear Selection
                            </button>
                        )}
                    </div>

                    <div className="corridor-map-container">
                        <MapContainer
                            center={mapCenter}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Corridor Path Line - follows actual roads */}
                            {routePath.length >= 2 && (
                                <Polyline
                                    positions={routePath}
                                    color={corridorStatus === 'active' ? '#16a34a' : corridorStatus === 'notice' ? '#f59e0b' : '#2563eb'}
                                    weight={5}
                                    opacity={0.8}
                                    dashArray={corridorStatus === 'active' ? null : '10, 10'}
                                />
                            )}

                            {/* Junction Markers */}
                            {signalJunctions.map((junction) => {
                                const index = selectedJunctions.findIndex(j => j.id === junction.id)
                                const isStart = index === 0
                                const isEnd = index === selectedJunctions.length - 1 && index > 0
                                const isSelected = index >= 0
                                const isAvailable = getAvailableJunctions().find(j => j.id === junction.id)

                                return (
                                    <CircleMarker
                                        key={junction.id}
                                        center={[junction.lat, junction.lng]}
                                        radius={isSelected ? 14 : isAvailable ? 10 : 8}
                                        fillColor={getMarkerColor(junction)}
                                        color={isStart ? '#16a34a' : isEnd ? '#dc2626' : isSelected ? '#1d4ed8' : '#ffffff'}
                                        weight={isSelected ? 3 : 2}
                                        opacity={1}
                                        fillOpacity={0.9}
                                        eventHandlers={{
                                            click: () => toggleJunction(junction)
                                        }}
                                    >
                                        <Popup>
                                            <div className="junction-popup">
                                                <strong>{junction.name}</strong>
                                                <span className="popup-id">{junction.id}</span>
                                                <span className="popup-phases">{junction.phases} phases</span>
                                                {isSelected && (
                                                    <span className={`popup-role ${isStart ? 'start' : isEnd ? 'end' : 'middle'}`}>
                                                        {isStart ? '🟢 START' : isEnd ? '🔴 END' : '🔵 MIDDLE'}
                                                    </span>
                                                )}
                                                {!isSelected && isAvailable && (
                                                    <span className="popup-available">Click to add to route</span>
                                                )}
                                                {!isSelected && !isAvailable && selectedJunctions.length > 0 && (
                                                    <span className="popup-unavailable">Not adjacent to current route</span>
                                                )}
                                                <div className="popup-adjacent">
                                                    <small>Adjacent: {junction.adjacentTo.map(id =>
                                                        signalJunctions.find(j => j.id === id)?.name
                                                    ).join(', ')}</small>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                )
                            })}
                        </MapContainer>

                        {/* Map Legend */}
                        <div className="corridor-map-legend">
                            <div className="legend-item">
                                <span className="legend-dot" style={{ background: '#64748b' }}></span>
                                <span>Junction</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
                                <span>Available</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ background: '#2563eb' }}></span>
                                <span>Selected</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ background: '#16a34a' }}></span>
                                <span>Active</span>
                            </div>
                        </div>

                        {/* Instructions */}
                        {corridorStatus === 'idle' && selectedJunctions.length === 0 && (
                            <div className="map-instructions">
                                <p>Click on any junction to start building corridor route</p>
                            </div>
                        )}
                        {corridorStatus === 'idle' && selectedJunctions.length > 0 && (
                            <div className="map-instructions">
                                <p>Click on highlighted junctions to extend route (only adjacent junctions allowed)</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Panel */}
                <div className="corridor-controls">
                    {/* Corridor Type */}
                    <div className="card">
                        <h3 className="card-title">Corridor Type</h3>
                        <div className="type-options">
                            <button
                                className={`type-btn ${corridorType === 'emergency' ? 'active emergency' : ''}`}
                                onClick={() => setCorridorType('emergency')}
                                disabled={corridorStatus !== 'idle'}
                            >
                                <AlertTriangle size={18} />
                                Emergency
                            </button>
                            <button
                                className={`type-btn ${corridorType === 'vip' ? 'active vip' : ''}`}
                                onClick={() => setCorridorType('vip')}
                                disabled={corridorStatus !== 'idle'}
                            >
                                <Route size={18} />
                                VIP
                            </button>
                        </div>
                    </div>

                    {/* Selected Route */}
                    <div className="card">
                        <h3 className="card-title">Selected Route ({selectedJunctions.length} junctions)</h3>
                        {selectedJunctions.length === 0 ? (
                            <p className="empty-message">Click on map junctions to build a route</p>
                        ) : (
                            <div className="selected-route">
                                {selectedJunctions.map((junction, index) => (
                                    <div key={junction.id} className="route-node">
                                        <span className={`route-badge ${index === 0 ? 'start' : index === selectedJunctions.length - 1 ? 'end' : 'middle'}`}>
                                            {index === 0 ? 'START' : index === selectedJunctions.length - 1 ? 'END' : 'MID'}
                                        </span>
                                        <span className="route-name">{junction.name}</span>
                                        {index < selectedJunctions.length - 1 && (
                                            <span className="route-arrow">→</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Duration Setting */}
                    <div className="card">
                        <h3 className="card-title">Corridor Duration</h3>
                        <div className="duration-options">
                            {[5, 10, 15, 20, 30, 45, 60].map(min => (
                                <button
                                    key={min}
                                    className={`duration-btn ${duration === min ? 'active' : ''}`}
                                    onClick={() => setDuration(min)}
                                    disabled={corridorStatus !== 'idle'}
                                >
                                    {min} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Phase Status Panel */}
                    {(corridorStatus === 'active' || corridorStatus === 'notice' || corridorStatus === 'waiting-cycle') && Object.keys(phaseStates).length > 0 && (
                        <div className="card phase-status-card">
                            <h3 className="card-title">Signal Phase Status</h3>
                            <div className="phase-list">
                                {selectedJunctions.map((junction) => {
                                    const state = phaseStates[junction.id]
                                    if (!state) return null
                                    return (
                                        <div key={junction.id} className="phase-item">
                                            <div className="phase-header">
                                                <span className={`phase-type-badge ${state.type}`}>
                                                    {state.type.toUpperCase()}
                                                </span>
                                                <span className="phase-junction">{junction.name}</span>
                                            </div>
                                            <div className="phase-signals">
                                                {['north', 'east', 'south', 'west'].map(dir => (
                                                    <div key={dir} className={`signal-indicator ${state.phases[dir]}`}>
                                                        <span className="signal-dir">{dir.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="phase-legend">
                                <span><i className="dot green"></i> GREEN (Corridor)</span>
                                <span><i className="dot red"></i> RED (Blocked)</span>
                            </div>
                        </div>
                    )}

                    {/* Active Corridor Status */}
                    {corridorStatus === 'active' && activeCorridor ? (
                        <div className="card active-corridor-card">
                            <div className="corridor-status">
                                <div className="status-header">
                                    <Route size={24} className="status-icon" />
                                    <div>
                                        <h4>{activeCorridor.type === 'emergency' ? '🚨 Emergency' : '👑 VIP'} Corridor Active</h4>
                                        <p>{activeCorridor.junctions.length} junctions • {activeCorridor.duration} minutes</p>
                                    </div>
                                </div>

                                {/* Time Progress */}
                                <div className="corridor-time-info">
                                    <div className="time-row">
                                        <div className="time-block elapsed">
                                            <span className="time-label">Elapsed</span>
                                            <span className="time-value">{formatTimeHMS(elapsedSeconds)}</span>
                                        </div>
                                        <div className="time-block remaining">
                                            <span className="time-label">Remaining</span>
                                            <span className="time-value">{formatTimeHMS(getRemainingSeconds())}</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="progress-container">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${getProgressPercent()}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-percent">{Math.round(getProgressPercent())}%</span>
                                    </div>

                                    {/* Start/End Times */}
                                    <div className="time-stamps">
                                        <div className="time-stamp">
                                            <Clock size={14} />
                                            <span>Started: {formatDateTime(activeCorridor.startTime)}</span>
                                        </div>
                                        <div className="time-stamp">
                                            <Timer size={14} />
                                            <span>Ends: {formatDateTime(activeCorridor.endTime)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="status-info success">
                                    <Check size={16} />
                                    <span>All corridor signals are GREEN</span>
                                </div>
                                <div className="status-info warning">
                                    <AlertTriangle size={16} />
                                    <span>Cross-traffic signals are RED</span>
                                </div>
                                <button className="btn btn-danger" onClick={handleCancelCorridor}>
                                    <X size={18} />
                                    Cancel Corridor
                                </button>
                            </div>
                        </div>
                    ) : corridorStatus === 'idle' ? (
                        <button
                            className="btn btn-primary btn-lg generate-btn"
                            onClick={generateCorridor}
                            disabled={selectedJunctions.length < 2}
                        >
                            <Play size={20} />
                            Generate Corridor
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Confirm {corridorType === 'emergency' ? 'Emergency' : 'VIP'} Corridor</h3>
                            <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="confirm-content">
                            <div className="confirm-route">
                                <Route size={20} />
                                <span>Route: {selectedJunctions.map(j => j.name).join(' → ')}</span>
                            </div>
                            <div className="confirm-duration">
                                <Clock size={20} />
                                <span>Duration: {duration} minutes</span>
                            </div>

                            <div className="confirm-steps">
                                <h4>Activation Process:</h4>
                                <ol>
                                    <li>
                                        <Bell size={16} />
                                        <span><strong>2-minute notice</strong> will be sent to public website</span>
                                    </li>
                                    <li>
                                        <Clock size={16} />
                                        <span>System waits for <strong>current traffic cycle</strong> to complete</span>
                                    </li>
                                    <li>
                                        <Check size={16} />
                                        <span>Corridor signals switch to <strong>GREEN</strong>, cross-traffic to <strong>RED</strong></span>
                                    </li>
                                </ol>
                            </div>

                            <div className="confirm-warning">
                                <AlertTriangle size={18} />
                                <div>
                                    <strong>Warning:</strong> This will block all cross-traffic on the corridor route. Only proceed for genuine emergencies or authorized VIP movements.
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-success" onClick={confirmCorridor}>
                                <Check size={18} />
                                Start 2-Min Notice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

import { useState } from 'react'
import { Route, Clock, Play, X, Check, AlertTriangle } from 'lucide-react'
import './GreenCorridor.css'

// Sample junction grid for city map
const cityJunctions = [
    { id: 'J-001', name: 'A1', position: { row: 0, col: 0 } },
    { id: 'J-002', name: 'A2', position: { row: 0, col: 1 } },
    { id: 'J-003', name: 'A3', position: { row: 0, col: 2 } },
    { id: 'J-004', name: 'A4', position: { row: 0, col: 3 } },
    { id: 'J-005', name: 'A5', position: { row: 0, col: 4 } },

    { id: 'J-006', name: 'B1', position: { row: 1, col: 0 } },
    { id: 'J-007', name: 'B2', position: { row: 1, col: 1 } },
    { id: 'J-008', name: 'B3', position: { row: 1, col: 2 } },
    { id: 'J-009', name: 'B4', position: { row: 1, col: 3 } },
    { id: 'J-010', name: 'B5', position: { row: 1, col: 4 } },

    { id: 'J-011', name: 'C1', position: { row: 2, col: 0 } },
    { id: 'J-012', name: 'C2', position: { row: 2, col: 1 } },
    { id: 'J-013', name: 'C3', position: { row: 2, col: 2 } },
    { id: 'J-014', name: 'C4', position: { row: 2, col: 3 } },
    { id: 'J-015', name: 'C5', position: { row: 2, col: 4 } },

    { id: 'J-016', name: 'D1', position: { row: 3, col: 0 } },
    { id: 'J-017', name: 'D2', position: { row: 3, col: 1 } },
    { id: 'J-018', name: 'D3', position: { row: 3, col: 2 } },
    { id: 'J-019', name: 'D4', position: { row: 3, col: 3 } },
    { id: 'J-020', name: 'D5', position: { row: 3, col: 4 } },

    { id: 'J-021', name: 'E1', position: { row: 4, col: 0 } },
    { id: 'J-022', name: 'E2', position: { row: 4, col: 1 } },
    { id: 'J-023', name: 'E3', position: { row: 4, col: 2 } },
    { id: 'J-024', name: 'E4', position: { row: 4, col: 3 } },
    { id: 'J-025', name: 'E5', position: { row: 4, col: 4 } },
]

export default function GreenCorridor() {
    const [selectedJunctions, setSelectedJunctions] = useState([])
    const [duration, setDuration] = useState(15)
    const [activeCorridor, setActiveCorridor] = useState(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)

    const toggleJunction = (junction) => {
        if (activeCorridor) return // Prevent changes during active corridor

        const isSelected = selectedJunctions.find(j => j.id === junction.id)
        if (isSelected) {
            setSelectedJunctions(selectedJunctions.filter(j => j.id !== junction.id))
        } else {
            setSelectedJunctions([...selectedJunctions, junction])
        }
    }

    const getJunctionStatus = (junction) => {
        if (activeCorridor?.junctions.find(j => j.id === junction.id)) {
            return 'corridor-active'
        }
        if (selectedJunctions.find(j => j.id === junction.id)) {
            return 'selected'
        }
        return 'normal'
    }

    const generateCorridor = () => {
        if (selectedJunctions.length < 2) {
            alert('Please select at least 2 junctions for the corridor')
            return
        }
        setShowConfirmModal(true)
    }

    const confirmCorridor = () => {
        setActiveCorridor({
            junctions: selectedJunctions,
            duration: duration,
            startTime: new Date(),
            endTime: new Date(Date.now() + duration * 60 * 1000)
        })
        setShowConfirmModal(false)

        // Auto-deactivate after duration
        setTimeout(() => {
            setActiveCorridor(null)
            setSelectedJunctions([])
        }, duration * 60 * 1000)
    }

    const cancelCorridor = () => {
        setActiveCorridor(null)
        setSelectedJunctions([])
    }

    const clearSelection = () => {
        setSelectedJunctions([])
    }

    return (
        <div className="green-corridor">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Green Corridor</h1>
                    <p className="page-subtitle">Create VIP routes and emergency corridors</p>
                </div>
            </header>

            <div className="corridor-layout">
                {/* Map Grid */}
                <div className="card map-grid-card">
                    <div className="card-header">
                        <h3 className="card-title">City Junction Grid</h3>
                        {!activeCorridor && selectedJunctions.length > 0 && (
                            <button className="btn btn-secondary btn-sm" onClick={clearSelection}>
                                Clear Selection
                            </button>
                        )}
                    </div>

                    <div className="junction-grid">
                        {[0, 1, 2, 3, 4].map(row => (
                            <div key={row} className="grid-row">
                                {cityJunctions
                                    .filter(j => j.position.row === row)
                                    .map(junction => (
                                        <button
                                            key={junction.id}
                                            className={`junction-node ${getJunctionStatus(junction)}`}
                                            onClick={() => toggleJunction(junction)}
                                            disabled={!!activeCorridor}
                                        >
                                            <span className="junction-name">{junction.name}</span>
                                            {selectedJunctions.findIndex(j => j.id === junction.id) >= 0 && (
                                                <span className="junction-order">
                                                    {selectedJunctions.findIndex(j => j.id === junction.id) + 1}
                                                </span>
                                            )}
                                        </button>
                                    ))
                                }
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="map-legend">
                        <div className="legend-item">
                            <span className="legend-dot normal"></span>
                            <span>Available</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot selected"></span>
                            <span>Selected</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot corridor-active"></span>
                            <span>Active Corridor</span>
                        </div>
                    </div>
                </div>

                {/* Control Panel */}
                <div className="corridor-controls">
                    {/* Selected Route */}
                    <div className="card">
                        <h3 className="card-title">Selected Route</h3>
                        {selectedJunctions.length === 0 ? (
                            <p className="empty-message">Click on junctions to build a route</p>
                        ) : (
                            <div className="selected-route">
                                {selectedJunctions.map((junction, index) => (
                                    <div key={junction.id} className="route-node">
                                        <span className="route-number">{index + 1}</span>
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
                                    disabled={!!activeCorridor}
                                >
                                    {min} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Corridor Status */}
                    {activeCorridor ? (
                        <div className="card active-corridor-card">
                            <div className="corridor-status">
                                <div className="status-header">
                                    <Route size={24} className="status-icon" />
                                    <div>
                                        <h4>Corridor Active</h4>
                                        <p>{activeCorridor.junctions.length} junctions • {activeCorridor.duration} minutes</p>
                                    </div>
                                </div>
                                <div className="status-info">
                                    <AlertTriangle size={16} />
                                    <span>Cross-traffic signals set to RED on corridor route</span>
                                </div>
                                <button className="btn btn-danger" onClick={cancelCorridor}>
                                    <X size={18} />
                                    Cancel Corridor
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="btn btn-primary btn-lg generate-btn"
                            onClick={generateCorridor}
                            disabled={selectedJunctions.length < 2}
                        >
                            <Play size={20} />
                            Generate Corridor
                        </button>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Confirm Green Corridor</h3>
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

                            <div className="confirm-warning">
                                <AlertTriangle size={18} />
                                <div>
                                    <strong>Warning:</strong> This will set all cross-traffic signals to RED for vehicles entering from other sides of the corridor route.
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-success" onClick={confirmCorridor}>
                                <Check size={18} />
                                Activate Corridor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

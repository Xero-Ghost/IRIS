import { useState } from 'react'
import { Plus, Edit2, Trash2, Camera, Settings, Clock, X, Check } from 'lucide-react'
import './SignalControl.css'

// Sample junction data
const initialJunctions = [
    {
        id: 'J-001',
        name: 'City Center',
        phases: 4,
        cameras: ['CAM-001', 'CAM-002', 'CAM-003', 'CAM-004'],
        defaultTimer: [45, 30, 45, 30],
        status: 'active',
        mode: 'adaptive'
    },
    {
        id: 'J-002',
        name: 'MG Road Crossing',
        phases: 4,
        cameras: ['CAM-005', 'CAM-006', 'CAM-007', 'CAM-008'],
        defaultTimer: [40, 35, 40, 35],
        status: 'active',
        mode: 'adaptive'
    },
    {
        id: 'J-003',
        name: 'Railway Station',
        phases: 3,
        cameras: ['CAM-009', 'CAM-010', 'CAM-011'],
        defaultTimer: [50, 40, 50],
        status: 'active',
        mode: 'default'
    },
    {
        id: 'J-004',
        name: 'Industrial Area',
        phases: 4,
        cameras: ['CAM-012', 'CAM-013', 'CAM-014', 'CAM-015'],
        defaultTimer: [35, 25, 35, 25],
        status: 'maintenance',
        mode: 'manual'
    },
]

// Available camera devices
const availableCameras = [
    'CAM-001', 'CAM-002', 'CAM-003', 'CAM-004', 'CAM-005',
    'CAM-006', 'CAM-007', 'CAM-008', 'CAM-009', 'CAM-010',
    'CAM-011', 'CAM-012', 'CAM-013', 'CAM-014', 'CAM-015',
    'CAM-016', 'CAM-017', 'CAM-018', 'CAM-019', 'CAM-020',
]

export default function SignalControl() {
    const [junctions, setJunctions] = useState(initialJunctions)
    const [showModal, setShowModal] = useState(false)
    const [editingJunction, setEditingJunction] = useState(null)
    const [selectedJunction, setSelectedJunction] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phases: 4,
        cameras: ['', '', '', ''],
        defaultTimer: [45, 30, 45, 30]
    })

    const openAddModal = () => {
        setEditingJunction(null)
        setFormData({
            name: '',
            phases: 4,
            cameras: ['', '', '', ''],
            defaultTimer: [45, 30, 45, 30]
        })
        setShowModal(true)
    }

    const openEditModal = (junction) => {
        setEditingJunction(junction)
        setFormData({
            name: junction.name,
            phases: junction.phases,
            cameras: [...junction.cameras],
            defaultTimer: [...junction.defaultTimer]
        })
        setShowModal(true)
    }

    const handlePhaseChange = (count) => {
        const phases = parseInt(count)
        setFormData({
            ...formData,
            phases,
            cameras: Array(phases).fill(''),
            defaultTimer: Array(phases).fill(30)
        })
    }

    const handleCameraChange = (index, value) => {
        const newCameras = [...formData.cameras]
        newCameras[index] = value
        setFormData({ ...formData, cameras: newCameras })
    }

    const handleTimerChange = (index, value) => {
        const newTimers = [...formData.defaultTimer]
        newTimers[index] = parseInt(value) || 0
        setFormData({ ...formData, defaultTimer: newTimers })
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (editingJunction) {
            setJunctions(junctions.map(j =>
                j.id === editingJunction.id
                    ? { ...j, name: formData.name, phases: formData.phases, cameras: formData.cameras, defaultTimer: formData.defaultTimer }
                    : j
            ))
        } else {
            const newJunction = {
                id: `J-${String(junctions.length + 1).padStart(3, '0')}`,
                name: formData.name,
                phases: formData.phases,
                cameras: formData.cameras,
                defaultTimer: formData.defaultTimer,
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
                setSelectedJunction(null)
            }
        }
    }

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
                                    <th>Mode</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {junctions.map((junction) => (
                                    <tr
                                        key={junction.id}
                                        className={selectedJunction?.id === junction.id ? 'selected' : ''}
                                        onClick={() => setSelectedJunction(junction)}
                                    >
                                        <td><strong>{junction.id}</strong></td>
                                        <td>{junction.name}</td>
                                        <td>{junction.phases}</td>
                                        <td>
                                            <span className={`badge badge-${junction.mode === 'adaptive' ? 'success' : junction.mode === 'default' ? 'warning' : 'primary'}`}>
                                                {junction.mode}
                                            </span>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Junction Details */}
                {selectedJunction && (
                    <div className="card junction-config">
                        <h3 className="card-title">{selectedJunction.name} Configuration</h3>

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
                            <h4><Clock size={16} /> Default Timer (Failsafe)</h4>
                            <div className="phases-grid">
                                {selectedJunction.defaultTimer.map((timer, index) => (
                                    <div key={index} className="phase-item">
                                        <span className="phase-label">Phase {index + 1}</span>
                                        <span className="phase-value">{timer}s</span>
                                    </div>
                                ))}
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
                                <h4>Default Timer (Failsafe) - seconds</h4>
                                <div className="phases-form-grid">
                                    {Array.from({ length: formData.phases }).map((_, index) => (
                                        <div key={index} className="form-group">
                                            <label className="form-label">Phase {index + 1}</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                min="10"
                                                max="120"
                                                value={formData.defaultTimer[index] || 30}
                                                onChange={(e) => handleTimerChange(index, e.target.value)}
                                            />
                                        </div>
                                    ))}
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
        </div>
    )
}

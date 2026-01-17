import { useState } from 'react'
import { Camera, AlertTriangle, Wrench, Clock, MapPin, Eye, Phone, Building2, Shield, CheckCircle } from 'lucide-react'
import './Alerts.css'

// Sample violation data with plates and snapshots
const violationsData = [
    {
        id: 'V-001',
        type: 'Signal Breach',
        plate: 'KA-01-AB-1234',
        junction: 'City Center (J-001)',
        time: '2024-01-15 14:32:15',
        snapshot: '/placeholder-violation.jpg'
    },
    {
        id: 'V-002',
        type: 'Wrong Lane',
        plate: 'MH-02-CD-5678',
        junction: 'MG Road (J-002)',
        time: '2024-01-15 14:28:45',
        snapshot: '/placeholder-violation.jpg'
    },
    {
        id: 'V-003',
        type: 'Signal Breach',
        plate: 'KA-03-EF-9012',
        junction: 'Railway Station (J-003)',
        time: '2024-01-15 14:15:22',
        snapshot: '/placeholder-violation.jpg'
    },
    {
        id: 'V-004',
        type: 'Speeding',
        plate: 'TN-04-GH-3456',
        junction: 'Industrial Area (J-004)',
        time: '2024-01-15 13:58:10',
        snapshot: '/placeholder-violation.jpg'
    },
]

// Sample accident data with severity, hospital and police info
const initialAccidentsData = [
    {
        id: 'A-001',
        severity: 'Severe',
        junction: 'MG Road Crossing',
        junctionId: 'J-002',
        time: '2024-01-15 14:20:00',
        status: 'in-process',
        description: 'Multi-vehicle collision involving 3 cars, injuries reported',
        snapshot: '/placeholder-accident-severe.jpg',
        hospital: {
            name: 'City General Hospital',
            location: '2.3 km away - 4th Cross, MG Road',
            phone: '+91 80 2345 6789',
            ambulanceDispatched: true
        },
        police: {
            station: 'MG Road Traffic Police Station',
            location: '1.1 km away - Near Metro Station',
            officerName: 'Inspector Raj Kumar',
            phone: '+91 98765 43210',
            dispatched: true
        }
    },
    {
        id: 'A-002',
        severity: 'Moderate',
        junction: 'Railway Station Junction',
        junctionId: 'J-003',
        time: '2024-01-15 13:45:00',
        status: 'in-process',
        description: 'Two-wheeler collision with car, minor injuries',
        snapshot: '/placeholder-accident-moderate.jpg',
        hospital: {
            name: 'Apollo Clinic',
            location: '1.8 km away - Station Road',
            phone: '+91 80 3456 7890',
            ambulanceDispatched: true
        },
        police: {
            station: 'Railway Station Traffic Post',
            location: '0.5 km away - Platform Road',
            officerName: 'SI Priya Sharma',
            phone: '+91 98765 12345',
            dispatched: true
        }
    },
    {
        id: 'A-003',
        severity: 'Minor',
        junction: 'Tech Park Gate',
        junctionId: 'J-007',
        time: '2024-01-15 12:30:00',
        status: 'resolved',
        description: 'Fender bender between two cars, no injuries',
        snapshot: '/placeholder-accident-minor.jpg',
        hospital: {
            name: 'Manipal Hospital',
            location: '3.2 km away - Outer Ring Road',
            phone: '+91 80 4567 8901',
            ambulanceDispatched: false
        },
        police: {
            station: 'Whitefield Traffic Police',
            location: '2.0 km away - ITPL Main Road',
            officerName: 'Constable Ramesh',
            phone: '+91 98765 67890',
            dispatched: true
        }
    },
    {
        id: 'A-004',
        severity: 'Severe',
        junction: 'Hospital Road',
        junctionId: 'J-005',
        time: '2024-01-15 11:15:00',
        status: 'resolved',
        description: 'Bus and auto-rickshaw collision, multiple injuries',
        snapshot: '/placeholder-accident-severe2.jpg',
        hospital: {
            name: 'Victoria Hospital',
            location: '0.8 km away - Hospital Road',
            phone: '+91 80 5678 9012',
            ambulanceDispatched: true
        },
        police: {
            station: 'City Central Traffic Station',
            location: '1.5 km away - Gandhi Nagar',
            officerName: 'Inspector Suresh Patil',
            phone: '+91 98765 11111',
            dispatched: true
        }
    },
]

// Sample maintenance alerts
const maintenanceData = [
    {
        id: 'M-001',
        signalId: 'SIG-015',
        junction: 'Tech Park Gate (J-007)',
        errorType: 'Camera Offline',
        severity: 'warning',
        time: '2024-01-15 14:10:00',
        status: 'pending',
        failsafe: true
    },
    {
        id: 'M-002',
        signalId: 'SIG-023',
        junction: 'Market Square (J-006)',
        errorType: 'Adaptive Timer Glitch',
        severity: 'warning',
        time: '2024-01-15 13:45:00',
        status: 'pending',
        failsafe: true
    },
    {
        id: 'M-003',
        signalId: 'SIG-008',
        junction: 'Hospital Road (J-005)',
        errorType: 'Signal Hardware Failure',
        severity: 'critical',
        time: '2024-01-15 12:30:00',
        status: 'in-progress',
        failsafe: false
    },
    {
        id: 'M-004',
        signalId: 'SIG-031',
        junction: 'Stadium Junction (J-008)',
        errorType: 'Sensor Malfunction',
        severity: 'warning',
        time: '2024-01-15 11:20:00',
        status: 'resolved',
        failsafe: true
    },
]

export default function Alerts() {
    const [activeTab, setActiveTab] = useState('violations')
    const [selectedItem, setSelectedItem] = useState(null)
    const [accidentsData, setAccidentsData] = useState(initialAccidentsData)

    const handleUpdateStatus = (accidentId) => {
        setAccidentsData(prevData =>
            prevData.map(accident =>
                accident.id === accidentId
                    ? { ...accident, status: 'resolved' }
                    : accident
            )
        )
        // Update selected item as well
        if (selectedItem?.id === accidentId) {
            setSelectedItem(prev => ({ ...prev, status: 'resolved' }))
        }
    }

    const getSeverityBadgeClass = (severity) => {
        switch (severity) {
            case 'Severe': return 'badge-danger'
            case 'Moderate': return 'badge-warning'
            case 'Minor': return 'badge-success'
            default: return 'badge-primary'
        }
    }

    return (
        <div className="alerts-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Alerts & Notifications</h1>
                    <p className="page-subtitle">Monitor violations, accidents, and system maintenance</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'violations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('violations')}
                >
                    <Camera size={16} />
                    Violations ({violationsData.length})
                </button>
                <button
                    className={`tab ${activeTab === 'accidents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('accidents')}
                >
                    <AlertTriangle size={16} />
                    Accidents ({accidentsData.filter(a => a.status === 'in-process').length} active)
                </button>
                <button
                    className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('maintenance')}
                >
                    <Wrench size={16} />
                    Maintenance ({maintenanceData.filter(m => m.status !== 'resolved').length})
                </button>
            </div>

            {/* Violations Tab */}
            {activeTab === 'violations' && (
                <div className="alerts-content">
                    <div className="alerts-list">
                        {violationsData.map((violation) => (
                            <div
                                key={violation.id}
                                className={`alert-card violation-card ${selectedItem?.id === violation.id ? 'selected' : ''}`}
                                onClick={() => setSelectedItem(violation)}
                            >
                                <div className="alert-card-header">
                                    <span className="badge badge-danger">{violation.type}</span>
                                    <span className="alert-time">
                                        <Clock size={14} />
                                        {violation.time}
                                    </span>
                                </div>
                                <div className="violation-details">
                                    <div className="plate-number">{violation.plate}</div>
                                    <div className="violation-location">
                                        <MapPin size={14} />
                                        {violation.junction}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Violation Detail View */}
                    {selectedItem && activeTab === 'violations' && (
                        <div className="alert-detail card">
                            <h3 className="card-title">Violation Details</h3>
                            <div className="snapshot-container">
                                <div className="snapshot-placeholder">
                                    <Camera size={48} />
                                    <p>Snapshot at time of violation</p>
                                </div>
                            </div>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Number Plate</span>
                                    <span className="detail-value plate">{selectedItem.plate}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Violation Type</span>
                                    <span className="detail-value">{selectedItem.type}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Location</span>
                                    <span className="detail-value">{selectedItem.junction}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Time</span>
                                    <span className="detail-value">{selectedItem.time}</span>
                                </div>
                            </div>
                            <button className="btn btn-primary">
                                <Eye size={16} />
                                View Full Recording
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Accidents Tab */}
            {activeTab === 'accidents' && (
                <div className="alerts-content">
                    <div className="alerts-list">
                        {accidentsData.map((accident) => (
                            <div
                                key={accident.id}
                                className={`alert-card accident-card ${selectedItem?.id === accident.id ? 'selected' : ''}`}
                                onClick={() => setSelectedItem(accident)}
                            >
                                <div className="alert-card-header">
                                    <div className="accident-badges">
                                        <span className={`badge ${getSeverityBadgeClass(accident.severity)}`}>
                                            {accident.severity}
                                        </span>
                                        <span className={`badge badge-${accident.status === 'in-process' ? 'primary' : 'success'}`}>
                                            {accident.status === 'in-process' ? 'In Process' : 'Resolved'}
                                        </span>
                                    </div>
                                    <span className="alert-time">
                                        <Clock size={14} />
                                        {accident.time}
                                    </span>
                                </div>
                                <div className="accident-location">
                                    <MapPin size={14} />
                                    {accident.junction}
                                </div>
                                <p className="accident-desc">{accident.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Accident Detail View */}
                    {selectedItem && activeTab === 'accidents' && (
                        <div className="alert-detail card">
                            <div className="accident-detail-header">
                                <h3 className="card-title">Accident Details</h3>
                                <span className={`badge ${getSeverityBadgeClass(selectedItem.severity)}`}>
                                    {selectedItem.severity}
                                </span>
                            </div>

                            {/* Accident Image */}
                            <div className="snapshot-container">
                                <div className={`snapshot-placeholder accident ${selectedItem.severity.toLowerCase()}`}>
                                    <AlertTriangle size={48} />
                                    <p>Accident captured at {selectedItem.junction}</p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="status-section">
                                <span className="detail-label">Current Status</span>
                                <span className={`status-badge ${selectedItem.status}`}>
                                    {selectedItem.status === 'in-process' ? (
                                        <>
                                            <Clock size={16} />
                                            In Process
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={16} />
                                            Resolved
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Location & Time */}
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Location</span>
                                    <span className="detail-value">{selectedItem.junction}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Time Reported</span>
                                    <span className="detail-value">{selectedItem.time}</span>
                                </div>
                            </div>

                            <p className="accident-description">{selectedItem.description}</p>

                            {/* Hospital Info */}
                            <div className="response-section">
                                <div className="response-header">
                                    <Building2 size={18} />
                                    <h4>Hospital Response</h4>
                                    {selectedItem.hospital.ambulanceDispatched && (
                                        <span className="badge badge-success">Ambulance Dispatched</span>
                                    )}
                                </div>
                                <div className="response-details">
                                    <div className="response-item">
                                        <span className="response-label">Hospital</span>
                                        <span className="response-value">{selectedItem.hospital.name}</span>
                                    </div>
                                    <div className="response-item">
                                        <span className="response-label">Location</span>
                                        <span className="response-value">{selectedItem.hospital.location}</span>
                                    </div>
                                    <div className="response-item">
                                        <span className="response-label">Contact</span>
                                        <a href={`tel:${selectedItem.hospital.phone}`} className="response-phone">
                                            <Phone size={14} />
                                            {selectedItem.hospital.phone}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Police Info */}
                            <div className="response-section police">
                                <div className="response-header">
                                    <Shield size={18} />
                                    <h4>Traffic Police Response</h4>
                                    {selectedItem.police.dispatched && (
                                        <span className="badge badge-success">Officer Dispatched</span>
                                    )}
                                </div>
                                <div className="response-details">
                                    <div className="response-item">
                                        <span className="response-label">Station</span>
                                        <span className="response-value">{selectedItem.police.station}</span>
                                    </div>
                                    <div className="response-item">
                                        <span className="response-label">Location</span>
                                        <span className="response-value">{selectedItem.police.location}</span>
                                    </div>
                                    <div className="response-item">
                                        <span className="response-label">Officer</span>
                                        <span className="response-value">{selectedItem.police.officerName}</span>
                                    </div>
                                    <div className="response-item">
                                        <span className="response-label">Contact</span>
                                        <a href={`tel:${selectedItem.police.phone}`} className="response-phone">
                                            <Phone size={14} />
                                            {selectedItem.police.phone}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Update Status Button */}
                            {selectedItem.status === 'in-process' && (
                                <button
                                    className="btn btn-success update-status-btn"
                                    onClick={() => handleUpdateStatus(selectedItem.id)}
                                >
                                    <CheckCircle size={16} />
                                    Mark as Resolved
                                </button>
                            )}

                            {selectedItem.status === 'resolved' && (
                                <div className="resolved-banner">
                                    <CheckCircle size={18} />
                                    <span>This accident has been resolved</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
                <div className="maintenance-content">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Signal ID</th>
                                    <th>Junction</th>
                                    <th>Error Type</th>
                                    <th>Severity</th>
                                    <th>Failsafe</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenanceData.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.signalId}</strong></td>
                                        <td>{item.junction}</td>
                                        <td>{item.errorType}</td>
                                        <td>
                                            <span className={`badge badge-${item.severity === 'critical' ? 'danger' : 'warning'}`}>
                                                {item.severity}
                                            </span>
                                        </td>
                                        <td>
                                            {item.failsafe ? (
                                                <span className="badge badge-success">Active</span>
                                            ) : (
                                                <span className="badge badge-danger">Inactive</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${item.status === 'resolved' ? 'success' :
                                                    item.status === 'in-progress' ? 'primary' : 'warning'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>{item.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="failsafe-info card">
                        <h4>
                            <Wrench size={18} />
                            Default Timer Failsafe
                        </h4>
                        <p>
                            When the adaptive timer fails or a camera goes offline, the signal automatically
                            switches to the pre-configured default timer to ensure uninterrupted traffic flow.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

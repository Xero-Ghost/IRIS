import { useState } from 'react'
import { Camera, AlertTriangle, Wrench, Clock, MapPin, Eye } from 'lucide-react'
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

// Sample incident data with images
const incidentsData = [
    {
        id: 'I-001',
        type: 'Accident',
        junction: 'MG Road Crossing',
        junctionId: 'J-002',
        time: '2024-01-15 14:20:00',
        status: 'active',
        description: 'Two-vehicle collision blocking lane 2',
        snapshot: '/placeholder-accident.jpg'
    },
    {
        id: 'I-002',
        type: 'Traffic Jam',
        junction: 'Railway Station',
        junctionId: 'J-003',
        time: '2024-01-15 14:05:00',
        status: 'resolved',
        description: 'Heavy congestion due to rush hour',
        snapshot: '/placeholder-traffic.jpg'
    },
    {
        id: 'I-003',
        type: 'Road Work',
        junction: 'Industrial Area',
        junctionId: 'J-004',
        time: '2024-01-15 09:00:00',
        status: 'active',
        description: 'Lane closure for maintenance work',
        snapshot: '/placeholder-roadwork.jpg'
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

    return (
        <div className="alerts-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Alerts & Notifications</h1>
                    <p className="page-subtitle">Monitor violations, incidents, and system maintenance</p>
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
                    className={`tab ${activeTab === 'incidents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('incidents')}
                >
                    <AlertTriangle size={16} />
                    Incidents ({incidentsData.filter(i => i.status === 'active').length} active)
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

            {/* Incidents Tab */}
            {activeTab === 'incidents' && (
                <div className="alerts-content">
                    <div className="alerts-list">
                        {incidentsData.map((incident) => (
                            <div
                                key={incident.id}
                                className={`alert-card incident-card ${selectedItem?.id === incident.id ? 'selected' : ''}`}
                                onClick={() => setSelectedItem(incident)}
                            >
                                <div className="alert-card-header">
                                    <span className={`badge badge-${incident.status === 'active' ? 'danger' : 'success'}`}>
                                        {incident.status === 'active' ? 'Active' : 'Resolved'}
                                    </span>
                                    <span className="alert-time">
                                        <Clock size={14} />
                                        {incident.time}
                                    </span>
                                </div>
                                <h4 className="incident-type">{incident.type}</h4>
                                <div className="incident-location">
                                    <MapPin size={14} />
                                    {incident.junction}
                                </div>
                                <p className="incident-desc">{incident.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Incident Detail View */}
                    {selectedItem && activeTab === 'incidents' && (
                        <div className="alert-detail card">
                            <h3 className="card-title">Incident Details</h3>
                            <div className="snapshot-container">
                                <div className="snapshot-placeholder incident">
                                    <AlertTriangle size={48} />
                                    <p>Incident image at {selectedItem.junction}</p>
                                </div>
                            </div>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Incident Type</span>
                                    <span className="detail-value">{selectedItem.type}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status</span>
                                    <span className={`badge badge-${selectedItem.status === 'active' ? 'danger' : 'success'}`}>
                                        {selectedItem.status}
                                    </span>
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
                            <p className="incident-description">{selectedItem.description}</p>
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

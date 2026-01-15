import { AlertTriangle, MapPin, Clock, AlertCircle } from 'lucide-react'
import './PublicAlerts.css'

// Sample public incidents
const publicIncidents = [
    {
        id: 'I-001',
        type: 'Accident',
        junction: 'MG Road Crossing',
        area: 'Central District',
        time: '14:20',
        status: 'active',
        advice: 'Avoid this junction. Use Ring Road as alternate route.'
    },
    {
        id: 'I-002',
        type: 'Road Work',
        junction: 'Industrial Area',
        area: 'East Zone',
        time: '09:00',
        status: 'active',
        advice: 'Lane 2 closed. Expect delays of 10-15 minutes.'
    },
    {
        id: 'I-003',
        type: 'Traffic Jam',
        junction: 'Railway Station',
        area: 'North District',
        time: '17:30',
        status: 'resolved',
        advice: 'Traffic has been cleared. Normal flow resumed.'
    },
]

export default function PublicAlerts() {
    const activeIncidents = publicIncidents.filter(i => i.status === 'active')

    return (
        <div className="public-alerts">
            <header className="public-page-header">
                <h1>Incident Alerts</h1>
                <p>Stay informed about accidents and traffic disruptions</p>
            </header>

            {/* Active Alert Banner */}
            {activeIncidents.length > 0 && (
                <div className="active-alert-banner">
                    <AlertCircle size={20} />
                    <span><strong>{activeIncidents.length} active incident(s)</strong> - Check routes before traveling</span>
                </div>
            )}

            {/* Incidents List */}
            <div className="incidents-list">
                {publicIncidents.map((incident) => (
                    <div key={incident.id} className={`incident-card ${incident.status}`}>
                        <div className="incident-header">
                            <div className="incident-type">
                                <AlertTriangle size={20} />
                                <span>{incident.type}</span>
                            </div>
                            <span className={`status-badge ${incident.status}`}>
                                {incident.status === 'active' ? '● Active' : '✓ Resolved'}
                            </span>
                        </div>

                        <div className="incident-details">
                            <div className="detail-row">
                                <MapPin size={16} />
                                <span><strong>{incident.junction}</strong> - {incident.area}</span>
                            </div>
                            <div className="detail-row">
                                <Clock size={16} />
                                <span>Reported at {incident.time}</span>
                            </div>
                        </div>

                        <div className="incident-advice">
                            <strong>Advice:</strong> {incident.advice}
                        </div>
                    </div>
                ))}
            </div>

            {publicIncidents.length === 0 && (
                <div className="no-incidents">
                    <AlertTriangle size={48} />
                    <h3>No Incidents Reported</h3>
                    <p>All junctions are operating normally</p>
                </div>
            )}

            <div className="public-note">
                <AlertTriangle size={16} />
                <span>If you witness an accident, please call emergency services at 112</span>
            </div>
        </div>
    )
}

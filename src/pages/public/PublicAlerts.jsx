import { useState, useEffect } from 'react'
import { AlertTriangle, MapPin, Clock, AlertCircle, Loader } from 'lucide-react'
import './PublicAlerts.css'
import { alertsAPI, accidentsAPI } from '../../services/api'

export default function PublicAlerts() {
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchIncidents()
    }, [])

    const fetchIncidents = async () => {
        setLoading(true)
        try {
            const [alerts, accidents] = await Promise.all([
                alertsAPI.getAll(null, 20).catch(() => []),
                accidentsAPI.getAll({ limit: 10 }).catch(() => [])
            ])

            // Combine alerts and accidents into incidents
            const mappedIncidents = []

            // Add accidents as incidents
            accidents.forEach(acc => {
                mappedIncidents.push({
                    id: `A-${acc.id}`,
                    type: 'Accident',
                    junction: acc.location || `Junction ${acc.junction_id}`,
                    area: acc.junction_id || 'Unknown Area',
                    time: new Date(acc.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: acc.status === 'active' ? 'active' : 'resolved',
                    advice: acc.description || 'Avoid this junction if possible.'
                })
            })

            // Add alerts as incidents
            alerts.forEach(alert => {
                if (alert.type === 'incident' || alert.type === 'violation') {
                    mappedIncidents.push({
                        id: `AL-${alert.id}`,
                        type: alert.type === 'incident' ? 'Traffic Incident' : 'Traffic Violation',
                        junction: alert.junction_id || 'Multiple Junctions',
                        area: 'City Area',
                        time: new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: alert.status === 'active' ? 'active' : 'resolved',
                        advice: alert.message || 'Please follow traffic guidelines.'
                    })
                }
            })

            setIncidents(mappedIncidents)
        } catch (err) {
            console.error('Failed to fetch incidents:', err)
        } finally {
            setLoading(false)
        }
    }

    const activeIncidents = incidents.filter(i => i.status === 'active')

    if (loading) {
        return (
            <div className="public-alerts loading-state">
                <Loader className="spin" size={32} />
                <p>Loading alerts...</p>
            </div>
        )
    }

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
                {incidents.length > 0 ? (
                    incidents.map((incident) => (
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
                    ))
                ) : (
                    <div className="no-incidents">
                        <AlertTriangle size={48} />
                        <h3>No Incidents Reported</h3>
                        <p>All junctions are operating normally</p>
                    </div>
                )}
            </div>

            <div className="public-note">
                <AlertTriangle size={16} />
                <span>If you witness an accident, please call emergency services at 112</span>
            </div>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { AlertTriangle, MapPin, Clock, AlertCircle, Loader, ArrowRight, Bell, Car, CheckCircle, Zap } from 'lucide-react'
import './PublicAlerts.css'
import { accidentsAPI } from '../../services/api'
import { useCorridor } from '../../context/CorridorContext'

export default function PublicAlerts() {
    const [accidents, setAccidents] = useState([])
    const [loading, setLoading] = useState(true)
    const { activeCorridor, corridorStatus, noticeCountdown } = useCorridor()

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 15000) // Refresh every 15 seconds
        return () => clearInterval(interval)
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const accidentData = await accidentsAPI.getAll({ limit: 20 }).catch(() => [])
            setAccidents(accidentData)
        } catch (err) {
            console.error('Failed to fetch data:', err)
        } finally {
            setLoading(false)
        }
    }

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'critical'
            case 'high': return 'high'
            case 'medium': case 'moderate': return 'medium'
            case 'low': case 'minor': return 'low'
            default: return 'medium'
        }
    }

    const getSeverityLabel = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return '🚨 Critical'
            case 'high': return '⚠️ High'
            case 'medium': case 'moderate': return '⚡ Moderate'
            case 'low': case 'minor': return '📌 Minor'
            default: return '⚡ Moderate'
        }
    }

    const formatTime = (dateString) => {
        if (!dateString) return 'Unknown'
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const getRemainingTime = () => {
        if (!activeCorridor?.endTime) return null
        const remaining = new Date(activeCorridor.endTime) - new Date()
        if (remaining <= 0) return null
        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        return `${minutes}m ${seconds}s`
    }

    const activeAccidents = accidents.filter(a => a.status === 'active')

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
                <h1>🚨 Emergency Alerts</h1>
                <p>Emergency corridors, accidents, and traffic incidents</p>
            </header>

            {/* Emergency Corridor Section */}
            <section className="corridor-section">
                <h2 className="section-title">
                    <Bell size={24} />
                    Emergency Corridor Status
                </h2>

                {corridorStatus !== 'idle' && activeCorridor ? (
                    <div className={`corridor-alert-card ${corridorStatus}`}>
                        <div className="corridor-header">
                            <div className="corridor-status-badge">
                                <Zap size={18} />
                                {corridorStatus === 'active' ? 'ACTIVE CORRIDOR' :
                                 corridorStatus === 'notice' ? 'CORRIDOR NOTICE' :
                                 'PREPARING CORRIDOR'}
                            </div>
                            <span className="corridor-type">{activeCorridor.type || 'Emergency'}</span>
                        </div>

                        <div className="corridor-route">
                            <h4>Route: {activeCorridor.junctions?.length || 0} Junctions</h4>
                            <div className="route-junctions">
                                {activeCorridor.junctions?.map((junction, index) => (
                                    <div key={junction.id} className="route-junction">
                                        <span className="junction-marker">{index + 1}</span>
                                        <div className="junction-details">
                                            <strong>{junction.name}</strong>
                                            <small>{junction.id}</small>
                                        </div>
                                        {index < activeCorridor.junctions.length - 1 && (
                                            <ArrowRight size={16} className="route-arrow" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="corridor-timing">
                            <div className="timing-item">
                                <Clock size={18} />
                                <div>
                                    <span>Duration</span>
                                    <strong>{activeCorridor.duration} minutes</strong>
                                </div>
                            </div>
                            {corridorStatus === 'active' && (
                                <div className="timing-item highlight">
                                    <Clock size={18} />
                                    <div>
                                        <span>Remaining</span>
                                        <strong>{getRemainingTime() || 'Calculating...'}</strong>
                                    </div>
                                </div>
                            )}
                            {corridorStatus === 'notice' && (
                                <div className="timing-item notice">
                                    <AlertCircle size={18} />
                                    <div>
                                        <span>Activating in</span>
                                        <strong>{Math.floor(noticeCountdown / 60)}m {noticeCountdown % 60}s</strong>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="corridor-warning">
                            <AlertTriangle size={16} />
                            <span>Please yield to emergency vehicles on this route. Signals are being controlled automatically.</span>
                        </div>
                    </div>
                ) : (
                    <div className="no-corridor">
                        <CheckCircle size={48} />
                        <h3>No Active Emergency Corridor</h3>
                        <p>All routes are operating normally</p>
                    </div>
                )}
            </section>

            {/* Accidents Section */}
            <section className="accidents-section">
                <h2 className="section-title">
                    <AlertTriangle size={24} />
                    Accident Reports
                    {activeAccidents.length > 0 && (
                        <span className="active-count">{activeAccidents.length} Active</span>
                    )}
                </h2>

                {accidents.length > 0 ? (
                    <div className="accidents-grid">
                        {accidents.map((accident) => (
                            <div key={accident.id} className={`accident-card ${getSeverityColor(accident.severity)} ${accident.status}`}>
                                <div className="accident-header">
                                    <div className={`severity-badge ${getSeverityColor(accident.severity)}`}>
                                        {getSeverityLabel(accident.severity)}
                                    </div>
                                    <span className={`status-badge ${accident.status}`}>
                                        {accident.status === 'active' ? '● Active' : '✓ Resolved'}
                                    </span>
                                </div>

                                <div className="accident-location">
                                    <MapPin size={18} />
                                    <div>
                                        <strong>{accident.location || `Junction ${accident.junction_id}`}</strong>
                                        <small>Junction: {accident.junction_id} | Camera: {accident.camera_id}</small>
                                    </div>
                                </div>

                                <div className="accident-meta">
                                    <div className="meta-item">
                                        <Clock size={14} />
                                        <span>{formatTime(accident.detected_at)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Car size={14} />
                                        <span>Confidence: {Math.round((accident.confidence || 0.8) * 100)}%</span>
                                    </div>
                                </div>

                                {accident.description && (
                                    <div className="accident-description">
                                        <p>{accident.description}</p>
                                    </div>
                                )}

                                {accident.image_path && (
                                    <div className="accident-image">
                                        <img
                                            src={accident.image_url || `http://localhost:8000/evidence/${accident.image_path.split('/').pop()}`}
                                            alt="Accident evidence"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                )}

                                {accident.resolved_at && (
                                    <div className="resolved-info">
                                        <span>Resolved at {formatTime(accident.resolved_at)} by {accident.resolved_by || 'System'}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-accidents">
                        <CheckCircle size={48} />
                        <h3>No Accidents Reported</h3>
                        <p>All junctions are operating safely</p>
                    </div>
                )}
            </section>

            <div className="public-note">
                <AlertTriangle size={16} />
                <span>In case of emergency, call 112. Data refreshes every 15 seconds.</span>
            </div>
        </div>
    )
}

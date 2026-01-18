import { useState, useEffect } from 'react'
import {
    Radio,
    Timer,
    Leaf,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
    ArrowRight,
    MapPin,
    Phone,
    Clock,
    Car,
    Shield,
    AlertCircle,
    Loader
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Dashboard.css'
import { systemStatsAPI, alertsAPI, accidentsAPI, junctionsAPI } from '../../services/api'

// Custom accident icon
const accidentIcon = L.divIcon({
    className: 'accident-marker-icon',
    html: `<div class="accident-pulse"></div><div class="accident-icon">⚠️</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
})

// Get color based on status
const getStatusColor = (status) => {
    switch (status) {
        case 'green': return '#16a34a'
        case 'yellow': return '#f59e0b'
        case 'red': return '#dc2626'
        default: return '#64748b'
    }
}

// Determine traffic status based on total phases or camera count
const getTrafficStatus = (junction) => {
    // Simple logic based on total_phases or random for demo
    const phases = junction.total_phases || 4
    if (phases <= 3) return 'green'
    if (phases === 4) return 'yellow'
    return 'red'
}

// Map center (Delhi, India)
const mapCenter = [28.6139, 77.2090]

export default function Dashboard() {
    const [stats, setStats] = useState([
        { label: 'Active Signals', value: '...', icon: Radio, type: 'primary', change: 'Loading...', trend: 'neutral' },
        { label: 'Avg Wait Time', value: '...', icon: Timer, type: 'success', change: 'Loading...', trend: 'neutral' },
        { label: 'CO₂ Saved', value: '...', icon: Leaf, type: 'success', change: 'Loading...', trend: 'neutral' },
        { label: 'Active Accidents', value: '...', icon: AlertTriangle, type: 'danger', change: 'Loading...', trend: 'neutral' },
    ])
    const [recentAlerts, setRecentAlerts] = useState([])
    const [activeAccidents, setActiveAccidents] = useState([])
    const [mapJunctions, setMapJunctions] = useState([])
    const [topJunctions, setTopJunctions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        setError(null)
        try {
            // Fetch all data in parallel
            const [systemStats, alerts, accidents, junctions] = await Promise.all([
                systemStatsAPI.get().catch(() => null),
                alertsAPI.getAll(null, 5).catch(() => []),
                accidentsAPI.getAll({ status: 'active', limit: 10 }).catch(() => []),
                junctionsAPI.getAll().catch(() => [])
            ])

            // Update stats
            if (systemStats) {
                setStats([
                    {
                        label: 'Active Signals',
                        value: String(systemStats.active_signals || 0),
                        icon: Radio,
                        type: 'primary',
                        change: '+3 today',
                        trend: 'positive'
                    },
                    {
                        label: 'Avg Wait Time',
                        value: `${systemStats.avg_wait_time || 0}s`,
                        icon: Timer,
                        type: 'success',
                        change: '-5s from yesterday',
                        trend: 'positive'
                    },
                    {
                        label: 'CO₂ Saved',
                        value: `${systemStats.co2_saved_today || 0} tons`,
                        icon: Leaf,
                        type: 'success',
                        change: '+0.3 today',
                        trend: 'positive'
                    },
                    {
                        label: 'Active Accidents',
                        value: String(accidents.length || systemStats.incidents_today || 0),
                        icon: AlertTriangle,
                        type: 'danger',
                        change: `${accidents.length} active`,
                        trend: 'neutral'
                    },
                ])
            }

            // Update recent alerts
            if (alerts && alerts.length > 0) {
                setRecentAlerts(alerts.slice(0, 3).map(alert => ({
                    id: alert.id,
                    type: alert.type,
                    message: alert.message,
                    time: new Date(alert.created_at).toLocaleString(),
                    severity: alert.type === 'incident' ? 'danger' : 'warning'
                })))
            }

            // Update active accidents
            if (accidents && accidents.length > 0) {
                setActiveAccidents(accidents.map(acc => ({
                    id: `A-${acc.id}`,
                    junction: acc.location || `Junction ${acc.junction_id}`,
                    junctionId: acc.junction_id,
                    severity: getSeverityLevel(acc.severity),
                    severityLabel: acc.severity || 'Unknown',
                    time: new Date(acc.detected_at).toLocaleTimeString(),
                    description: acc.description || 'Accident detected',
                    ambulanceETA: '5 min',
                    policeETA: '7 min',
                    ambulanceDispatched: true,
                    policeDispatched: true,
                    hospitalName: 'City General Hospital',
                    hospitalPhone: '+91 80 2345 6789'
                })))
            }

            // Update junctions for map
            if (junctions && junctions.length > 0) {
                const mappedJunctions = junctions.map(j => ({
                    id: j.id,
                    name: j.name,
                    lat: parseFloat(j.latitude) || 12.9716 + (Math.random() - 0.5) * 0.02,
                    lng: parseFloat(j.longitude) || 77.5946 + (Math.random() - 0.5) * 0.02,
                    status: getTrafficStatus(j),
                    vehicles: Math.floor(Math.random() * 500) + 500,
                    hasAccident: accidents.some(a => a.junction_id === j.id)
                }))
                setMapJunctions(mappedJunctions)

                // Top junctions (first 4)
                setTopJunctions(junctions.slice(0, 4).map(j => ({
                    id: j.id,
                    name: j.name,
                    vehicleCount: Math.floor(Math.random() * 500) + 500,
                    status: getTrafficStatus(j)
                })))
            }

        } catch (err) {
            console.error('Dashboard data fetch error:', err)
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const getSeverityLevel = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 5
            case 'high': return 4
            case 'medium': return 3
            case 'low': return 2
            default: return 1
        }
    }

    if (loading) {
        return (
            <div className="dashboard loading-state">
                <div className="loading-spinner">
                    <Loader className="spin" size={32} />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Traffic management overview</p>
                </div>
                {error && <div className="error-banner">{error}</div>}
            </header>

            {/* Active Accidents Alert Banner */}
            {activeAccidents.length > 0 && (
                <div className="accidents-banner">
                    <div className="accidents-banner-header">
                        <AlertCircle size={20} />
                        <span>{activeAccidents.length} Active Accident{activeAccidents.length > 1 ? 's' : ''} - Response In Progress</span>
                        <Link to="/admin/alerts" className="btn btn-sm btn-danger">View Details</Link>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid-4 stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className={`stat-icon ${stat.type}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">{stat.label}</p>
                            <h3 className="stat-value">{stat.value}</h3>
                            <p className={`stat-change ${stat.trend}`}>
                                {stat.trend === 'positive' && <TrendingDown size={14} />}
                                {stat.trend === 'negative' && <TrendingUp size={14} />}
                                {stat.change}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Accidents Section */}
            {activeAccidents.length > 0 && (
                <div className="accidents-section">
                    <h3 className="section-title">
                        <AlertTriangle size={20} />
                        Active Accidents
                    </h3>
                    <div className="accidents-grid">
                        {activeAccidents.map((accident) => (
                            <div key={accident.id} className={`accident-card severity-${accident.severity}`}>
                                <div className="accident-card-header">
                                    <div className="accident-location-info">
                                        <MapPin size={16} />
                                        <span>{accident.junction}</span>
                                    </div>
                                    <span className="accident-time">
                                        <Clock size={14} />
                                        {accident.time}
                                    </span>
                                </div>

                                {/* Severity Scale */}
                                <div className="severity-section">
                                    <span className="severity-label">Severity Level</span>
                                    <div className="severity-scale">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <div
                                                key={level}
                                                className={`severity-bar ${level <= accident.severity ? 'active' : ''}`}
                                            ></div>
                                        ))}
                                        <span className="severity-text">{accident.severityLabel}</span>
                                    </div>
                                </div>

                                <p className="accident-description">{accident.description}</p>

                                {/* Response Status */}
                                <div className="response-status">
                                    <div className={`response-item ${accident.ambulanceDispatched ? 'dispatched' : ''}`}>
                                        <Car size={16} />
                                        <div className="response-info">
                                            <span className="response-type">Ambulance</span>
                                            <span className="response-eta">ETA: {accident.ambulanceETA}</span>
                                        </div>
                                    </div>
                                    <div className={`response-item ${accident.policeDispatched ? 'dispatched' : ''}`}>
                                        <Shield size={16} />
                                        <div className="response-info">
                                            <span className="response-type">Traffic Police</span>
                                            <span className="response-eta">ETA: {accident.policeETA}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Hospital Contact */}
                                <div className="hospital-contact">
                                    <span className="hospital-name">{accident.hospitalName}</span>
                                    <a href={`tel:${accident.hospitalPhone}`} className="hospital-phone">
                                        <Phone size={14} />
                                        {accident.hospitalPhone}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Interactive Map with OpenStreetMap */}
                <div className="card map-card">
                    <div className="card-header">
                        <h3 className="card-title">City Overview</h3>
                        <Link to="/admin/live-traffic" className="btn btn-secondary btn-sm">
                            View Full Map <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="map-container">
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
                            {/* Normal junction markers (non-accident) */}
                            {mapJunctions.filter(j => !j.hasAccident).map((junction) => (
                                <CircleMarker
                                    key={junction.id}
                                    center={[junction.lat, junction.lng]}
                                    radius={8}
                                    fillColor={getStatusColor(junction.status)}
                                    color="#ffffff"
                                    weight={2}
                                    opacity={1}
                                    fillOpacity={0.8}
                                >
                                    <Popup>
                                        <div className="map-popup">
                                            <div className="popup-header">
                                                <span className={`status-dot ${junction.status}`}></span>
                                                <strong>{junction.name}</strong>
                                            </div>
                                            <div className="popup-body">
                                                <span>ID: {junction.id}</span>
                                                <span>{junction.vehicles} vehicles/hr</span>
                                            </div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ))}
                            {/* Accident markers with higher priority (rendered on top) */}
                            {mapJunctions.filter(j => j.hasAccident).map((junction) => (
                                <Marker
                                    key={junction.id}
                                    position={[junction.lat, junction.lng]}
                                    icon={accidentIcon}
                                    zIndexOffset={1000}
                                >
                                    <Popup>
                                        <div className="map-popup accident">
                                            <div className="popup-header accident">
                                                <span className="accident-badge">⚠️ ACCIDENT</span>
                                            </div>
                                            <div className="popup-body">
                                                <strong>{junction.name}</strong>
                                                <span>ID: {junction.id}</span>
                                                <span>{junction.vehicles} vehicles/hr</span>
                                                <span className="popup-accident">Emergency response active</span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Map Legend */}
                        <div className="map-legend">
                            <div className="legend-item">
                                <span className="legend-dot green"></span>
                                <span>Normal</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot yellow"></span>
                                <span>Moderate</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot red"></span>
                                <span>Heavy</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-accident">⚠️</span>
                                <span>Accident</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="dashboard-sidebar">
                    {/* Recent Alerts */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Recent Alerts</h3>
                            <Link to="/admin/alerts" className="view-all">View all</Link>
                        </div>
                        <div className="alerts-list">
                            {recentAlerts.length > 0 ? (
                                recentAlerts.map((alert) => (
                                    <div key={alert.id} className="alert-item">
                                        <div className={`alert-indicator ${alert.severity}`}></div>
                                        <div className="alert-content">
                                            <p className="alert-message">{alert.message}</p>
                                            <span className="alert-time">{alert.time}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No recent alerts</p>
                            )}
                        </div>
                    </div>

                    {/* Top Junctions */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Top Junctions by Traffic</h3>
                            <Link to="/admin/live-traffic" className="view-all">View all</Link>
                        </div>
                        <div className="junctions-list">
                            {topJunctions.length > 0 ? (
                                topJunctions.map((junction) => (
                                    <div key={junction.id} className="junction-item">
                                        <div className="junction-info">
                                            <span className={`signal-indicator ${junction.status}`}></span>
                                            <div>
                                                <p className="junction-name">{junction.name}</p>
                                                <span className="junction-id">{junction.id}</span>
                                            </div>
                                        </div>
                                        <span className="junction-count">{junction.vehicleCount} vehicles/hr</span>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No junction data</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

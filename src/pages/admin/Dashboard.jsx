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
    AlertCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Dashboard.css'

// Custom accident icon
const accidentIcon = L.divIcon({
    className: 'accident-marker-icon',
    html: `<div class="accident-pulse"></div><div class="accident-icon">⚠️</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
})

// Sample data for demonstration
const stats = [
    {
        label: 'Active Signals',
        value: '247',
        icon: Radio,
        type: 'primary',
        change: '+3 today',
        trend: 'positive'
    },
    {
        label: 'Avg Wait Time',
        value: '32s',
        icon: Timer,
        type: 'success',
        change: '-5s from yesterday',
        trend: 'positive'
    },
    {
        label: 'CO₂ Saved',
        value: '2.4 tons',
        icon: Leaf,
        type: 'success',
        change: '+0.3 today',
        trend: 'positive'
    },
    {
        label: 'Active Accidents',
        value: '2',
        icon: AlertTriangle,
        type: 'danger',
        change: '1 resolved today',
        trend: 'neutral'
    },
]

const recentAlerts = [
    { id: 1, type: 'violation', message: 'Signal violation at Junction 15', time: '5 min ago', severity: 'warning' },
    { id: 2, type: 'incident', message: 'Accident reported near MG Road', time: '12 min ago', severity: 'danger' },
    { id: 3, type: 'maintenance', message: 'Camera offline at Junction 8', time: '25 min ago', severity: 'warning' },
]

const topJunctions = [
    { id: 'J-015', name: 'City Center', vehicleCount: 1250, status: 'green' },
    { id: 'J-023', name: 'MG Road Crossing', vehicleCount: 980, status: 'yellow' },
    { id: 'J-007', name: 'Railway Station', vehicleCount: 875, status: 'green' },
    { id: 'J-031', name: 'Industrial Area', vehicleCount: 720, status: 'red' },
]

// Junction markers for OpenStreetMap (Bangalore coordinates)
const mapJunctions = [
    { id: 'J-001', name: 'City Center', lat: 12.9716, lng: 77.5946, status: 'green', vehicles: 1250 },
    { id: 'J-002', name: 'MG Road Crossing', lat: 12.9756, lng: 77.6066, status: 'red', vehicles: 980, hasAccident: true },
    { id: 'J-003', name: 'Railway Station', lat: 12.9779, lng: 77.5728, status: 'green', vehicles: 875 },
    { id: 'J-004', name: 'Industrial Area', lat: 12.9850, lng: 77.6150, status: 'yellow', vehicles: 720 },
    { id: 'J-005', name: 'Hospital Road', lat: 12.9600, lng: 77.5800, status: 'green', vehicles: 650 },
    { id: 'J-006', name: 'Tech Park Gate', lat: 12.9680, lng: 77.6200, status: 'green', vehicles: 580 },
    { id: 'J-007', name: 'Stadium Junction', lat: 12.9800, lng: 77.5950, status: 'yellow', vehicles: 520 },
    { id: 'J-008', name: 'Market Square', lat: 12.9650, lng: 77.5850, status: 'green', vehicles: 490 },
]

// Map center (Bangalore)
const mapCenter = [12.9716, 77.5946]

// Get color based on status
const getStatusColor = (status) => {
    switch (status) {
        case 'green': return '#16a34a'
        case 'yellow': return '#f59e0b'
        case 'red': return '#dc2626'
        default: return '#64748b'
    }
}

// Active accidents data
const activeAccidents = [
    {
        id: 'A-001',
        junction: 'MG Road Crossing',
        junctionId: 'J-002',
        severity: 4,
        severityLabel: 'Severe',
        time: '14:20',
        description: 'Multi-vehicle collision, injuries reported',
        ambulanceETA: '3 min',
        policeETA: '5 min',
        ambulanceDispatched: true,
        policeDispatched: true,
        hospitalName: 'City General Hospital',
        hospitalPhone: '+91 80 2345 6789'
    },
    {
        id: 'A-002',
        junction: 'Railway Station Junction',
        junctionId: 'J-003',
        severity: 2,
        severityLabel: 'Moderate',
        time: '13:45',
        description: 'Two-wheeler collision, minor injuries',
        ambulanceETA: '2 min',
        policeETA: '4 min',
        ambulanceDispatched: true,
        policeDispatched: true,
        hospitalName: 'Apollo Clinic',
        hospitalPhone: '+91 80 3456 7890'
    }
]

export default function Dashboard() {
    return (
        <div className="dashboard">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Traffic management overview</p>
                </div>
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
                            {recentAlerts.map((alert) => (
                                <div key={alert.id} className="alert-item">
                                    <div className={`alert-indicator ${alert.severity}`}></div>
                                    <div className="alert-content">
                                        <p className="alert-message">{alert.message}</p>
                                        <span className="alert-time">{alert.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Junctions */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Top Junctions by Traffic</h3>
                            <Link to="/admin/live-traffic" className="view-all">View all</Link>
                        </div>
                        <div className="junctions-list">
                            {topJunctions.map((junction) => (
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
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

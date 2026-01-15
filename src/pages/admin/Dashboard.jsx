import {
    Radio,
    Timer,
    Leaf,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
    ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

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
        label: 'Incidents Today',
        value: '3',
        icon: AlertTriangle,
        type: 'warning',
        change: '2 resolved',
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

export default function Dashboard() {
    return (
        <div className="dashboard">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Traffic management overview</p>
                </div>
            </header>

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

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Map Preview */}
                <div className="card map-card">
                    <div className="card-header">
                        <h3 className="card-title">City Overview</h3>
                        <Link to="/admin/live-traffic" className="btn btn-secondary btn-sm">
                            View Full Map <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="map-placeholder">
                        <div className="map-message">
                            <Radio size={48} />
                            <p>Interactive map showing all 247 active signals</p>
                            <span>Click "View Full Map" for detailed view</span>
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

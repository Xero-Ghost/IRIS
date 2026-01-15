import { MapPin, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import './PublicTraffic.css'

// Sample junction traffic status
const junctionStatus = [
    { id: 'J-001', name: 'City Center', traffic: 'low', waitTime: '15s' },
    { id: 'J-002', name: 'MG Road Crossing', traffic: 'high', waitTime: '45s' },
    { id: 'J-003', name: 'Railway Station', traffic: 'high', waitTime: '52s' },
    { id: 'J-004', name: 'Industrial Area', traffic: 'medium', waitTime: '28s' },
    { id: 'J-005', name: 'Hospital Road', traffic: 'low', waitTime: '12s' },
    { id: 'J-006', name: 'Market Square', traffic: 'high', waitTime: '48s' },
    { id: 'J-007', name: 'Tech Park Gate', traffic: 'medium', waitTime: '32s' },
    { id: 'J-008', name: 'Stadium Junction', traffic: 'low', waitTime: '18s' },
    { id: 'J-009', name: 'Bus Stand', traffic: 'medium', waitTime: '35s' },
    { id: 'J-010', name: 'University Gate', traffic: 'low', waitTime: '20s' },
]

export default function PublicTraffic() {
    const getTrafficColor = (level) => {
        switch (level) {
            case 'low': return 'success'
            case 'medium': return 'warning'
            case 'high': return 'danger'
            default: return 'primary'
        }
    }

    const highTrafficCount = junctionStatus.filter(j => j.traffic === 'high').length
    const avgWaitTime = Math.round(junctionStatus.reduce((acc, j) => acc + parseInt(j.waitTime), 0) / junctionStatus.length)

    return (
        <div className="public-traffic">
            <header className="public-page-header">
                <h1>Live Traffic Status</h1>
                <p>Check current traffic conditions across the city</p>
            </header>

            {/* Summary Cards */}
            <div className="public-stats">
                <div className="public-stat-card">
                    <div className="stat-icon warning">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <span className="stat-value">{highTrafficCount}</span>
                        <span className="stat-label">High Traffic Junctions</span>
                    </div>
                </div>
                <div className="public-stat-card">
                    <div className="stat-icon primary">
                        <Clock size={24} />
                    </div>
                    <div>
                        <span className="stat-value">{avgWaitTime}s</span>
                        <span className="stat-label">Average Wait Time</span>
                    </div>
                </div>
                <div className="public-stat-card">
                    <div className="stat-icon success">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <span className="stat-value">92%</span>
                        <span className="stat-label">Signal Efficiency</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="traffic-legend">
                <span><i className="dot low"></i> Low Traffic</span>
                <span><i className="dot medium"></i> Medium Traffic</span>
                <span><i className="dot high"></i> High Traffic - Avoid</span>
            </div>

            {/* Junction List */}
            <div className="junction-grid">
                {junctionStatus.map((junction) => (
                    <div key={junction.id} className={`junction-status-card ${junction.traffic}`}>
                        <div className="junction-status-header">
                            <span className={`traffic-badge ${getTrafficColor(junction.traffic)}`}>
                                {junction.traffic.toUpperCase()}
                            </span>
                            <span className="wait-time">
                                <Clock size={14} />
                                {junction.waitTime}
                            </span>
                        </div>
                        <h3 className="junction-name">{junction.name}</h3>
                        <p className="junction-id">
                            <MapPin size={14} />
                            {junction.id}
                        </p>
                    </div>
                ))}
            </div>

            <div className="public-note">
                <AlertTriangle size={16} />
                <span>Data refreshes automatically every 30 seconds. For real-time updates, please refresh the page.</span>
            </div>
        </div>
    )
}

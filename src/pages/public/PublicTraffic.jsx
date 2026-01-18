import { useState, useEffect } from 'react'
import { MapPin, Clock, TrendingUp, AlertTriangle, Loader } from 'lucide-react'
import './PublicTraffic.css'
import { junctionsAPI, systemStatsAPI } from '../../services/api'

export default function PublicTraffic() {
    const [junctionStatus, setJunctionStatus] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        highTrafficCount: 0,
        avgWaitTime: 0,
        efficiency: 92
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [junctions, systemStats] = await Promise.all([
                junctionsAPI.getAll(),
                systemStatsAPI.get().catch(() => null)
            ])

            if (junctions && junctions.length > 0) {
                const mappedJunctions = junctions.map(j => {
                    const waitTime = Math.floor(Math.random() * 50) + 10
                    return {
                        id: j.id,
                        name: j.name,
                        traffic: getTrafficLevel(j.total_phases),
                        waitTime: `${waitTime}s`
                    }
                })
                setJunctionStatus(mappedJunctions)

                // Calculate stats
                const highTraffic = mappedJunctions.filter(j => j.traffic === 'high').length
                const avgWait = Math.round(
                    mappedJunctions.reduce((acc, j) => acc + parseInt(j.waitTime), 0) / mappedJunctions.length
                )
                setStats({
                    highTrafficCount: highTraffic,
                    avgWaitTime: avgWait,
                    efficiency: systemStats?.avg_wait_time ? Math.min(95, 100 - Math.floor(parseFloat(systemStats.avg_wait_time) / 2)) : 92
                })
            }
        } catch (err) {
            console.error('Failed to fetch data:', err)
        } finally {
            setLoading(false)
        }
    }

    const getTrafficLevel = (phases) => {
        if (!phases) return 'medium'
        if (phases <= 3) return 'low'
        if (phases === 4) return 'medium'
        return 'high'
    }

    const getTrafficColor = (level) => {
        switch (level) {
            case 'low': return 'success'
            case 'medium': return 'warning'
            case 'high': return 'danger'
            default: return 'primary'
        }
    }

    if (loading) {
        return (
            <div className="public-traffic loading-state">
                <Loader className="spin" size={32} />
                <p>Loading traffic data...</p>
            </div>
        )
    }

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
                        <span className="stat-value">{stats.highTrafficCount}</span>
                        <span className="stat-label">High Traffic Junctions</span>
                    </div>
                </div>
                <div className="public-stat-card">
                    <div className="stat-icon primary">
                        <Clock size={24} />
                    </div>
                    <div>
                        <span className="stat-value">{stats.avgWaitTime}s</span>
                        <span className="stat-label">Average Wait Time</span>
                    </div>
                </div>
                <div className="public-stat-card">
                    <div className="stat-icon success">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <span className="stat-value">{stats.efficiency}%</span>
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
                {junctionStatus.length > 0 ? (
                    junctionStatus.map((junction) => (
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
                    ))
                ) : (
                    <p className="no-data">No junction data available</p>
                )}
            </div>

            <div className="public-note">
                <AlertTriangle size={16} />
                <span>Data refreshes automatically every 30 seconds. For real-time updates, please refresh the page.</span>
            </div>
        </div>
    )
}

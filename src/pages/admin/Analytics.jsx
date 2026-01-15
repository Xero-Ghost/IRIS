import {
    TrendingDown,
    TrendingUp,
    Clock,
    Leaf,
    Car,
    BarChart3
} from 'lucide-react'
import './Analytics.css'

export default function Analytics() {
    return (
        <div className="analytics-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Traffic performance metrics and reports</p>
                </div>
                <div className="date-filter">
                    <select className="form-select">
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 3 months</option>
                        <option>Last year</option>
                    </select>
                </div>
            </header>

            {/* Summary Stats */}
            <div className="grid-4 analytics-stats">
                <div className="stat-card">
                    <div className="stat-icon success">
                        <TrendingDown size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Avg Wait Time Reduction</p>
                        <h3 className="stat-value">28%</h3>
                        <p className="stat-change positive">
                            <TrendingDown size={14} /> vs. before IRIS
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">
                        <Leaf size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">CO₂ Reduction</p>
                        <h3 className="stat-value">156 tons</h3>
                        <p className="stat-change positive">
                            <TrendingUp size={14} /> +12% this month
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon primary">
                        <Car size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Daily Vehicle Flow</p>
                        <h3 className="stat-value">45.2K</h3>
                        <p className="stat-change positive">
                            <TrendingUp size={14} /> +8% efficiency
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Peak Hour Avg Wait</p>
                        <h3 className="stat-value">42s</h3>
                        <p className="stat-change positive">
                            <TrendingDown size={14} /> -18s improvement
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="analytics-grid">
                <div className="card chart-card">
                    <div className="card-header">
                        <h3 className="card-title">Traffic Volume Trend</h3>
                        <div className="chart-legend">
                            <span><i className="dot primary"></i> This Week</span>
                            <span><i className="dot muted"></i> Last Week</span>
                        </div>
                    </div>
                    <div className="chart-placeholder">
                        <BarChart3 size={48} />
                        <p>Traffic volume chart</p>
                        <span>Shows hourly traffic patterns</span>
                    </div>
                </div>

                <div className="card chart-card">
                    <div className="card-header">
                        <h3 className="card-title">Wait Time by Junction</h3>
                    </div>
                    <div className="chart-placeholder">
                        <Clock size={48} />
                        <p>Wait time comparison</p>
                        <span>Before vs after IRIS deployment</span>
                    </div>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid-2">
                <div className="card">
                    <h3 className="card-title">Top Performing Junctions</h3>
                    <div className="ranking-list">
                        {[
                            { rank: 1, name: 'Tech Park Gate', improvement: '+35%' },
                            { rank: 2, name: 'City Center', improvement: '+32%' },
                            { rank: 3, name: 'Hospital Road', improvement: '+28%' },
                            { rank: 4, name: 'Stadium Junction', improvement: '+25%' },
                            { rank: 5, name: 'Railway Station', improvement: '+22%' },
                        ].map(item => (
                            <div key={item.rank} className="ranking-item">
                                <span className="rank">#{item.rank}</span>
                                <span className="name">{item.name}</span>
                                <span className="improvement positive">{item.improvement}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-title">Environmental Impact</h3>
                    <div className="impact-stats">
                        <div className="impact-item">
                            <div className="impact-icon">
                                <Leaf size={20} />
                            </div>
                            <div className="impact-content">
                                <span className="impact-value">156 tons</span>
                                <span className="impact-label">CO₂ saved this month</span>
                            </div>
                        </div>
                        <div className="impact-item">
                            <div className="impact-icon fuel">
                                <Car size={20} />
                            </div>
                            <div className="impact-content">
                                <span className="impact-value">52,000 L</span>
                                <span className="impact-label">Fuel saved (estimated)</span>
                            </div>
                        </div>
                        <div className="impact-item">
                            <div className="impact-icon time">
                                <Clock size={20} />
                            </div>
                            <div className="impact-content">
                                <span className="impact-value">12,400 hrs</span>
                                <span className="impact-label">Commuter time saved</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

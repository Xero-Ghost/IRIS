import { useState } from 'react'
import { Search, Filter, Car, Bike, Truck, MapPin, TrendingUp, BarChart3 } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './LiveTraffic.css'

// Fix for default marker icons in Leaflet with webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom blue marker icon
const createCustomIcon = (isSelected) => {
    const size = isSelected ? 20 : 16
    const color = isSelected ? '#1d4ed8' : '#3b82f6'
    const borderColor = isSelected ? '#fbbf24' : '#ffffff'

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div class="marker-wrapper ${isSelected ? 'selected' : ''}">
                <div class="marker-dot" style="
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border: 3px solid ${borderColor};
                    border-radius: 50%;
                    box-shadow: ${isSelected ? '0 0 0 4px rgba(251, 191, 36, 0.3),' : ''} 0 2px 8px rgba(59, 130, 246, 0.5);
                "></div>
                ${isSelected ? '<div class="marker-pulse-ring"></div>' : ''}
            </div>
        `,
        iconSize: [size + 10, size + 10],
        iconAnchor: [(size + 10) / 2, (size + 10) / 2],
    })
}

// Sample junction data with real lat/lng coordinates (Bangalore, India area)
const junctionsData = [
    {
        id: 'J-001',
        name: 'City Center',
        status: 'green',
        vehicles: { twoWheeler: 145, lightVehicle: 89, heavyVehicle: 12 },
        totalFlow: 246,
        avgWait: '28s',
        coordinates: { lat: 12.9716, lng: 77.5946 },
    },
    {
        id: 'J-002',
        name: 'MG Road Crossing',
        status: 'yellow',
        vehicles: { twoWheeler: 178, lightVehicle: 112, heavyVehicle: 8 },
        totalFlow: 298,
        avgWait: '45s',
        coordinates: { lat: 12.9758, lng: 77.6066 },
    },
    {
        id: 'J-003',
        name: 'Railway Station',
        status: 'red',
        vehicles: { twoWheeler: 210, lightVehicle: 156, heavyVehicle: 24 },
        totalFlow: 390,
        avgWait: '62s',
        coordinates: { lat: 12.9766, lng: 77.5713 },
    },
    {
        id: 'J-004',
        name: 'Industrial Area',
        status: 'green',
        vehicles: { twoWheeler: 67, lightVehicle: 45, heavyVehicle: 38 },
        totalFlow: 150,
        avgWait: '22s',
        coordinates: { lat: 12.9634, lng: 77.6200 },
    },
    {
        id: 'J-005',
        name: 'Hospital Road',
        status: 'green',
        vehicles: { twoWheeler: 98, lightVehicle: 76, heavyVehicle: 5 },
        totalFlow: 179,
        avgWait: '31s',
        coordinates: { lat: 12.9568, lng: 77.5810 },
    },
    {
        id: 'J-006',
        name: 'Market Square',
        status: 'yellow',
        vehicles: { twoWheeler: 189, lightVehicle: 134, heavyVehicle: 15 },
        totalFlow: 338,
        avgWait: '48s',
        coordinates: { lat: 12.9850, lng: 77.5850 },
    },
    {
        id: 'J-007',
        name: 'Tech Park Gate',
        status: 'green',
        vehicles: { twoWheeler: 156, lightVehicle: 198, heavyVehicle: 3 },
        totalFlow: 357,
        avgWait: '35s',
        coordinates: { lat: 12.9698, lng: 77.6150 },
    },
    {
        id: 'J-008',
        name: 'Stadium Junction',
        status: 'green',
        vehicles: { twoWheeler: 78, lightVehicle: 52, heavyVehicle: 7 },
        totalFlow: 137,
        avgWait: '18s',
        coordinates: { lat: 12.9784, lng: 77.5990 },
    },
]

// Calculate total traffic flow across all junctions
const totalTrafficFlow = junctionsData.reduce((sum, j) => sum + j.totalFlow, 0)

// Calculate density percentage for each junction (contribution to total traffic)
const getJunctionDensity = (junction) => {
    return Math.round((junction.totalFlow / totalTrafficFlow) * 100)
}

// Get density level based on traffic flow (Low, Medium, High)
const getDensityLevel = (totalFlow) => {
    if (totalFlow >= 300) return 'high'
    if (totalFlow >= 200) return 'medium'
    return 'low'
}

// Function to get density color based on traffic flow level
const getDensityColor = (densityPercent) => {
    // Find the junction by density percent to get actual flow
    const junction = junctionsData.find(j => getJunctionDensity(j) === densityPercent)
    const totalFlow = junction?.totalFlow || 0

    if (totalFlow >= 300) return '#ef4444' // Red - High
    if (totalFlow >= 200) return '#eab308' // Yellow - Medium
    return '#22c55e' // Green - Low
}

// Get color by flow directly
const getColorByFlow = (totalFlow) => {
    if (totalFlow >= 300) return '#ef4444' // Red - High
    if (totalFlow >= 200) return '#eab308' // Yellow - Medium
    return '#22c55e' // Green - Low
}

// Get heat circle radius based on density percentage
const getHeatRadius = (densityPercent) => {
    // Larger radius for higher density contribution
    return 15 + (densityPercent * 1.5)
}

// Seeded random for consistent data generation
const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

// Generate sample hourly data for a junction (with consistent seed)
const generateHourlyData = (junctionId) => {
    const junction = junctionsData.find(j => j.id === junctionId)
    const baseFlow = junction?.totalFlow || 200
    const junctionIndex = junctionsData.findIndex(j => j.id === junctionId)
    const hours = []
    for (let i = 0; i < 24; i++) {
        // Simulate traffic pattern: low at night, peaks at 9am and 6pm
        let multiplier = 0.3
        const seed = junctionIndex * 100 + i
        const randomValue = seededRandom(seed) * 0.4

        if (i >= 7 && i <= 10) multiplier = 0.8 + randomValue
        else if (i >= 11 && i <= 16) multiplier = 0.5 + randomValue * 0.75
        else if (i >= 17 && i <= 20) multiplier = 0.9 + randomValue * 0.75
        else if (i >= 21 || i <= 5) multiplier = 0.2 + randomValue * 0.5

        hours.push({
            time: `${i.toString().padStart(2, '0')}:00`,
            density: Math.round(baseFlow * multiplier),
        })
    }
    return hours
}

// Generate daily data for a month (with consistent seed)
const generateDailyData = (junctionId) => {
    const junction = junctionsData.find(j => j.id === junctionId)
    const baseFlow = junction?.totalFlow || 200
    const junctionIndex = junctionsData.findIndex(j => j.id === junctionId)
    const days = []
    for (let i = 1; i <= 30; i++) {
        // Weekend has lower traffic
        const isWeekend = i % 7 === 0 || i % 7 === 6
        const seed = junctionIndex * 1000 + i
        const randomValue = seededRandom(seed)
        const multiplier = isWeekend ? 0.6 + randomValue * 0.3 : 0.8 + randomValue * 0.4
        days.push({
            time: `Day ${i}`,
            density: Math.round(baseFlow * multiplier * 24), // Daily total
        })
    }
    return days
}

// Generate monthly data for a year (with consistent seed)
const generateMonthlyData = (junctionId) => {
    const junction = junctionsData.find(j => j.id === junctionId)
    const baseFlow = junction?.totalFlow || 200
    const junctionIndex = junctionsData.findIndex(j => j.id === junctionId)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((month, i) => {
        // Seasonal variation
        const seed = junctionIndex * 10000 + i
        const randomValue = seededRandom(seed) * 0.2
        const multiplier = 0.7 + Math.sin((i / 12) * Math.PI * 2) * 0.3 + randomValue
        return {
            time: month,
            density: Math.round(baseFlow * multiplier * 24 * 30), // Monthly total
        }
    })
}

// Generate comparative data for multiple junctions (with consistent seed)
const generateComparativeHourlyData = (junctionIds) => {
    const hours = []
    for (let i = 0; i < 24; i++) {
        const hourData = { time: `${i.toString().padStart(2, '0')}:00` }

        junctionIds.forEach(jId => {
            const junction = junctionsData.find(j => j.id === jId)
            if (junction) {
                const baseFlow = junction.totalFlow
                const junctionIndex = junctionsData.findIndex(j => j.id === jId)
                let multiplier = 0.3
                const seed = junctionIndex * 100 + i
                const randomValue = seededRandom(seed) * 0.4

                if (i >= 7 && i <= 10) multiplier = 0.8 + randomValue
                else if (i >= 11 && i <= 16) multiplier = 0.5 + randomValue * 0.75
                else if (i >= 17 && i <= 20) multiplier = 0.9 + randomValue * 0.75
                else if (i >= 21 || i <= 5) multiplier = 0.2 + randomValue * 0.5

                hourData[junction.name] = Math.round(baseFlow * multiplier)
            }
        })
        hours.push(hourData)
    }
    return hours
}

const generateComparativeDailyData = (junctionIds) => {
    const days = []
    for (let i = 1; i <= 30; i++) {
        const dayData = { time: `Day ${i}` }
        const isWeekend = i % 7 === 0 || i % 7 === 6

        junctionIds.forEach(jId => {
            const junction = junctionsData.find(j => j.id === jId)
            if (junction) {
                const baseFlow = junction.totalFlow
                const junctionIndex = junctionsData.findIndex(j => j.id === jId)
                const seed = junctionIndex * 1000 + i
                const randomValue = seededRandom(seed)
                const multiplier = isWeekend ? 0.6 + randomValue * 0.3 : 0.8 + randomValue * 0.4
                dayData[junction.name] = Math.round(baseFlow * multiplier * 24)
            }
        })
        days.push(dayData)
    }
    return days
}

const generateComparativeMonthlyData = (junctionIds) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((month, i) => {
        const monthData = { time: month }

        junctionIds.forEach(jId => {
            const junction = junctionsData.find(j => j.id === jId)
            if (junction) {
                const baseFlow = junction.totalFlow
                const junctionIndex = junctionsData.findIndex(j => j.id === jId)
                const seed = junctionIndex * 10000 + i
                const randomValue = seededRandom(seed) * 0.2
                const multiplier = 0.7 + Math.sin((i / 12) * Math.PI * 2) * 0.3 + randomValue
                monthData[junction.name] = Math.round(baseFlow * multiplier * 24 * 30)
            }
        })
        return monthData
    })
}

// Chart colors for comparison
const chartColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

// Component to fly to selected junction
function FlyToMarker({ position }) {
    const map = useMap()
    if (position) {
        map.flyTo(position, 15, { duration: 1 })
    }
    return null
}

// Heat circle component with multiple layers for blur effect
function HeatCircle({ center, densityPercent }) {
    const color = getDensityColor(densityPercent)
    const baseRadius = getHeatRadius(densityPercent)

    // Create multiple circles with decreasing opacity for blur effect
    return (
        <>
            {/* Outer blur layer */}
            <CircleMarker
                center={center}
                radius={baseRadius * 2.5}
                pathOptions={{
                    color: 'transparent',
                    fillColor: color,
                    fillOpacity: 0.15,
                    weight: 0,
                }}
            />
            {/* Middle layer */}
            <CircleMarker
                center={center}
                radius={baseRadius * 1.8}
                pathOptions={{
                    color: 'transparent',
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 0,
                }}
            />
            {/* Inner layer */}
            <CircleMarker
                center={center}
                radius={baseRadius * 1.2}
                pathOptions={{
                    color: 'transparent',
                    fillColor: color,
                    fillOpacity: 0.4,
                    weight: 0,
                }}
            />
            {/* Core */}
            <CircleMarker
                center={center}
                radius={baseRadius * 0.7}
                pathOptions={{
                    color: 'transparent',
                    fillColor: color,
                    fillOpacity: 0.6,
                    weight: 0,
                }}
            />
        </>
    )
}

export default function LiveTraffic() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedJunction, setSelectedJunction] = useState(junctionsData[0])
    const [statusFilter, setStatusFilter] = useState('all')
    const [timeScale, setTimeScale] = useState('daily') // daily, monthly, yearly
    const [showComparison, setShowComparison] = useState(false)
    const [compareJunctions, setCompareJunctions] = useState([junctionsData[0].id, junctionsData[2].id]) // Default compare 2 junctions

    // Map center (Bangalore)
    const mapCenter = [12.9716, 77.5946]

    const filteredJunctions = junctionsData.filter(junction => {
        const matchesSearch = junction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            junction.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || junction.status === statusFilter
        return matchesSearch && matchesStatus
    })

    // Toggle junction for comparison
    const toggleCompareJunction = (junctionId) => {
        if (compareJunctions.includes(junctionId)) {
            if (compareJunctions.length > 2) {
                setCompareJunctions(compareJunctions.filter(id => id !== junctionId))
            }
        } else {
            if (compareJunctions.length < 5) { // Max 5 junctions
                setCompareJunctions([...compareJunctions, junctionId])
            }
        }
    }

    // Get chart data based on time scale
    const getChartData = () => {
        if (!selectedJunction) return []
        switch (timeScale) {
            case 'daily':
                return generateHourlyData(selectedJunction.id)
            case 'monthly':
                return generateDailyData(selectedJunction.id)
            case 'yearly':
                return generateMonthlyData(selectedJunction.id)
            default:
                return generateHourlyData(selectedJunction.id)
        }
    }

    // Get comparative chart data
    const getComparativeChartData = () => {
        switch (timeScale) {
            case 'daily':
                return generateComparativeHourlyData(compareJunctions)
            case 'monthly':
                return generateComparativeDailyData(compareJunctions)
            case 'yearly':
                return generateComparativeMonthlyData(compareJunctions)
            default:
                return generateComparativeHourlyData(compareJunctions)
        }
    }

    const chartData = getChartData()
    const comparativeChartData = getComparativeChartData()

    // Get Y-axis label based on time scale
    const getYAxisLabel = () => {
        switch (timeScale) {
            case 'daily':
                return 'Vehicles/Hour'
            case 'monthly':
                return 'Vehicles/Day'
            case 'yearly':
                return 'Vehicles/Month'
            default:
                return 'Vehicles/Hour'
        }
    }

    return (
        <div className="live-traffic">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Live Traffic</h1>
                    <p className="page-subtitle">Real-time vehicle counts by junction</p>
                </div>
            </header>

            <div className="live-traffic-grid">
                {/* Junction List */}
                <div className="card junctions-panel">
                    <div className="panel-header">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search junctions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <Filter size={16} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="form-select"
                            >
                                <option value="all">All Status</option>
                                <option value="green">Green</option>
                                <option value="yellow">Yellow</option>
                                <option value="red">Red</option>
                            </select>
                        </div>
                    </div>

                    <div className="junctions-scroll">
                        {filteredJunctions.map((junction) => {
                            const densityPercent = getJunctionDensity(junction)
                            const densityLevel = getDensityLevel(junction.totalFlow)
                            const isComparing = compareJunctions.includes(junction.id)
                            return (
                                <div
                                    key={junction.id}
                                    className={`junction-card ${selectedJunction?.id === junction.id ? 'selected' : ''} ${isComparing && showComparison ? 'comparing' : ''}`}
                                    onClick={() => setSelectedJunction(junction)}
                                >
                                    <div className="junction-header">
                                        {showComparison && (
                                            <label className="compare-checkbox" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isComparing}
                                                    onChange={() => toggleCompareJunction(junction.id)}
                                                />
                                                <span className="checkmark"></span>
                                            </label>
                                        )}
                                        <span className={`signal-indicator ${junction.status}`}></span>
                                        <div className="junction-title">
                                            <h4>{junction.name}</h4>
                                            <span>{junction.id}</span>
                                        </div>
                                        <div className="junction-density-badge">
                                            <span className={`density-level ${densityLevel}`}>{densityLevel.toUpperCase()}</span>
                                            <span className="density-label">{junction.totalFlow}/hr</span>
                                        </div>
                                    </div>
                                    <div className="junction-mini-stats">
                                        <div className="mini-stat">
                                            <Bike size={14} />
                                            <span>{junction.vehicles.twoWheeler}</span>
                                        </div>
                                        <div className="mini-stat">
                                            <Car size={14} />
                                            <span>{junction.vehicles.lightVehicle}</span>
                                        </div>
                                        <div className="mini-stat">
                                            <Truck size={14} />
                                            <span>{junction.vehicles.heavyVehicle}</span>
                                        </div>
                                        <div className="mini-stat flow">
                                            <span>{densityPercent}% share</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Comparison Toggle */}
                    <div className="comparison-toggle">
                        <button
                            className={`compare-btn ${showComparison ? 'active' : ''}`}
                            onClick={() => setShowComparison(!showComparison)}
                        >
                            <BarChart3 size={16} />
                            {showComparison ? 'Exit Comparison' : 'Compare Junctions'}
                        </button>
                        {showComparison && (
                            <span className="compare-count">{compareJunctions.length} selected</span>
                        )}
                    </div>

                    {/* Total Traffic Summary */}
                    <div className="total-traffic-summary">
                        <span>Total Network Flow:</span>
                        <strong>{totalTrafficFlow} vehicles/hr</strong>
                    </div>
                </div>

                {/* Selected Junction Details */}
                <div className="junction-details">
                    {selectedJunction && (
                        <>
                            <div className="card details-header-card">
                                <div className="details-header">
                                    <div>
                                        <h2>{selectedJunction.name}</h2>
                                        <p>{selectedJunction.id} • Avg Wait: {selectedJunction.avgWait} • <strong>{getJunctionDensity(selectedJunction)}% of network traffic</strong></p>
                                    </div>
                                    <span className={`badge badge-${selectedJunction.status === 'green' ? 'success' : selectedJunction.status === 'yellow' ? 'warning' : 'danger'}`}>
                                        {selectedJunction.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Traffic Heat Map with OpenStreetMap */}
                            <div className="card heat-map-card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <MapPin size={18} />
                                        Traffic Density Heat Map
                                    </h3>
                                    <div className="heat-map-legend">
                                        <span className="legend-item light">Low</span>
                                        <span className="legend-item moderate">Medium</span>
                                        <span className="legend-item severe">High</span>
                                    </div>
                                </div>
                                <div className="heat-map-container">
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={14}
                                        className="leaflet-map"
                                        zoomControl={true}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />

                                        {/* Fly to selected junction */}
                                        {selectedJunction && (
                                            <FlyToMarker position={[selectedJunction.coordinates.lat, selectedJunction.coordinates.lng]} />
                                        )}

                                        {/* Heat circles with blur effect */}
                                        {junctionsData.map((junction) => (
                                            <HeatCircle
                                                key={`heat-${junction.id}`}
                                                center={[junction.coordinates.lat, junction.coordinates.lng]}
                                                densityPercent={getJunctionDensity(junction)}
                                            />
                                        ))}

                                        {/* Junction markers */}
                                        {junctionsData.map((junction) => (
                                            <Marker
                                                key={junction.id}
                                                position={[junction.coordinates.lat, junction.coordinates.lng]}
                                                icon={createCustomIcon(selectedJunction?.id === junction.id)}
                                                eventHandlers={{
                                                    click: () => setSelectedJunction(junction),
                                                }}
                                            >
                                                <Popup className="custom-popup">
                                                    <div className="popup-content">
                                                        <div className="popup-header">
                                                            <span className={`status-dot ${junction.status}`}></span>
                                                            <strong>{junction.name}</strong>
                                                        </div>
                                                        <div className="popup-stats">
                                                            <div className="popup-stat">
                                                                <span className="stat-label">Traffic Flow</span>
                                                                <span className="stat-value">{junction.totalFlow}/hr</span>
                                                            </div>
                                                            <div className="popup-stat">
                                                                <span className="stat-label">Network Share</span>
                                                                <span className="stat-value">{getJunctionDensity(junction)}%</span>
                                                            </div>
                                                            <div className="popup-stat">
                                                                <span className="stat-label">Avg Wait</span>
                                                                <span className="stat-value">{junction.avgWait}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </div>
                            </div>

                            {/* Traffic Density Graph */}
                            <div className="card traffic-graph-card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <TrendingUp size={18} />
                                        {showComparison ? 'Comparative Analysis' : 'Traffic Density Trend'}
                                    </h3>
                                    <div className="time-scale-selector">
                                        <button
                                            className={`scale-btn ${timeScale === 'daily' ? 'active' : ''}`}
                                            onClick={() => setTimeScale('daily')}
                                        >
                                            Daily
                                        </button>
                                        <button
                                            className={`scale-btn ${timeScale === 'monthly' ? 'active' : ''}`}
                                            onClick={() => setTimeScale('monthly')}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            className={`scale-btn ${timeScale === 'yearly' ? 'active' : ''}`}
                                            onClick={() => setTimeScale('yearly')}
                                        >
                                            Yearly
                                        </button>
                                    </div>
                                </div>
                                <div className="traffic-graph-container">
                                    {showComparison ? (
                                        // Comparative Line Chart
                                        <ResponsiveContainer width="100%" height={280}>
                                            <LineChart data={comparativeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                                <XAxis
                                                    dataKey="time"
                                                    stroke="var(--text-muted)"
                                                    fontSize={12}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    stroke="var(--text-muted)"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    label={{
                                                        value: getYAxisLabel(),
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        style: { textAnchor: 'middle', fill: 'var(--text-muted)', fontSize: 11 }
                                                    }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        boxShadow: 'var(--shadow-lg)',
                                                    }}
                                                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                                />
                                                <Legend
                                                    wrapperStyle={{ paddingTop: '10px' }}
                                                    iconType="circle"
                                                    iconSize={8}
                                                />
                                                {compareJunctions.map((jId, index) => {
                                                    const junction = junctionsData.find(j => j.id === jId)
                                                    if (!junction) return null
                                                    return (
                                                        <Line
                                                            key={jId}
                                                            type="monotone"
                                                            dataKey={junction.name}
                                                            stroke={chartColors[index % chartColors.length]}
                                                            strokeWidth={2}
                                                            dot={false}
                                                            activeDot={{ r: 5, strokeWidth: 2 }}
                                                        />
                                                    )
                                                })}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        // Single Junction Area Chart
                                        <ResponsiveContainer width="100%" height={250}>
                                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                                <XAxis
                                                    dataKey="time"
                                                    stroke="var(--text-muted)"
                                                    fontSize={12}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    stroke="var(--text-muted)"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    label={{
                                                        value: getYAxisLabel(),
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        style: { textAnchor: 'middle', fill: 'var(--text-muted)', fontSize: 11 }
                                                    }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        boxShadow: 'var(--shadow-lg)',
                                                    }}
                                                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                                    itemStyle={{ color: 'var(--text-secondary)' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="density"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    fill="url(#colorDensity)"
                                                    dot={false}
                                                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Vehicle Count Cards */}
                            <div className="vehicle-counts-grid">
                                <div className="vehicle-count-card two-wheeler">
                                    <div className="vehicle-icon">
                                        <Bike size={32} />
                                    </div>
                                    <div className="vehicle-info">
                                        <h3>Two-Wheelers</h3>
                                        <p className="vehicle-count">{selectedJunction.vehicles.twoWheeler}</p>
                                        <span>vehicles/hour</span>
                                    </div>
                                </div>

                                <div className="vehicle-count-card light-vehicle">
                                    <div className="vehicle-icon">
                                        <Car size={32} />
                                    </div>
                                    <div className="vehicle-info">
                                        <h3>Light Vehicles</h3>
                                        <p className="vehicle-count">{selectedJunction.vehicles.lightVehicle}</p>
                                        <span>vehicles/hour</span>
                                    </div>
                                </div>

                                <div className="vehicle-count-card heavy-vehicle">
                                    <div className="vehicle-icon">
                                        <Truck size={32} />
                                    </div>
                                    <div className="vehicle-info">
                                        <h3>Heavy Vehicles</h3>
                                        <p className="vehicle-count">{selectedJunction.vehicles.heavyVehicle}</p>
                                        <span>vehicles/hour</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

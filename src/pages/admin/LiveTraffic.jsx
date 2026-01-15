import { useState } from 'react'
import { Search, Filter, Car, Bike, Truck } from 'lucide-react'
import './LiveTraffic.css'

// Sample junction data with vehicle counts by type
const junctionsData = [
    {
        id: 'J-001',
        name: 'City Center',
        status: 'green',
        vehicles: { twoWheeler: 145, lightVehicle: 89, heavyVehicle: 12 },
        totalFlow: 246,
        avgWait: '28s'
    },
    {
        id: 'J-002',
        name: 'MG Road Crossing',
        status: 'yellow',
        vehicles: { twoWheeler: 178, lightVehicle: 112, heavyVehicle: 8 },
        totalFlow: 298,
        avgWait: '45s'
    },
    {
        id: 'J-003',
        name: 'Railway Station',
        status: 'red',
        vehicles: { twoWheeler: 210, lightVehicle: 156, heavyVehicle: 24 },
        totalFlow: 390,
        avgWait: '62s'
    },
    {
        id: 'J-004',
        name: 'Industrial Area',
        status: 'green',
        vehicles: { twoWheeler: 67, lightVehicle: 45, heavyVehicle: 38 },
        totalFlow: 150,
        avgWait: '22s'
    },
    {
        id: 'J-005',
        name: 'Hospital Road',
        status: 'green',
        vehicles: { twoWheeler: 98, lightVehicle: 76, heavyVehicle: 5 },
        totalFlow: 179,
        avgWait: '31s'
    },
    {
        id: 'J-006',
        name: 'Market Square',
        status: 'yellow',
        vehicles: { twoWheeler: 189, lightVehicle: 134, heavyVehicle: 15 },
        totalFlow: 338,
        avgWait: '48s'
    },
    {
        id: 'J-007',
        name: 'Tech Park Gate',
        status: 'green',
        vehicles: { twoWheeler: 156, lightVehicle: 198, heavyVehicle: 3 },
        totalFlow: 357,
        avgWait: '35s'
    },
    {
        id: 'J-008',
        name: 'Stadium Junction',
        status: 'green',
        vehicles: { twoWheeler: 78, lightVehicle: 52, heavyVehicle: 7 },
        totalFlow: 137,
        avgWait: '18s'
    },
]

export default function LiveTraffic() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedJunction, setSelectedJunction] = useState(junctionsData[0])
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredJunctions = junctionsData.filter(junction => {
        const matchesSearch = junction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            junction.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || junction.status === statusFilter
        return matchesSearch && matchesStatus
    })

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
                        {filteredJunctions.map((junction) => (
                            <div
                                key={junction.id}
                                className={`junction-card ${selectedJunction?.id === junction.id ? 'selected' : ''}`}
                                onClick={() => setSelectedJunction(junction)}
                            >
                                <div className="junction-header">
                                    <span className={`signal-indicator ${junction.status}`}></span>
                                    <div className="junction-title">
                                        <h4>{junction.name}</h4>
                                        <span>{junction.id}</span>
                                    </div>
                                    <span className="junction-flow">{junction.totalFlow}/hr</span>
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
                                </div>
                            </div>
                        ))}
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
                                        <p>{selectedJunction.id} • Avg Wait: {selectedJunction.avgWait}</p>
                                    </div>
                                    <span className={`badge badge-${selectedJunction.status === 'green' ? 'success' : selectedJunction.status === 'yellow' ? 'warning' : 'danger'}`}>
                                        {selectedJunction.status.toUpperCase()}
                                    </span>
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

                            {/* Camera Feed Preview */}
                            <div className="card camera-feed-card">
                                <div className="card-header">
                                    <h3 className="card-title">Camera Feed</h3>
                                    <span className="live-badge">● LIVE</span>
                                </div>
                                <div className="camera-placeholder">
                                    <p>Camera feed from {selectedJunction.name}</p>
                                    <span>Phase 1 - North Approach</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

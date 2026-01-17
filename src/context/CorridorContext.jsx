import { createContext, useContext, useState, useEffect } from 'react'

const CorridorContext = createContext()

// Junction data shared between Green Corridor and Signal Control
export const signalJunctions = [
    {
        id: 'J-001',
        name: 'City Center',
        lat: 12.9716,
        lng: 77.5946,
        phases: 4,
        status: 'active',
        adjacentTo: ['J-002', 'J-005']
    },
    {
        id: 'J-002',
        name: 'MG Road Crossing',
        lat: 12.9756,
        lng: 77.6066,
        phases: 4,
        status: 'active',
        adjacentTo: ['J-001', 'J-003', 'J-006']
    },
    {
        id: 'J-003',
        name: 'Railway Station',
        lat: 12.9779,
        lng: 77.5728,
        phases: 3,
        status: 'active',
        adjacentTo: ['J-002', 'J-004', 'J-005']
    },
    {
        id: 'J-004',
        name: 'Industrial Area',
        lat: 12.9850,
        lng: 77.6150,
        phases: 4,
        status: 'active',
        adjacentTo: ['J-003', 'J-006']
    },
    {
        id: 'J-005',
        name: 'Hospital Road',
        lat: 12.9600,
        lng: 77.5800,
        phases: 4,
        status: 'active',
        adjacentTo: ['J-001', 'J-003', 'J-007']
    },
    {
        id: 'J-006',
        name: 'Tech Park Gate',
        lat: 12.9680,
        lng: 77.6200,
        phases: 4,
        status: 'active',
        adjacentTo: ['J-002', 'J-004', 'J-008']
    },
    {
        id: 'J-007',
        name: 'Stadium Junction',
        lat: 12.9550,
        lng: 77.5900,
        phases: 4,
        status: 'active',
        adjacentTo: ['J-005', 'J-008']
    },
    {
        id: 'J-008',
        name: 'Market Square',
        lat: 12.9620,
        lng: 77.6100,
        phases: 4,
        status: 'active',
        adjacentTo: ['J-006', 'J-007']
    },
]

// Get direction between two junctions
export const getDirection = (from, to) => {
    const latDiff = to.lat - from.lat
    const lngDiff = to.lng - from.lng

    if (Math.abs(latDiff) > Math.abs(lngDiff)) {
        return latDiff > 0 ? 'north' : 'south'
    } else {
        return lngDiff > 0 ? 'east' : 'west'
    }
}

export const getOppositeDirection = (dir) => {
    const opposites = { north: 'south', south: 'north', east: 'west', west: 'east' }
    return opposites[dir]
}

// Calculate phase states for junctions in corridor
export const calculatePhaseStates = (selectedJunctions) => {
    const states = {}

    selectedJunctions.forEach((junction, index) => {
        const isStart = index === 0
        const isEnd = index === selectedJunctions.length - 1

        const prevJunction = index > 0 ? selectedJunctions[index - 1] : null
        const nextJunction = index < selectedJunctions.length - 1 ? selectedJunctions[index + 1] : null

        const entryDirection = prevJunction ? getDirection(prevJunction, junction) : null
        const exitDirection = nextJunction ? getDirection(junction, nextJunction) : null

        const junctionState = {
            type: isStart ? 'start' : isEnd ? 'end' : 'middle',
            phases: {
                north: 'red',
                east: 'red',
                south: 'red',
                west: 'red'
            },
            entryDirection,
            exitDirection
        }

        if (isStart && exitDirection) {
            junctionState.phases[getOppositeDirection(exitDirection)] = 'green'
        } else if (isEnd && entryDirection) {
            junctionState.phases[entryDirection] = 'green'
        } else {
            if (entryDirection) {
                junctionState.phases[entryDirection] = 'green'
            }
            if (exitDirection) {
                junctionState.phases[getOppositeDirection(exitDirection)] = 'green'
            }
        }

        states[junction.id] = junctionState
    })

    return states
}

export function CorridorProvider({ children }) {
    const [activeCorridor, setActiveCorridor] = useState(null)
    const [corridorStatus, setCorridorStatus] = useState('idle') // idle, notice, waiting-cycle, active
    const [phaseStates, setPhaseStates] = useState({})
    const [noticeCountdown, setNoticeCountdown] = useState(0)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('activeCorridor')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Check if corridor is still valid (not expired)
                const endTime = new Date(parsed.endTime)
                if (endTime > new Date()) {
                    // Restore corridor
                    setActiveCorridor({
                        ...parsed,
                        startTime: new Date(parsed.startTime),
                        endTime: endTime,
                        junctions: parsed.junctions.map(j => signalJunctions.find(sj => sj.id === j.id) || j)
                    })
                    setCorridorStatus('active')
                    // Recalculate phase states
                    const junctions = parsed.junctions.map(j => signalJunctions.find(sj => sj.id === j.id) || j)
                    setPhaseStates(calculatePhaseStates(junctions))
                } else {
                    // Expired, clear it
                    localStorage.removeItem('activeCorridor')
                }
            } catch (e) {
                console.error('Error loading corridor from storage:', e)
                localStorage.removeItem('activeCorridor')
            }
        }
    }, [])

    // Save to localStorage whenever activeCorridor changes
    useEffect(() => {
        if (activeCorridor && corridorStatus === 'active') {
            const toSave = {
                ...activeCorridor,
                startTime: activeCorridor.startTime.toISOString(),
                endTime: activeCorridor.endTime.toISOString(),
                junctions: activeCorridor.junctions.map(j => ({ id: j.id, name: j.name, lat: j.lat, lng: j.lng, phases: j.phases }))
            }
            localStorage.setItem('activeCorridor', JSON.stringify(toSave))
            localStorage.setItem('corridorPhaseStates', JSON.stringify(phaseStates))
        } else if (corridorStatus === 'idle') {
            localStorage.removeItem('activeCorridor')
            localStorage.removeItem('corridorPhaseStates')
        }
    }, [activeCorridor, corridorStatus, phaseStates])

    // Auto-expire corridor
    useEffect(() => {
        if (activeCorridor && corridorStatus === 'active') {
            const checkExpiry = setInterval(() => {
                if (new Date() >= activeCorridor.endTime) {
                    cancelCorridor()
                }
            }, 1000)
            return () => clearInterval(checkExpiry)
        }
    }, [activeCorridor, corridorStatus])

    // Notice countdown
    useEffect(() => {
        if (noticeCountdown > 0) {
            const timer = setTimeout(() => setNoticeCountdown(noticeCountdown - 1), 1000)
            return () => clearTimeout(timer)
        } else if (corridorStatus === 'notice' && noticeCountdown === 0) {
            setCorridorStatus('waiting-cycle')
            setTimeout(() => {
                activateCorridorFromNotice()
            }, 5000)
        }
    }, [noticeCountdown, corridorStatus])

    const startCorridorNotice = (selectedJunctions, duration, corridorType) => {
        const states = calculatePhaseStates(selectedJunctions)
        setPhaseStates(states)
        setCorridorStatus('notice')
        setNoticeCountdown(120) // 2 minutes

        // Store pending corridor data
        setActiveCorridor({
            junctions: selectedJunctions,
            duration: duration,
            type: corridorType,
            startTime: null,
            endTime: null,
            pending: true
        })
    }

    const activateCorridorFromNotice = () => {
        if (!activeCorridor) return

        const now = new Date()
        const endTime = new Date(now.getTime() + activeCorridor.duration * 60 * 1000)

        setActiveCorridor(prev => ({
            ...prev,
            startTime: now,
            endTime: endTime,
            pending: false
        }))
        setCorridorStatus('active')
    }

    const cancelCorridor = () => {
        setActiveCorridor(null)
        setCorridorStatus('idle')
        setNoticeCountdown(0)
        setPhaseStates({})
        localStorage.removeItem('activeCorridor')
        localStorage.removeItem('corridorPhaseStates')
    }

    // Check if a junction is in the active corridor
    const isJunctionInCorridor = (junctionId) => {
        if (!activeCorridor || corridorStatus !== 'active') return false
        return activeCorridor.junctions.some(j => j.id === junctionId)
    }

    // Get phase state for a junction
    const getJunctionPhaseState = (junctionId) => {
        return phaseStates[junctionId] || null
    }

    const value = {
        activeCorridor,
        corridorStatus,
        phaseStates,
        noticeCountdown,
        startCorridorNotice,
        cancelCorridor,
        isJunctionInCorridor,
        getJunctionPhaseState,
        setCorridorStatus,
        setPhaseStates
    }

    return (
        <CorridorContext.Provider value={value}>
            {children}
        </CorridorContext.Provider>
    )
}

export function useCorridor() {
    const context = useContext(CorridorContext)
    if (!context) {
        throw new Error('useCorridor must be used within a CorridorProvider')
    }
    return context
}

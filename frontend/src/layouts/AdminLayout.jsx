import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function AdminLayout() {
    const [isLocked, setIsLocked] = useState(false) // true = permanently expanded
    const [isHovering, setIsHovering] = useState(false)

    const handleSidebarClick = () => {
        // Toggle lock state when clicking on the sidebar
        setIsLocked(!isLocked)
    }

    const handleMouseEnter = () => {
        setIsHovering(true)
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
    }

    // Sidebar is visually expanded if: locked OR hovering
    const isExpanded = isLocked || isHovering

    return (
        <div className={`app-layout ${!isExpanded ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                isCollapsed={!isExpanded}
                isLocked={isLocked}
                onSidebarClick={handleSidebarClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
            <Header isCollapsed={!isExpanded} />
            <main className="main-content">
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

import { Outlet, NavLink } from 'react-router-dom'
import { Eye, MapPin, AlertTriangle } from 'lucide-react'
import './PublicLayout.css'

export default function PublicLayout() {
    return (
        <div className="public-layout">
            <header className="public-header">
                <div className="public-logo">
                    <Eye size={24} />
                    <span>IRIS</span>
                </div>
                <nav className="public-nav">
                    <NavLink to="/public" end className={({ isActive }) => isActive ? 'active' : ''}>
                        <MapPin size={18} />
                        Traffic Status
                    </NavLink>
                    <NavLink to="/public/alerts" className={({ isActive }) => isActive ? 'active' : ''}>
                        <AlertTriangle size={18} />
                        Incidents
                    </NavLink>
                </nav>
                <a href="/login" className="public-admin-link">Admin Login</a>
            </header>
            <main className="public-main">
                <Outlet />
            </main>
        </div>
    )
}

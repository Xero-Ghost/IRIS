import { Outlet, NavLink, Link } from 'react-router-dom'
import { Eye, MapPin, AlertTriangle, Home } from 'lucide-react'
import './PublicLayout.css'

export default function PublicLayout() {
    return (
        <div className="public-layout">
            <header className="public-header">
                <Link to="/" className="public-logo">
                    <Eye size={24} />
                    <span>IRIS</span>
                </Link>
                <nav className="public-nav">
                    <NavLink to="/public" end className={({ isActive }) => isActive ? 'active' : ''}>
                        <MapPin size={18} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/public/alerts" className={({ isActive }) => isActive ? 'active' : ''}>
                        <AlertTriangle size={18} />
                        Alerts
                    </NavLink>
                </nav>
                <div className="public-header-actions">
                    <Link to="/" className="back-home-link">
                        <Home size={16} />
                        Home
                    </Link>
                    <Link to="/login" className="public-admin-link">Admin Login</Link>
                </div>
            </header>
            <main className="public-main">
                <Outlet />
            </main>
        </div>
    )
}

import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LayoutDashboard,
    Radio,
    Settings2,
    Route,
    BarChart3,
    Bell,
    Settings,
    LogOut,
    Eye,
    Lock,
    Unlock
} from 'lucide-react'
import './Sidebar.css'

const adminMenuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/live-traffic', icon: Radio, label: 'Live Traffic' },
    { path: '/admin/signal-control', icon: Settings2, label: 'Signal Control' },
    { path: '/admin/green-corridor', icon: Route, label: 'Green Corridor' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/alerts', icon: Bell, label: 'Alerts' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isCollapsed, isLocked, onSidebarClick, onMouseEnter, onMouseLeave }) {
    const { logout } = useAuth()
    const location = useLocation()

    return (
        <aside
            className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isLocked ? 'locked' : ''}`}
            onClick={onSidebarClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Eye size={28} className="logo-icon" />
                    <span className="logo-text">{!isCollapsed && 'IRIS'}</span>
                </div>
                {!isCollapsed && <p className="sidebar-tagline">Traffic Management</p>}
                {!isCollapsed && (
                    <div className="lock-indicator" title={isLocked ? 'Click to unlock' : 'Click to lock'}>
                        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {adminMenuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-link ${item.exact ? (location.pathname === item.path ? 'active' : '') : (isActive ? 'active' : '')}`
                                }
                                end={item.exact}
                                title={isCollapsed ? item.label : ''}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <item.icon size={20} />
                                {!isCollapsed && <span>{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={(e) => { e.stopPropagation(); logout(); }} title={isCollapsed ? 'Logout' : ''}>
                    <LogOut size={20} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    )
}

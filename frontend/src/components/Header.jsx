import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import './Header.css'

// Sample notifications
const notifications = [
    { id: 1, message: 'Accident reported near MG Road', time: '2 min ago', type: 'danger', read: false },
    { id: 2, message: 'Signal violation at Junction 15', time: '5 min ago', type: 'warning', read: false },
    { id: 3, message: 'Camera offline at Junction 8', time: '10 min ago', type: 'warning', read: true },
]

export default function Header({ isCollapsed }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [showNotifications, setShowNotifications] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const notifRef = useRef(null)
    const profileRef = useRef(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <header className={`header ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="header-search">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search junctions, alerts..."
                    className="search-input"
                />
            </div>

            <div className="header-actions">
                {/* Notifications Dropdown */}
                <div className="dropdown-container" ref={notifRef}>
                    <button
                        className={`header-btn notification-btn ${showNotifications ? 'active' : ''}`}
                        onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className="dropdown-menu notifications-dropdown">
                            <div className="dropdown-header">
                                <span>Notifications</span>
                                <Link to="/admin/alerts" onClick={() => setShowNotifications(false)}>View all</Link>
                            </div>
                            <div className="dropdown-body">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`notification-item ${notif.read ? 'read' : ''}`}>
                                        <div className={`notif-indicator ${notif.type}`}></div>
                                        <div className="notif-content">
                                            <p className="notif-message">{notif.message}</p>
                                            <span className="notif-time">{notif.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="dropdown-footer">
                                <Link to="/admin/alerts" onClick={() => setShowNotifications(false)}>
                                    See all notifications
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="dropdown-container" ref={profileRef}>
                    <div
                        className={`user-menu ${showProfile ? 'active' : ''}`}
                        onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                    >
                        <div className="user-avatar">
                            <User size={18} />
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.username || 'Admin'}</span>
                            <span className="user-role">{user?.role || 'Administrator'}</span>
                        </div>
                        <ChevronDown size={16} className={`chevron ${showProfile ? 'rotate' : ''}`} />
                    </div>

                    {showProfile && (
                        <div className="dropdown-menu profile-dropdown">
                            <div className="dropdown-body">
                                <Link to="/admin/settings" className="dropdown-item" onClick={() => setShowProfile(false)}>
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </Link>
                                <button className="dropdown-item logout" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

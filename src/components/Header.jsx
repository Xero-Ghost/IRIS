import { useAuth } from '../context/AuthContext'
import { Bell, Search, User } from 'lucide-react'
import './Header.css'

export default function Header() {
    const { user } = useAuth()

    return (
        <header className="header">
            <div className="header-search">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search junctions, alerts..."
                    className="search-input"
                />
            </div>

            <div className="header-actions">
                <button className="header-btn notification-btn">
                    <Bell size={20} />
                    <span className="notification-badge">3</span>
                </button>

                <div className="user-menu">
                    <div className="user-avatar">
                        <User size={18} />
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.username || 'Admin'}</span>
                        <span className="user-role">{user?.role || 'Administrator'}</span>
                    </div>
                </div>
            </div>
        </header>
    )
}

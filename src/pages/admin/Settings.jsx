import { User, Bell, Shield, Database, Save } from 'lucide-react'
import './Settings.css'

export default function Settings() {
    return (
        <div className="settings-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your account and system preferences</p>
                </div>
            </header>

            <div className="settings-grid">
                {/* Profile Settings */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <User size={18} />
                            Profile Settings
                        </h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input type="text" className="form-input" defaultValue="Admin User" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-input" defaultValue="admin@iris.gov.in" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <input type="text" className="form-input" defaultValue="Administrator" disabled />
                    </div>
                    <button className="btn btn-primary">
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>

                {/* Notification Settings */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Bell size={18} />
                            Notification Preferences
                        </h3>
                    </div>
                    <div className="toggle-list">
                        <div className="toggle-item">
                            <div className="toggle-info">
                                <span className="toggle-label">Violation Alerts</span>
                                <span className="toggle-desc">Receive alerts for traffic violations</span>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="toggle-item">
                            <div className="toggle-info">
                                <span className="toggle-label">Incident Notifications</span>
                                <span className="toggle-desc">Get notified about accidents and incidents</span>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="toggle-item">
                            <div className="toggle-info">
                                <span className="toggle-label">Maintenance Alerts</span>
                                <span className="toggle-desc">System maintenance and error notifications</span>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="toggle-item">
                            <div className="toggle-info">
                                <span className="toggle-label">Email Notifications</span>
                                <span className="toggle-desc">Receive daily summary via email</span>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Shield size={18} />
                            Security
                        </h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input type="password" className="form-input" placeholder="Enter current password" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input type="password" className="form-input" placeholder="Enter new password" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input type="password" className="form-input" placeholder="Confirm new password" />
                    </div>
                    <button className="btn btn-primary">
                        <Shield size={16} />
                        Update Password
                    </button>
                </div>

                {/* System Settings */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Database size={18} />
                            System Defaults
                        </h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Default Signal Timer (seconds)</label>
                        <input type="number" className="form-input" defaultValue={45} min={10} max={120} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Failsafe Timer (seconds)</label>
                        <input type="number" className="form-input" defaultValue={30} min={10} max={60} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Refresh Interval (seconds)</label>
                        <select className="form-select">
                            <option value="5">5 seconds</option>
                            <option value="10">10 seconds</option>
                            <option value="30">30 seconds</option>
                            <option value="60">1 minute</option>
                        </select>
                    </div>
                    <button className="btn btn-primary">
                        <Save size={16} />
                        Save Defaults
                    </button>
                </div>
            </div>
        </div>
    )
}

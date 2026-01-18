import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, User, Users, ArrowRight, ArrowLeft } from 'lucide-react'
import './Login.css'

export default function Login() {
    const [role, setRole] = useState(null)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleRoleSelect = (selectedRole) => {
        if (selectedRole === 'public') {
            login('', '', 'public').then(result => {
                if (result.success) {
                    navigate(result.redirect)
                }
            })
        } else {
            setRole(selectedRole)
        }
    }

    const handleAdminLogin = async (e) => {
        e.preventDefault()
        setError('')

        if (!username || !password) {
            setError('Please enter both username and password')
            return
        }

        setIsLoading(true)
        try {
            const result = await login(username, password, 'admin')
            if (result.success) {
                navigate(result.redirect)
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError('Connection error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <Eye size={40} />
                    </div>
                    <h1>IRIS</h1>
                    <p>Intelligent Roadway Infrastructure System</p>
                </div>

                {!role ? (
                    <div className="login-options">
                        <h2>Select Access Type</h2>

                        <button
                            className="login-option admin-option"
                            onClick={() => handleRoleSelect('admin')}
                        >
                            <div className="option-icon">
                                <User size={24} />
                            </div>
                            <div className="option-content">
                                <h3>Administration</h3>
                                <p>Traffic control & management dashboard</p>
                            </div>
                            <ArrowRight size={20} />
                        </button>

                        <button
                            className="login-option public-option"
                            onClick={() => handleRoleSelect('public')}
                        >
                            <div className="option-icon">
                                <Users size={24} />
                            </div>
                            <div className="option-content">
                                <h3>Public Access</h3>
                                <p>View traffic status & incident alerts</p>
                            </div>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleAdminLogin}>
                        <h2>Admin Login</h2>

                        {error && <div className="login-error">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <button
                            type="button"
                            className="login-back"
                            onClick={() => setRole(null)}
                        >
                            ← Back to selection
                        </button>
                    </form>
                )}
            </div>

            <Link to="/" className="back-to-home">
                <ArrowLeft size={18} />
                Back to Home
            </Link>
        </div>
    )
}

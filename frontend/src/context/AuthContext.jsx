import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

const AUTH_STORAGE_KEY = 'iris_auth_user'

export function AuthProvider({ children }) {
    // Initialize user from localStorage
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem(AUTH_STORAGE_KEY)
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    })
    const [loading, setLoading] = useState(false)

    // Persist user to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
        } else {
            localStorage.removeItem(AUTH_STORAGE_KEY)
        }
    }, [user])

    const login = async (username, password, role) => {
        // Public access doesn't require API call
        if (role === 'public') {
            setUser({ role: 'public' })
            return { success: true, redirect: '/public' }
        }

        // Admin login requires API authentication
        if (role === 'admin' && username && password) {
            setLoading(true)
            try {
                const response = await authAPI.login(username, password, role)
                setUser({
                    username: response.username || username,
                    role: response.role,
                    token: response.access_token
                })
                return { success: true, redirect: '/admin' }
            } catch (error) {
                console.error('Login error:', error)
                return {
                    success: false,
                    error: error.message || 'Invalid credentials'
                }
            } finally {
                setLoading(false)
            }
        }

        return { success: false, error: 'Invalid credentials' }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem(AUTH_STORAGE_KEY)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

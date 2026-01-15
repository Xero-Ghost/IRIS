import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)

    const login = (username, password, role) => {
        // Simulated login - in production, this would call an API
        if (role === 'admin' && username && password) {
            setUser({ username, role: 'admin' })
            return { success: true, redirect: '/admin' }
        } else if (role === 'public') {
            setUser({ role: 'public' })
            return { success: true, redirect: '/public' }
        }
        return { success: false, error: 'Invalid credentials' }
    }

    const logout = () => {
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
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

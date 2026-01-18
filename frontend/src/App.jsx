import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CorridorProvider } from './context/CorridorContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import PublicLayout from './layouts/PublicLayout'
import Dashboard from './pages/admin/Dashboard'
import LiveTraffic from './pages/admin/LiveTraffic'
import SignalControl from './pages/admin/SignalControl'
import GreenCorridor from './pages/admin/GreenCorridor'
import Analytics from './pages/admin/Analytics'
import Alerts from './pages/admin/Alerts'
import Settings from './pages/admin/Settings'
import PublicTraffic from './pages/public/PublicTraffic'
import PublicAlerts from './pages/public/PublicAlerts'

function App() {
    return (
        <AuthProvider>
            <CorridorProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />

                        {/* Admin Routes */}
                        <Route path="/admin" element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Dashboard />} />
                            <Route path="live-traffic" element={<LiveTraffic />} />
                            <Route path="signal-control" element={<SignalControl />} />
                            <Route path="green-corridor" element={<GreenCorridor />} />
                            <Route path="analytics" element={<Analytics />} />
                            <Route path="alerts" element={<Alerts />} />
                            <Route path="settings" element={<Settings />} />
                        </Route>

                        {/* Public Routes */}
                        <Route path="/public" element={<PublicLayout />}>
                            <Route index element={<PublicTraffic />} />
                            <Route path="alerts" element={<PublicAlerts />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </CorridorProvider>
        </AuthProvider>
    )
}

export default App

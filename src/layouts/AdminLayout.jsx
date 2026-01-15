import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function AdminLayout() {
    return (
        <div className="app-layout">
            <Sidebar />
            <Header />
            <main className="main-content">
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

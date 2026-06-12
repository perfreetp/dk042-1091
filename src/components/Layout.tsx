import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'

export default function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

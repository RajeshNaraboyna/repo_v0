import { useState } from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

const navItems = [
  { to: '/admission', label: 'Admission Request', icon: '📋', authRequired: false },
  { to: '/dashboard', label: 'Dashboard', icon: '📊', authRequired: true },
  { to: '/approved', label: 'Approved', icon: '✅', authRequired: true },
  { to: '/students', label: 'Students', icon: '🎓', authRequired: true },
  { to: '/question-papers', label: 'Question Papers', icon: '📝', authRequired: true },
  { to: '/exams', label: 'Exams', icon: '📚', authRequired: true },
  { to: '/results', label: 'Results', icon: '📊', authRequired: true },
  { to: '/analytics', label: 'Analytics', icon: '🔍', authRequired: true },
]

export default function Layout() {
  const { user, isAuthenticated, isGuest, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleNavItems = navItems.filter(
    (item) => !item.authRequired || isAuthenticated
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">
                  School Management
                </span>
              </Link>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {(isGuest ? 'G' : user.name?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {isGuest ? 'Guest' : user.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700 font-medium ml-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary text-sm"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`bg-white border-r shadow-sm flex flex-col transition-all duration-300 ${
            sidebarOpen ? 'w-60' : 'w-16'
          }`}
        >
          <nav className="flex-1 py-4 space-y-1 px-2">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center ${sidebarOpen ? 'space-x-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t px-2 py-3">
            {sidebarOpen ? (
              <p className="text-xs text-gray-400 text-center">© 2026 School Mgmt</p>
            ) : (
              <p className="text-xs text-gray-400 text-center">©</p>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

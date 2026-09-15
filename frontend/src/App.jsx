import { useContext } from "react"
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import EmployeeMonitoring from "./pages/EmployeeMonitoring"
import PostureAnalysis from "./pages/PostureAnalysis"
import Productivity from "./pages/Productivity"
import Alerts from "./pages/Alerts"
import Reports from "./pages/Reports"
import HRDashboard from "./pages/HRDashboard"

import { UserContext } from "./context/UserContext"
import "./App.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/hr-dashboard" element={<HRDashboard />} />

        <Route
          path="/*"
          element={
            <div className="dashboard">
             <aside className="sidebar ergonova-sidebar">

  <div className="sidebar-brand">
    <div className="sidebar-logo">E</div>

    <div>
      <h2>ERGONOVA AI</h2>
      <span>ERGONOMIC INTELLIGENCE</span>
    </div>
  </div>

  <SidebarProfile />

  <nav className="sidebar-nav">

    <Link to="/dashboard">
      <span className="nav-icon">⌂</span>
      <span>Home</span>
    </Link>

    <Link to="/employee">
      <span className="nav-icon">◉</span>
      <span>Employee</span>
    </Link>

    <Link to="/posture">
      <span className="nav-icon">◇</span>
      <span>Posture</span>
    </Link>

    <Link to="/productivity">
      <span className="nav-icon">◌</span>
      <span>Productivity</span>
    </Link>

    <Link to="/alerts">
      <span className="nav-icon">!</span>
      <span>Alerts</span>
    </Link>

    <Link to="/reports">
      <span className="nav-icon">▤</span>
      <span>Reports</span>
    </Link>

  </nav>

</aside>

              <main className="main">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/employee" element={<EmployeeMonitoring />} />
                  <Route path="/posture" element={<PostureAnalysis />} />
                  <Route path="/productivity" element={<Productivity />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

function SidebarProfile() {
  const { user, setUser } = useContext(UserContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    setUser(null)
    navigate("/")
  }

  return (
    <div className="profile">
      <div className="avatar">👤</div>
      <h2>{user ? user.name : "Employee"}</h2>
      <p>{user ? user.employee_id : ""}</p>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

export default App
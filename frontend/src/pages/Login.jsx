import { useEffect, useState, useContext } from "react"
import { useNavigate } from "react-router-dom"

import { getEmployees } from "../services/api"
import { UserContext } from "../context/UserContext"

function Login() {
  const [role, setRole] = useState("employee")
  const [employeeId, setEmployeeId] = useState("")
  const [rfid, setRfid] = useState("")
  const [hrId, setHrId] = useState("")
  const [password, setPassword] = useState("")
  const [employees, setEmployees] = useState([])
  const [error, setError] = useState("")

  const navigate = useNavigate()
  const { setUser, setLoggedEmployeeId } = useContext(UserContext)

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getEmployees()
        setEmployees(Array.isArray(data) ? data : [])
        setError("")
      } catch (err) {
        setError("Backend not connected")
      }
    }

    loadEmployees()
  }, [])

  const handleEmployeeLogin = () => {
    setError("")

    const foundUser = employees.find(
      (emp) =>
        String(emp.employee_id).toUpperCase() ===
          employeeId.trim().toUpperCase() &&
        String(emp.rfid_tag).toUpperCase() ===
          rfid.trim().toUpperCase()
    )

    if (foundUser) {
      setUser(foundUser)
      setLoggedEmployeeId(foundUser.employee_id)
      navigate("/dashboard")
    } else {
      setError("Invalid Employee ID or RFID Tag")
    }
  }

  const handleHRLogin = () => {
    setError("")

    if (
      hrId.trim().toUpperCase() === "HR001" &&
      password.trim() === "admin123"
    ) {
      navigate("/hr-dashboard")
    } else {
      setError("Invalid HR credentials")
    }
  }

  return (
    <div className="ergonova-login">
      <div className="chair-visual">
  <div className="chair-back"></div>
  <div className="chair-seat"></div>
  <div className="chair-arm left-arm"></div>
  <div className="chair-arm right-arm"></div>
  <div className="chair-support"></div>
  <div className="chair-base"></div>
  <div className="chair-wheel wheel-1"></div>
  <div className="chair-wheel wheel-2"></div>
  <div className="chair-wheel wheel-3"></div>

  <span className="chair-sensor sensor-1">MPU</span>
  <span className="chair-sensor sensor-2">FSR</span>
  <span className="chair-sensor sensor-3">FLEX</span>
</div>

      {/* Background effects */}
      <div className="glow glow-one"></div>
      <div className="glow glow-two"></div>

      <div className="background-orbit orbit-one"></div>
      <div className="background-orbit orbit-two"></div>
      <div className="background-orbit orbit-three"></div>

      {/* Brand */}
      <div className="brand">

        <div className="brand-icon">
          <span>⌁</span>
        </div>

        <h1>
          ERGONOVA <span>AI</span>
        </h1>

        <p>Intelligent Ergonomics</p>

      </div>

      {/* Login Card */}
      <div className="login-card">

        <div className="card-line"></div>

        <div className="login-header">
          <h2>LOGIN</h2>
          <p>Access your intelligent workspace</p>
        </div>

        {/* Role selector */}
        <div className="role-selector">

          <button
            type="button"
            className={`role ${
              role === "employee" ? "active" : ""
            }`}
            onClick={() => {
              setRole("employee")
              setError("")
            }}
          >
            <span className="role-icon">◉</span>
            Employee
          </button>

          <button
            type="button"
            className={`role ${
              role === "hr" ? "active" : ""
            }`}
            onClick={() => {
              setRole("hr")
              setError("")
            }}
          >
            <span className="role-icon">◇</span>
            HR
          </button>

        </div>

        {/* Employee Login */}
        {role === "employee" && (
          <div className="form-container">

            <div className="input-group">

              <label>EMPLOYEE ID</label>

              <div className="input-wrapper">

                <div className="input-icon">
                  ID
                </div>

                <input
                  type="text"
                  placeholder="Enter employee ID"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value)
                    setError("")
                  }}
                />

              </div>

            </div>

            <div className="input-group">

              <label>RFID TAG</label>

              <div className="input-wrapper">

                <div className="input-icon">
                  ◉
                </div>

                <input
                  type="text"
                  placeholder="Enter RFID tag"
                  value={rfid}
                  onChange={(e) => {
                    setRfid(e.target.value)
                    setError("")
                  }}
                />

              </div>

            </div>

            <button
              className="login-button"
              onClick={handleEmployeeLogin}
            >
              LOGIN
              <span>→</span>
            </button>

          </div>
        )}

        {/* HR Login */}
        {role === "hr" && (
          <div className="form-container">

            <div className="input-group">

              <label>HR ID</label>

              <div className="input-wrapper">

                <div className="input-icon">
                  HR
                </div>

                <input
                  type="text"
                  placeholder="Enter HR ID"
                  value={hrId}
                  onChange={(e) => {
                    setHrId(e.target.value)
                    setError("")
                  }}
                />

              </div>

            </div>

            <div className="input-group">

              <label>PASSWORD</label>

              <div className="input-wrapper">

                <div className="input-icon">
                  •••
                </div>

                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                />

              </div>

            </div>

            <button
              className="login-button"
              onClick={handleHRLogin}
            >
              HR LOGIN
              <span>→</span>
            </button>

          </div>
        )}

        {/* Error */}
        {error && (
          <div className="login-error">
            <span>!</span>
            {error}
          </div>
        )}

        {/* Security */}
        <div className="secure-login">
          <span className="secure-dot"></span>
          Secure AI-enabled authentication
        </div>

      </div>

      {/* Footer */}
      <div className="login-footer">
        <span>ERGONOVA AI</span>
        <span className="footer-divider">•</span>
        Intelligent Employee Well-being
      </div>

    </div>
  )
}

export default Login
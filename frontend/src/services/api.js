// ============================================================
// API SERVICE
// AI ENABLED SMART ERGONOMIC CHAIR
// ============================================================

const API_URL = "http://localhost:5000"

// ============================================================
// COMMON RESPONSE HANDLER
// ============================================================

async function handleResponse(res) {

  let data

  try {
    data = await res.json()
  }
  catch (error) {
    throw new Error(
      "Server returned an invalid response"
    )
  }

  if (!res.ok) {

    throw new Error(
      data?.error ||
      "API request failed"
    )

  }

  return data
}

// ============================================================
// EMPLOYEES
// ============================================================

export async function getEmployees() {

  const res =
    await fetch(`${API_URL}/employees`)

  return handleResponse(res)
}

// ============================================================
// CHAIRS
// ============================================================

export async function getChairs() {

  const res =
    await fetch(`${API_URL}/chairs`)

  return handleResponse(res)
}

// ============================================================
// SENSOR HISTORY
// ============================================================

export async function getSensorHistory(employeeId) {

  if (!employeeId) {
    return []
  }

  const res =
    await fetch(
      `${API_URL}/sensor-history/${employeeId}`
    )

  const data =
    await handleResponse(res)

  console.log(
    "================================="
  )

  console.log(
    "SENSOR HISTORY API RESPONSE:"
  )

  console.log(data)

  console.log(
    "================================="
  )

  return data
}

// ============================================================
// LATEST SENSOR FOR EMPLOYEE
// ============================================================

export async function getLatestSensor(employeeId) {

  if (!employeeId) {
    return null
  }

  const res =
    await fetch(
      `${API_URL}/latest-sensor/${employeeId}`
    )

  return handleResponse(res)
}

// ============================================================
// LATEST ACTIVE RFID EMPLOYEE SENSOR
// ============================================================
//
// RFID is the authoritative source.
//
// This endpoint returns:
// - active employee
// - RFID
// - employee name
// - department
// - CHAIR001
// - latest sensor data
//
// ============================================================

export async function getLatestActiveSensor() {

  const res =
    await fetch(
      `${API_URL}/latest-active-sensor`
    )

  return handleResponse(res)
}

// ============================================================
// RFID STATUS
// ============================================================

export async function getRFIDStatus() {

  const res =
    await fetch(
      `${API_URL}/rfid-status`
    )

  return handleResponse(res)
}

// ============================================================
// CURRENT ARDUINO DATA
// ============================================================

export async function getArduinoData() {

  const res =
    await fetch(
      `${API_URL}/arduino-data`
    )

  return handleResponse(res)
}

// ============================================================
// ADD EMPLOYEE
// ============================================================

export async function addEmployee(
  employeeData
) {

  const res =
    await fetch(
      `${API_URL}/employees`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            employeeData
          )
      }
    )

  return handleResponse(res)
}

// ============================================================
// ASSIGN CHAIR
// ============================================================
//
// Kept for compatibility with the
// existing frontend.
//
// Physical architecture remains CHAIR001.
//
// ============================================================

export async function assignChair(
  assignmentData
) {

  const res =
    await fetch(
      `${API_URL}/assign-chair`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            assignmentData
          )
      }
    )

  return handleResponse(res)
}

// ============================================================
// DAILY REPORT
// ============================================================

export async function getDailyReport(
  employeeId
) {

  if (!employeeId) {
    return null
  }

  const res =
    await fetch(
      `${API_URL}/daily-report/${employeeId}`
    )

  return handleResponse(res)
}

// ============================================================
// DAILY HISTORY
// ============================================================

export async function getDailyHistory(
  employeeId
) {

  if (!employeeId) {
    return []
  }

  const res =
    await fetch(
      `${API_URL}/daily-history/${employeeId}`
    )

  return handleResponse(res)
}

// ============================================================
// EMPLOYEE DASHBOARD
// ============================================================

export async function getEmployeeDashboard(
  employeeId
) {

  if (!employeeId) {
    return null
  }

  const res =
    await fetch(
      `${API_URL}/employee-dashboard/${employeeId}`
    )

  return handleResponse(res)
}
// ============================================================
// HYDRATION
// ============================================================

export async function getHydration() {

  const res =
    await fetch(
      `${API_URL}/api/hydration`
    )

  return handleResponse(res)
}
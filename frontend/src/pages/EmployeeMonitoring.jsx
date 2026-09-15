import { useContext, useEffect, useState } from "react"
import { UserContext } from "../context/UserContext"

import {
  getRFIDStatus,
  getLatestActiveSensor
} from "../services/api"


function EmployeeMonitoring() {

  const { user } = useContext(UserContext)


  // ============================================================
  // EMPLOYEE
  // ============================================================

  const [employee, setEmployee] =
    useState(user || null)


  // ============================================================
  // LATEST SENSOR
  // ============================================================

  const [latestSensor, setLatestSensor] =
    useState(null)


  // ============================================================
  // RFID STATUS
  // ============================================================

  const [rfidStatus, setRfidStatus] =
    useState({

      tapped: false,

      status: "NOT_TAPPED",

      recording: false,

      rfidTag: "",

      employeeId: "",

      employeeName: "",

      department: "",

      chairId: "CHAIR001"

    })


  // ============================================================
  // CHAIR STATUS
  // ============================================================

  const [chairStatus, setChairStatus] =
    useState("AVAILABLE")


  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] =
    useState(true)


  // ============================================================
  // LAST UPDATED
  // ============================================================

  const [lastUpdated, setLastUpdated] =
    useState(null)


  // ============================================================
  // FSR PRESENCE THRESHOLD
  // ============================================================
  //
  // If ANY FSR reaches 100,
  // chair = OCCUPIED.
  //
  // Otherwise:
  // chair = AVAILABLE.
  //
  // ============================================================

  const FSR_PRESENCE_THRESHOLD = 100


  // ============================================================
  // KEEP EMPLOYEE FROM USER CONTEXT
  // ============================================================

  useEffect(() => {

    if (user) {

      setEmployee(prev => ({
        ...(prev || {}),
        ...user
      }))

    }

  }, [user])


  // ============================================================
  // REAL-TIME DATA
  // ============================================================

  useEffect(() => {

    let mounted = true


    async function loadEmployeeData() {

      try {

        // ======================================================
        // 1. GET RFID STATUS
        // ======================================================

        const rfidData =
          await getRFIDStatus()


        if (!mounted) {
          return
        }


        const currentRFID =
          rfidData || {

            tapped: false,

            status: "NOT_TAPPED",

            recording: false,

            rfidTag: "",

            employeeId: "",

            employeeName: "",

            department: "",

            chairId: "CHAIR001"

          }


        setRfidStatus(currentRFID)


        // ======================================================
        // 2. NO RFID TAP
        // ======================================================
        //
        // IMPORTANT:
        // DO NOT REMOVE EMPLOYEE PAGE.
        //
        // Keep existing logged-in employee visible.
        //
        // ======================================================

        if (
          !currentRFID.tapped ||
          !currentRFID.employeeId
        ) {

          setLatestSensor(null)

          setChairStatus("AVAILABLE")

          setLastUpdated(new Date())

          setLoading(false)

          return

        }


        // ======================================================
        // 3. RFID TAPPED
        // ======================================================

        const employeeData = {

          // Existing context employee is preserved
          ...(user || {}),

          employee_id:
            currentRFID.employeeId ||
            user?.employee_id ||
            "",

          name:
            currentRFID.employeeName ||
            user?.name ||
            "",

          rfid_tag:
            currentRFID.rfidTag ||
            user?.rfid_tag ||
            "",

          department:
            currentRFID.department ||
            user?.department ||
            "",

          assigned_chair_id:
            "CHAIR001",

          chair_id:
            "CHAIR001"

        }


        setEmployee(employeeData)


        // ======================================================
        // 4. GET ACTIVE SENSOR DATA
        // ======================================================

        const activeData =
          await getLatestActiveSensor()


        if (!mounted) {
          return
        }


        // ======================================================
        // 5. EXTRACT SENSOR OBJECT
        // ======================================================

        let sensor =
          activeData?.data ||
          activeData?.sensor ||
          activeData ||
          null


        // Prevent non-object responses
        if (
          !sensor ||
          typeof sensor !== "object"
        ) {

          sensor = null

        }


        // ======================================================
        // 6. NO SENSOR DATA YET
        // ======================================================
        //
        // RFID is tapped but FSR has not detected
        // employee presence.
        //
        // ======================================================

        if (!sensor) {

          setLatestSensor(null)

          setChairStatus("AVAILABLE")

          setLastUpdated(new Date())

          setLoading(false)

          return

        }


        // ======================================================
        // 7. READ FSR VALUES
        // ======================================================

        const leftPressure =
          Number(
            sensor.left_pressure ??
            sensor.fsrLeft ??
            sensor.fsr_left ??
            0
          )


        const rightPressure =
          Number(
            sensor.right_pressure ??
            sensor.fsrRight ??
            sensor.fsr_right ??
            0
          )


        const backPressure =
          Number(
            sensor.fsr_back_center ??
            sensor.fsrBackCenter ??
            sensor.fsr_back ??
            0
          )


        // ======================================================
        // 8. FSR PRESENCE DETECTION
        // ======================================================

        const occupied =
          leftPressure >= FSR_PRESENCE_THRESHOLD ||
          rightPressure >= FSR_PRESENCE_THRESHOLD ||
          backPressure >= FSR_PRESENCE_THRESHOLD


        // ======================================================
        // 9. OCCUPIED
        // ======================================================

        if (occupied) {

          setChairStatus("OCCUPIED")

          setLatestSensor(sensor)

        }


        // ======================================================
        // 10. AVAILABLE
        // ======================================================

        else {

          setChairStatus("AVAILABLE")

          setLatestSensor(null)

        }


        setLastUpdated(new Date())

        setLoading(false)


      }

      catch (error) {

        console.error(
          "Employee monitoring update failed:",
          error
        )


        if (mounted) {

          setLoading(false)

        }

      }

    }


    // Initial load

    loadEmployeeData()


    // Refresh every 2 seconds

    const interval =
      setInterval(
        loadEmployeeData,
        2000
      )


    return () => {

      mounted = false

      clearInterval(interval)

    }

  }, [user])


  // ============================================================
  // EMPLOYEE FALLBACK
  // ============================================================
  //
  // We NEVER hide the page just because RFID is not tapped.
  //
  // ============================================================

  const currentEmployee =
    employee ||
    user ||
    {

      employee_id: "EMP001",

      name: "Employee",

      rfid_tag: "",

      department: "",

      assigned_chair_id: "CHAIR001",

      chair_id: "CHAIR001"

    }


  // ============================================================
  // SENSOR
  // ============================================================

  const sensor =
    latestSensor || {}


  // ============================================================
  // SENSOR VALUES
  // ============================================================

  const leftPressure =
    Number(
      sensor.left_pressure ??
      sensor.fsrLeft ??
      sensor.fsr_left ??
      0
    )


  const rightPressure =
    Number(
      sensor.right_pressure ??
      sensor.fsrRight ??
      sensor.fsr_right ??
      0
    )


  const backPressure =
    Number(
      sensor.fsr_back_center ??
      sensor.fsrBackCenter ??
      sensor.fsr_back ??
      0
    )


  // ============================================================
  // POSTURE
  // ============================================================

  const postureStatus =
    sensor.posture_status ??
    sensor.postureStatus ??
    "N/A"


  const normalizedPosture =
    String(
      postureStatus
    ).toUpperCase()


  // ============================================================
  // POSTURE SCORE
  // ============================================================

  const rawChairScore =
    sensor.chair_score ??
    sensor.chairScore ??
    null


  let postureScore = 0


  if (
    rawChairScore !== null &&
    rawChairScore !== undefined
  ) {

    const score =
      Number(rawChairScore)


    if (score <= 3) {

      postureScore = 100

    }

    else if (score <= 5) {

      postureScore = 67

    }

    else {

      postureScore = 33

    }

  }


  // ============================================================
  // VIBRATION
  // ============================================================

  const vibration =
    sensor.vibration ??
    sensor.vibration_alert ??
    "OFF"


  // ============================================================
  // FAN
  // ============================================================

  const fanStatus =
    sensor.fan_status ??
    "OFF"


  // ============================================================
  // HEART RATE
  // ============================================================

  const heartRate =
    sensor.heart_rate ??
    null


  // ============================================================
  // TEMPERATURE
  // ============================================================

  const temperature =
    sensor.temperature ??
    null


  // ============================================================
  // MPU
  // ============================================================

  const mpuScore =
    sensor.mpu_score ??
    0


  const tilt =
    sensor.tilt ??
    0


  const tiltDeviation =
    sensor.tilt_deviation ??
    0


  // ============================================================
  // FLEX
  // ============================================================

  const flex =
    sensor.flex ??
    0


  const flexScore =
    sensor.flex_score ??
    0


  const flexDeviation =
    sensor.flex_deviation ??
    0


  // ============================================================
  // FSR SCORE
  // ============================================================

  const fsrScore =
    sensor.fsr_score ??
    0


  // ============================================================
  // CHAIR SCORE
  // ============================================================

  const chairScore =
    sensor.chair_score ??
    0


  // ============================================================
  // PRODUCTIVITY
  // ============================================================

  const productivity =
    sensor.productivity_score ??
    0


  // ============================================================
  // USER STATE
  // ============================================================

  const userState =
    sensor.user_state ??
    sensor.current_user_state ??
    "N/A"


  // ============================================================
  // CHAIR ACTION
  // ============================================================

  const chairAction =
    sensor.chair_action ??
    "N/A"


  // ============================================================
  // STATUS CLASS
  // ============================================================

  let statusClass =
    "status-good"


  if (
    normalizedPosture === "MODERATE"
  ) {

    statusClass =
      "status-moderate"

  }


  if (
    normalizedPosture === "BAD"
  ) {

    statusClass =
      "status-bad"

  }


  // ============================================================
  // DISPLAY POSTURE
  // ============================================================

  const displayedPosture =
    chairStatus === "OCCUPIED"
      ? postureStatus
      : "N/A"


  // ============================================================
  // DISPLAY RFID
  // ============================================================

  const displayedRFID =
    rfidStatus.tapped
      ? "TAPPED"
      : "NOT TAPPED"


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="ergonova-page employee-monitoring-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="employee-page-header">

        <div>

          <div className="page-eyebrow">
            ERGONOVA AI
          </div>

          <h1 className="page-heading">
            Employee Monitoring
          </h1>

          <p>
            Real-time ergonomic monitoring
            and employee status
          </p>

        </div>


        <div className="live-indicator">

          <span></span>

          {rfidStatus.tapped
            ? "LIVE"
            : "WAITING"}

        </div>

      </div>


      {/* ======================================================
          EMPLOYEE PROFILE
      ====================================================== */}

      <div className="employee-profile-grid">


        {/* EMPLOYEE */}

        <section className="employee-main-card">

          <div className="employee-avatar">
            👤
          </div>


          <h2>
            {currentEmployee.name || "Employee"}
          </h2>


          <p className={statusClass}>

            {displayedPosture}

          </p>


          <div className="employee-live-status">

            {chairStatus === "OCCUPIED"
              ? "Monitoring Active"
              : "Waiting for Employee Presence"}

          </div>

        </section>


        {/* ====================================================
            EMPLOYEE INFORMATION
        ==================================================== */}

        <section className="employee-info-card">

          <h3>
            Employee Information
          </h3>


          <div className="info-row">

            <span>
              Employee ID
            </span>

            <b>
              {currentEmployee.employee_id || "0"}
            </b>

          </div>


          <div className="info-row">

            <span>
              RFID Tag ID
            </span>

            <b>

              {rfidStatus.tapped
                ? (
                    rfidStatus.rfidTag ||
                    currentEmployee.rfid_tag ||
                    "0"
                  )
                : "0"}

            </b>

          </div>


          <div className="info-row">

            <span>
              Department
            </span>

            <b>
              {currentEmployee.department || "0"}
            </b>

          </div>


          <div className="info-row">

            <span>
              Chair ID
            </span>

            <b>
              CHAIR001
            </b>

          </div>

        </section>


        {/* ====================================================
            TODAY'S STATUS
        ==================================================== */}

        <section className="employee-stat-card">

          <h3>
            Today's Status
          </h3>


          <div
            className={
              `large-status ${
                chairStatus === "OCCUPIED"
                  ? statusClass
                  : ""
              }`
            }
          >

            {displayedPosture}

          </div>


          <div className="employee-stat-row">

            <span>
              RFID Status
            </span>

            <strong
              className={
                rfidStatus.tapped
                  ? "status-good"
                  : "status-bad"
              }
            >
              {displayedRFID}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Chair Status
            </span>

            <strong
              className={
                chairStatus === "OCCUPIED"
                  ? "status-good"
                  : "status-moderate"
              }
            >
              {chairStatus}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Posture Score
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? `${postureScore}%`
                : "0%"}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Heart Rate
            </span>

            <strong>

              {heartRate !== null
                ? `${heartRate} BPM`
                : "N/A"}

            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Temperature
            </span>

            <strong>

              {temperature !== null
                ? `${temperature}°C`
                : "N/A"}

            </strong>

          </div>

        </section>


        {/* ====================================================
            CHAIR MONITORING
        ==================================================== */}

        <section className="employee-stat-card">

          <h3>
            Chair Monitoring
          </h3>


          <div className="employee-stat-row">

            <span>
              Fan Status
            </span>

            <strong className="neutral-value">
              {fanStatus}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Vibration Alert
            </span>

            <strong
              className={
                String(vibration).toUpperCase() === "ON"
                  ? "danger-value"
                  : "neutral-value"
              }
            >
              {vibration}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Left Pressure
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? leftPressure
                : 0}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Right Pressure
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? rightPressure
                : 0}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Back Center Pressure
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? backPressure
                : 0}
            </strong>

          </div>

        </section>


        {/* ====================================================
            SENSOR SCORES
        ==================================================== */}

        <section className="employee-stat-card">

          <h3>
            Sensor Analysis
          </h3>


          <div className="employee-stat-row">

            <span>
              MPU Score
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? mpuScore
                : 0}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Flex Score
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? flexScore
                : 0}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              FSR Score
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? fsrScore
                : 0}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Chair Score
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? chairScore
                : 0}
            </strong>

          </div>

        </section>


        {/* ====================================================
            POSTURE SENSOR VALUES
        ==================================================== */}

        <section className="employee-stat-card">

          <h3>
            Posture Sensors
          </h3>


          <div className="employee-stat-row">

            <span>
              Tilt
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? tilt
                : 0}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Tilt Deviation
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? tiltDeviation
                : 0}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Flex
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? flex
                : 0}
            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Flex Deviation
            </span>

            <strong>
              {chairStatus === "OCCUPIED"
                ? flexDeviation
                : 0}
            </strong>

          </div>

        </section>


        {/* ====================================================
            ERGONOMIC RESULT
        ==================================================== */}

        <section className="employee-stat-card">

          <h3>
            Ergonomic Result
          </h3>


          <div className="employee-stat-row">

            <span>
              Productivity
            </span>

            <strong>

              {chairStatus === "OCCUPIED"
                ? `${productivity}%`
                : "0%"}

            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              User State
            </span>

            <strong>

              {chairStatus === "OCCUPIED"
                ? userState
                : "N/A"}

            </strong>

          </div>


          <div className="employee-stat-row">

            <span>
              Chair Action
            </span>

            <strong>

              {chairStatus === "OCCUPIED"
                ? chairAction
                : "N/A"}

            </strong>

          </div>

        </section>


      </div>


      {/* ======================================================
          LAST UPDATED
      ====================================================== */}

      


    </div>

  )

}


export default EmployeeMonitoring
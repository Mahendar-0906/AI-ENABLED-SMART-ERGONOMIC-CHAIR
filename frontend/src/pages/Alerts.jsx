import { useEffect, useState, useContext } from "react"

import { UserContext } from "../context/UserContext"

import {
  getRFIDStatus,
  getLatestActiveSensor
} from "../services/api"


function Alerts() {

  const { user } = useContext(UserContext)

  const [latestSensor, setLatestSensor] =
    useState(null)

  const [chairStatus, setChairStatus] =
    useState("AVAILABLE")

  const [lastUpdated, setLastUpdated] =
    useState(null)


  // ============================================================
  // FSR PRESENCE THRESHOLD
  // ============================================================

  const FSR_PRESENCE_THRESHOLD = 100


  // ============================================================
  // LOAD REAL-TIME ALERT DATA
  // ============================================================

  useEffect(() => {

    if (!user?.employee_id) {
      return
    }

    let mounted = true


    const loadAlertData = async () => {

      try {

        // ======================================================
        // 1. CHECK RFID STATUS
        // ======================================================

        const rfidData =
          await getRFIDStatus()


        if (!mounted) {
          return
        }


        // ======================================================
        // 2. RFID NOT TAPPED
        // ======================================================

        if (
          !rfidData ||
          !rfidData.tapped ||
          !rfidData.employeeId
        ) {

          setLatestSensor(null)

          setChairStatus("AVAILABLE")

          setLastUpdated(new Date())

          return
        }


        // ======================================================
        // 3. GET ACTIVE SENSOR
        // ======================================================

        const activeData =
          await getLatestActiveSensor()


        if (!mounted) {
          return
        }


        const sensor =
          activeData?.data || null


        // ======================================================
        // 4. NO SENSOR DATA
        // ======================================================

        if (!sensor) {

          setLatestSensor(null)

          setChairStatus("AVAILABLE")

          setLastUpdated(new Date())

          return
        }


        // ======================================================
        // 5. FSR VALUES
        // ======================================================

        const leftPressure =
          Number(
            sensor.left_pressure ??
            sensor.leftPressure ??
            sensor.fsr_left ??
            sensor.fsrLeft ??
            0
          )


        const rightPressure =
          Number(
            sensor.right_pressure ??
            sensor.rightPressure ??
            sensor.fsr_right ??
            sensor.fsrRight ??
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
        // 6. CHAIR PRESENCE
        // ======================================================

        const personPresent =

          leftPressure >=
            FSR_PRESENCE_THRESHOLD ||

          rightPressure >=
            FSR_PRESENCE_THRESHOLD ||

          backPressure >=
            FSR_PRESENCE_THRESHOLD


        // ======================================================
        // 7. CHAIR EMPTY
        // ======================================================

        if (!personPresent) {

          setLatestSensor(null)

          setChairStatus("AVAILABLE")

          setLastUpdated(new Date())

          return
        }


        // ======================================================
        // 8. EMPLOYEE PRESENT
        // ======================================================

        setLatestSensor(sensor)

        setChairStatus("OCCUPIED")

        setLastUpdated(new Date())

      }

      catch (error) {

        console.error(
          "Alert sensor data loading failed:",
          error
        )

        if (mounted) {

          setLatestSensor(null)

          setChairStatus("AVAILABLE")

          setLastUpdated(new Date())

        }

      }

    }


    // Initial load

    loadAlertData()


    // Refresh every 2 seconds

    const interval =
      setInterval(
        loadAlertData,
        2000
      )


    return () => {

      mounted = false

      clearInterval(interval)

    }

  }, [user?.employee_id])


  // ============================================================
  // NO USER
  // ============================================================

  if (!user) {

    return (
      <h2>
        No Employee Logged In
      </h2>
    )

  }


  // ============================================================
  // CURRENT SENSOR
  //
  // If chair is empty, use an empty object.
  // This prevents old sensor values from appearing.
  // ============================================================

  const sensor =
    chairStatus === "OCCUPIED"
      ? latestSensor || {}
      : {}


  // ============================================================
  // HELPER
  // ============================================================

  const getValue = (...keys) => {

    for (const key of keys) {

      if (
        sensor[key] !== undefined &&
        sensor[key] !== null &&
        sensor[key] !== ""
      ) {

        return sensor[key]

      }

    }

    return null

  }


  // ============================================================
  // POSTURE
  // ============================================================

  const postureStatus =

    chairStatus === "OCCUPIED"

      ? (
          getValue(
            "posture_status",
            "postureStatus"
          ) ||
          "Good"
        )

      : "Waiting"


  const normalizedPosture =
    String(
      postureStatus
    ).toUpperCase()


  // ============================================================
  // PRESSURE
  // ============================================================

  const leftPressure =

    chairStatus === "OCCUPIED"

      ? Number(
          getValue(
            "left_pressure",
            "leftPressure",
            "fsr_left",
            "fsrLeft"
          )
        ) || 0

      : 0


  const rightPressure =

    chairStatus === "OCCUPIED"

      ? Number(
          getValue(
            "right_pressure",
            "rightPressure",
            "fsr_right",
            "fsrRight"
          )
        ) || 0

      : 0


  const pressureDifference =
    Math.abs(
      leftPressure -
      rightPressure
    )


  // ============================================================
  // FAN
  // ============================================================

  const fanStatus =

    chairStatus === "OCCUPIED"

      ? (
          getValue(
            "fan_status",
            "fanStatus"
          ) ||
          "OFF"
        )

      : "OFF"


  // ============================================================
  // VIBRATION
  // ============================================================

  const vibrationAlert =

    chairStatus === "OCCUPIED"

      ? (
          getValue(
            "vibration_alert",
            "vibrationAlert",
            "vibration"
          ) ||
          "OFF"
        )

      : "OFF"


  // ============================================================
  // TEMPERATURE
  //
  // Sensor not installed yet.
  // ============================================================

  const temperatureValue =

    chairStatus === "OCCUPIED"

      ? getValue(
          "temperature",
          "temp"
        )

      : null


  const temperature =
    temperatureValue !== null
      ? Number(
          temperatureValue
        )
      : 0


  const temperatureAvailable =
    temperature > 0


  // ============================================================
  // HYDRATION
  //
  // Load-cell fields are checked if available.
  // ============================================================

  const hydrationStatus =

    chairStatus === "OCCUPIED"

      ? getValue(
          "hydration_status",
          "hydrationStatus",
          "water_status",
          "waterStatus"
        )

      : null


  const hydrationWeight =

    chairStatus === "OCCUPIED"

      ? getValue(
          "water_weight",
          "waterWeight",
          "bottle_weight",
          "bottleWeight"
        )

      : null


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="alerts-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="alerts-header">

        <div>

          <h1 className="page-heading">
            Alerts & Notifications
          </h1>


          <p className="alerts-subtitle">
            ERGONOVA AI · Real-time ergonomic intelligence
          </p>

        </div>


        <div className="alerts-live">

          <span></span>

          {chairStatus === "OCCUPIED"
            ? "LIVE MONITORING"
            : "WAITING"}

        </div>

      </div>


      {/* ======================================================
          CHAIR STATUS
      ====================================================== */}

      <div className="alerts-page-grid">


        {/* ====================================================
            HYDRATION
        ==================================================== */}

        <AlertCard

          icon="💧"

          title="Hydration Status"

          message={

            chairStatus !== "OCCUPIED"

              ? "Waiting for employee presence."

              : hydrationStatus

              ? hydrationStatus

              : hydrationWeight !== null

              ? `Bottle weight: ${hydrationWeight}`

              : "Hydration sensor awaiting data."

          }

          type="info"

        />


        {/* ====================================================
            POSTURE
        ==================================================== */}

        <AlertCard

          icon="🪑"

          title="Posture Status"

          message={

            chairStatus !== "OCCUPIED"

              ? "Chair is currently unoccupied."

              : normalizedPosture === "BAD"

              ? "Bad posture detected. Please adjust your sitting position."

              : normalizedPosture === "MODERATE"

              ? "Moderate posture detected. Consider correcting your position."

              : "Posture is normal."

          }

          type={

            chairStatus !== "OCCUPIED"

              ? "info"

              : normalizedPosture === "BAD"

              ? "danger"

              : normalizedPosture === "MODERATE"

              ? "warning"

              : "success"

          }

        />


        {/* ====================================================
            PRESSURE
        ==================================================== */}

        <AlertCard

          icon="⚖️"

          title="Pressure Balance"

          message={

            chairStatus !== "OCCUPIED"

              ? "Chair is currently unoccupied."

              : pressureDifference > 100

              ? "Pressure imbalance detected. Adjust your sitting position."

              : "Pressure balance is normal."

          }

          type={

            chairStatus !== "OCCUPIED"

              ? "info"

              : pressureDifference > 100

              ? "warning"

              : "success"

          }

        />


        {/* ====================================================
            FAN
        ==================================================== */}

        <AlertCard

          icon="🌬️"

          title="Fan Status"

          message={

            fanStatus === "ON"

              ? "Seat ventilation fan is currently ON."

              : "Seat ventilation fan is OFF."

          }

          type={

            fanStatus === "ON"

              ? "success"

              : "info"

          }

        />


        {/* ====================================================
            VIBRATION
        ==================================================== */}

        <AlertCard

          icon="📳"

          title="Vibration Alert"

          message={

            vibrationAlert === "ON" ||
            vibrationAlert === "ACTIVE"

              ? "Vibration feedback is currently active."

              : "Vibration alert is OFF."

          }

          type={

            vibrationAlert === "ON" ||
            vibrationAlert === "ACTIVE"

              ? "danger"

              : "success"

          }

        />


        {/* ====================================================
            TEMPERATURE
        ==================================================== */}

        <AlertCard

          icon="🌡️"

          title="Temperature Status"

          message={

            !temperatureAvailable

              ? "Temperature sensor not currently installed."

              : temperature > 32

              ? `Temperature is high: ${temperature}°C.`

              : `Temperature is normal: ${temperature}°C.`

          }

          type={

            !temperatureAvailable

              ? "info"

              : temperature > 32

              ? "warning"

              : "success"

          }

        />


      </div>


      {/* ======================================================
          LAST UPDATE
      ====================================================== */}

      <div className="sensor-update-time">

        {lastUpdated

          ? `Last sensor update: ${lastUpdated.toLocaleTimeString()}`

          : "Waiting for sensor data..."}

      </div>


    </div>

  )

}


// ============================================================
// ALERT CARD
// ============================================================

function AlertCard({
  icon,
  title,
  message,
  type
}) {

  return (

    <section
      className={`alert-card ${type}`}
    >

      <div className="alert-icon">
        {icon}
      </div>


      <div className="alert-content">

        <h3>
          {title}
        </h3>


        <p>
          {message}
        </p>

      </div>

    </section>

  )

}


export default Alerts
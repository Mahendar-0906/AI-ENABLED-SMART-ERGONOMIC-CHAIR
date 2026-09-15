import { useEffect, useState, useContext } from "react"

import { UserContext } from "../context/UserContext"

import {
  getRFIDStatus,
  getLatestActiveSensor
} from "../services/api"


function Reports() {

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
  // LOAD REAL-TIME REPORT DATA
  // ============================================================

  useEffect(() => {

    if (!user?.employee_id) {
      return
    }

    let mounted = true


    const loadReportData = async () => {

      try {

        // ======================================================
        // 1. CHECK RFID
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
        // 5. GET FSR VALUES
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
        // 6. DETECT EMPLOYEE PRESENCE
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
          "Report data loading failed:",
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

    loadReportData()


    // Refresh every 2 seconds

    const interval =
      setInterval(
        loadReportData,
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
  // IMPORTANT:
  // If chair is empty, old sensor values are discarded.
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
  // PRODUCTIVITY
  // ============================================================

  const productivityValue =

    chairStatus === "OCCUPIED"

      ? getValue(
          "productivity_score",
          "productivityScore"
        )

      : null


  const productivity =
    productivityValue !== null
      ? Number(productivityValue)
      : 0


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
  // HEART RATE
  // ============================================================

  const heartRateValue =

    chairStatus === "OCCUPIED"

      ? getValue(
          "heart_rate",
          "heartRate"
        )

      : null


  const heartRate =
    heartRateValue !== null
      ? Number(heartRateValue)
      : 0


  // ============================================================
  // TEMPERATURE
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
      ? Number(temperatureValue)
      : 0


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
  // PRESSURE BALANCE
  // ============================================================

  const pressureBalance =

    chairStatus !== "OCCUPIED"

      ? "Unoccupied"

      : pressureDifference <= 100

      ? "Balanced"

      : "Imbalanced"


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
  // SITTING DURATION
  // ============================================================

  const sittingDuration =

    chairStatus === "OCCUPIED"

      ? (
          getValue(
            "sitting_duration",
            "sittingDuration"
          ) ||
          "N/A"
        )

      : "N/A"


  // ============================================================
  // HYDRATION
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


  // ============================================================
  // PERFORMANCE
  // ============================================================

  let performanceText =
    "Waiting for employee presence"


  if (chairStatus === "OCCUPIED") {

    if (productivity >= 85) {

      performanceText =
        "Excellent Employee Performance"

    }

    else if (productivity >= 70) {

      performanceText =
        "Good Employee Performance"

    }

    else {

      performanceText =
        "Needs Improvement"

    }

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="reports-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="reports-header">

        <div>

          <h1 className="page-heading">
            Employee Performance Reports
          </h1>


          <p className="reports-subtitle">
            ERGONOVA AI · Employee well-being & productivity analysis
          </p>

        </div>


        <div className="reports-live">

          <span></span>

          {chairStatus === "OCCUPIED"
            ? "LIVE DATA"
            : "WAITING"}

        </div>

      </div>


      {/* ======================================================
          CHAIR STATUS
      ====================================================== */}

      <section className="report-card">

        <h3>
          Chair Status
        </h3>


        <div className="report-item">

          <span>
            Employee
          </span>

          <b>
            {user.name || "Employee"}
          </b>

        </div>


        <div className="report-item">

          <span>
            Employee ID
          </span>

          <b>
            {user.employee_id}
          </b>

        </div>


        <div className="report-item">

          <span>
            Chair ID
          </span>

          <b>
            CHAIR001
          </b>

        </div>


        <div className="report-item">

          <span>
            Current Status
          </span>

          <b
            className={
              chairStatus === "OCCUPIED"
                ? "status-good"
                : "status-moderate"
            }
          >
            {chairStatus}
          </b>

        </div>

      </section>


      {/* ======================================================
          REPORT GRID
      ====================================================== */}

      <div className="reports-grid">


        {/* ====================================================
            OVERALL PRODUCTIVITY
        ==================================================== */}

        <section className="report-card main-report">

          <h2>
            Overall Productivity
          </h2>


          <div className="report-circle">

            <span>

              {chairStatus === "OCCUPIED"
                ? `${productivity}%`
                : "--"}

            </span>

          </div>


          <p>
            {performanceText}
          </p>

        </section>


        {/* ====================================================
            DAILY SUMMARY
        ==================================================== */}

        <section className="report-card">

          <h3>
            Daily Summary
          </h3>


          <div className="report-item">

            <span>
              Posture Quality
            </span>

            <b>
              {postureStatus}
            </b>

          </div>


          <div className="report-item">

            <span>
              Heart Rate
            </span>

            <b>

              {chairStatus === "OCCUPIED" &&
              heartRate > 0

                ? `${heartRate} BPM`

                : "N/A"}

            </b>

          </div>


          <div className="report-item">

            <span>
              Temperature
            </span>

            <b>

              {chairStatus === "OCCUPIED" &&
              temperature > 0

                ? `${temperature}°C`

                : "N/A"}

            </b>

          </div>


          <div className="report-item">

            <span>
              Pressure Balance
            </span>

            <b>
              {pressureBalance}
            </b>

          </div>

        </section>


        {/* ====================================================
            ACTIVITY REPORT
        ==================================================== */}

        <section className="report-card">

          <h3>
            Activity Report
          </h3>


          <div className="activity-box green-box">

            Sitting Duration:{" "}

            {chairStatus === "OCCUPIED"
              ? sittingDuration
              : "N/A"}

          </div>


          <div className="activity-box orange-box">

            Water Status:{" "}

            {chairStatus === "OCCUPIED"
              ? hydrationStatus || "N/A"
              : "N/A"}

          </div>


          <div className="activity-box blue-box">

            Posture Status:{" "}

            {postureStatus}

          </div>

        </section>


        {/* ====================================================
            SYSTEM NOTIFICATIONS
        ==================================================== */}

        <section className="report-card">

          <h3>
            System Notifications
          </h3>


          <div className="notification-item">

            🪑 Employee posture:{" "}

            <strong>
              {postureStatus}
            </strong>

          </div>


          <div className="notification-item">

            ⚠️ Vibration Alert:{" "}

            <strong>
              {vibrationAlert}
            </strong>

          </div>


          <div className="notification-item">

            💧 Hydration:{" "}

            <strong>
              {chairStatus === "OCCUPIED"
                ? hydrationStatus || "Awaiting sensor data"
                : "Awaiting employee presence"}

            </strong>

          </div>


          <div className="notification-item">

            🌬️ Ventilation Fan:{" "}

            <strong>
              {fanStatus}
            </strong>

          </div>

        </section>


        {/* ====================================================
            PRESSURE REPORT
        ==================================================== */}

        <section className="report-card">

          <h3>
            Pressure Report
          </h3>


          <div className="report-item">

            <span>
              Left Pressure
            </span>

            <b>
              {chairStatus === "OCCUPIED"
                ? leftPressure
                : "--"}
            </b>

          </div>


          <div className="report-item">

            <span>
              Right Pressure
            </span>

            <b>
              {chairStatus === "OCCUPIED"
                ? rightPressure
                : "--"}
            </b>

          </div>


          <div className="report-item">

            <span>
              Difference
            </span>

            <b>
              {chairStatus === "OCCUPIED"
                ? pressureDifference
                : "--"}
            </b>

          </div>


          <div className="report-item">

            <span>
              Balance
            </span>

            <b>
              {pressureBalance}
            </b>

          </div>

        </section>


      </div>


      {/* ======================================================
          LAST UPDATE
      ====================================================== */}

      <div className="sensor-update-time">

        {lastUpdated

          ? `Last report update: ${lastUpdated.toLocaleTimeString()}`

          : "Waiting for report data..."}

      </div>


    </div>

  )

}


export default Reports
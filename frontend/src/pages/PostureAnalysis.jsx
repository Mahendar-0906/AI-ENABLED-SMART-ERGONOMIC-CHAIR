import { useContext, useEffect, useState } from "react"
import { UserContext } from "../context/UserContext"

import {
  getRFIDStatus,
  getLatestActiveSensor
} from "../services/api"


function PostureAnalysis() {

  const { user } = useContext(UserContext)

  const [sensorData, setSensorData] = useState(null)
  const [chairStatus, setChairStatus] = useState("AVAILABLE")
  const [lastUpdated, setLastUpdated] = useState(null)


  // ============================================================
  // FSR PRESENCE THRESHOLD
  // ============================================================

  const FSR_PRESENCE_THRESHOLD = 100


  // ============================================================
  // LOAD LIVE SENSOR DATA
  // ============================================================

  useEffect(() => {

    let mounted = true


    async function loadSensorData() {

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

          setSensorData(null)

          setChairStatus("AVAILABLE")

          return
        }


        // ======================================================
        // 3. GET CURRENT ACTIVE SENSOR DATA
        // ======================================================

        const activeData =
          await getLatestActiveSensor()


        if (!mounted) {
          return
        }


        const sensor =
          activeData?.data || null


        // ======================================================
        // 4. NO LIVE SENSOR DATA
        // ======================================================

        if (!sensor) {

          setSensorData(null)

          setChairStatus("AVAILABLE")

          return
        }


        // ======================================================
        // 5. READ FSR VALUES
        // ======================================================

        const fsrLeft =
          Number(
            sensor.left_pressure ??
            sensor.fsrLeft ??
            sensor.fsr_left ??
            0
          )


        const fsrRight =
          Number(
            sensor.right_pressure ??
            sensor.fsrRight ??
            sensor.fsr_right ??
            0
          )


        const fsrBackCenter =
          Number(
            sensor.fsr_back_center ??
            sensor.fsrBackCenter ??
            sensor.fsr_back ??
            0
          )


        // ======================================================
        // 6. DETECT EMPLOYEE PRESENCE
        // ======================================================

        const occupied =
          fsrLeft >= FSR_PRESENCE_THRESHOLD ||
          fsrRight >= FSR_PRESENCE_THRESHOLD ||
          fsrBackCenter >= FSR_PRESENCE_THRESHOLD


        // ======================================================
        // 7. CHAIR EMPTY
        // ======================================================

        if (!occupied) {

          setSensorData(null)

          setChairStatus("AVAILABLE")

          return
        }


        // ======================================================
        // 8. EMPLOYEE PRESENT
        // ======================================================

        setSensorData(sensor)

        setChairStatus("OCCUPIED")

        setLastUpdated(new Date())

      }

      catch (error) {

        console.error(
          "Failed to load posture sensor data:",
          error
        )

      }

    }


    loadSensorData()


    // Refresh every 1 second

    const interval =
      setInterval(
        loadSensorData,
        1000
      )


    return () => {

      mounted = false

      clearInterval(interval)

    }

  }, [])


  // ============================================================
  // NO USER
  // ============================================================

  if (!user) {

    return (
      <div className="posture-analysis-page">

        <h2>
          No Employee Logged In
        </h2>

      </div>
    )

  }


  // ============================================================
  // LIVE SENSOR VALUES
  // ============================================================

  const sensor =
    sensorData || {}


  // ============================================================
  // POSTURE STATUS
  // ============================================================

  const postureStatus =
    chairStatus === "OCCUPIED"

      ? (
          sensor.postureStatus ??
          sensor.posture_status ??
          "Good"
        )

      : "Waiting"


  // ============================================================
  // TILT
  // ============================================================

  const tilt =
    chairStatus === "OCCUPIED"

      ? Number(
          sensor.tilt ?? 0
        )

      : 0


  // ============================================================
  // TILT DEVIATION
  // ============================================================

  const tiltDeviation =
    chairStatus === "OCCUPIED"

      ? Number(
          sensor.tiltDeviation ??
          sensor.tilt_deviation ??
          0
        )

      : 0


  // ============================================================
  // FSR LEFT
  // ============================================================

  const fsrLeft =
    chairStatus === "OCCUPIED"

      ? Number(
          sensor.fsrLeft ??
          sensor.fsr_left ??
          sensor.left_pressure ??
          0
        )

      : 0


  // ============================================================
  // FSR RIGHT
  // ============================================================

  const fsrRight =
    chairStatus === "OCCUPIED"

      ? Number(
          sensor.fsrRight ??
          sensor.fsr_right ??
          sensor.right_pressure ??
          0
        )

      : 0


  // ============================================================
  // FSR BACK CENTER
  // ============================================================

  const fsrBackCenter =
    chairStatus === "OCCUPIED"

      ? Number(
          sensor.fsrBackCenter ??
          sensor.fsr_back_center ??
          sensor.fsr_back ??
          0
        )

      : 0


  // ============================================================
  // SENSOR SCORES
  // ============================================================

  const mpuScore =
    chairStatus === "OCCUPIED"

      ? Number(
          sensor.mpuScore ??
          sensor.mpu_score ??
          0
        )

      : 0


  const flexScore =
    chairStatus === "OCCUPIED"

      ? Number(
          sensor.flexScore ??
          sensor.flex_score ??
          0
        )

      : 0


  const fsrScore =
    chairStatus === "OCCUPIED"

      ? Number(
          sensor.fsrScore ??
          sensor.fsr_score ??
          0
        )

      : 0


  const chairScore =
    chairStatus === "OCCUPIED"

      ? Number(
          sensor.chairScore ??
          sensor.chair_score ??
          0
        )

      : 0


  // ============================================================
  // POSTURE SCORE
  // ============================================================

  let postureScore = 0


  if (chairStatus === "OCCUPIED") {

    postureScore =
      Number(
        sensor.postureScore ??
        sensor.posture_score ??
        0
      )


    // If backend does not provide percentage,
    // derive it from chair score.

    if (
      !sensor.postureScore &&
      !sensor.posture_score
    ) {

      if (chairScore === 3) {

        postureScore = 100

      }

      else if (chairScore === 5) {

        postureScore = 67

      }

      else if (chairScore === 7) {

        postureScore = 33

      }

    }

  }


  // ============================================================
  // PRESSURE BALANCE
  // ============================================================

  const totalPressure =
    fsrLeft + fsrRight


  let leftPercentage = 50
  let rightPercentage = 50


  if (totalPressure > 0) {

    leftPercentage =
      (fsrLeft / totalPressure) * 100

    rightPercentage =
      (fsrRight / totalPressure) * 100

  }


  const pressureDifference =
    Math.abs(
      fsrLeft - fsrRight
    )


  const pressureBalance =

    pressureDifference <= 50

      ? "Balanced"

      : pressureDifference <= 120

      ? "Slightly Imbalanced"

      : "Imbalanced"


  // ============================================================
  // SUGGESTED ACTION
  // ============================================================

  let chairAction =
    "No Correction Needed"


  if (postureStatus === "Moderate") {

    chairAction =
      "Adjust Your Posture"

  }


  if (postureStatus === "Bad") {

    chairAction =
      "Sit Upright & Align Your Back"

  }


  if (chairStatus !== "OCCUPIED") {

    chairAction =
      "Waiting for Employee Presence"

  }


  // ============================================================
  // STATUS CLASS
  // ============================================================

  let statusClass =
    "posture-good"


  if (
    postureStatus === "Moderate"
  ) {

    statusClass =
      "posture-moderate"

  }


  if (
    postureStatus === "Bad"
  ) {

    statusClass =
      "posture-bad"

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="posture-analysis-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="posture-page-header">

        <div>

          <h1>
            Posture Intelligence
          </h1>

          <p>
            ERGONOVA AI · Real-time ergonomic monitoring
          </p>

        </div>


        <div className="posture-live">

          {chairStatus === "OCCUPIED"
            ? "LIVE SENSOR DATA"
            : "WAITING FOR PRESENCE"}

        </div>

      </div>


      {/* ======================================================
          CHAIR STATUS
      ====================================================== */}

      <div className="posture-card">

        <h3>
          Chair Status
        </h3>

        <div className="pressure-balance">

          {chairStatus}

        </div>

      </div>


      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <div className="posture-grid">


        {/* POSTURE SCORE */}

        <section className="posture-card main-posture">

          <div className="posture-icon">
            🪑
          </div>


          <p className="posture-label">
            CURRENT POSTURE
          </p>


          <h2 className={statusClass}>

            {postureStatus}

          </h2>


          <p className="posture-label">
            Posture Score
          </p>


          <div className="posture-score">

            {postureScore}%

          </div>


          <p className="posture-label">

            Chair Score: {chairScore}

          </p>

        </section>


        {/* BACK ANGLE */}

        <section className="posture-card angle-card">

          <h3>
            Back Angle
          </h3>


          <p className="posture-label">
            Live MPU6050 deviation
          </p>


          <div className="back-angle-value">

            {tiltDeviation.toFixed(2)}°

          </div>


          <p className="posture-label">

            Raw Tilt: {tilt.toFixed(2)}°

          </p>


          <span
            className={
              tiltDeviation <= 8
                ? "success-badge"
                : tiltDeviation <= 20
                ? "warning-badge"
                : "danger-badge"
            }
          >

            {chairStatus !== "OCCUPIED"

              ? "Waiting"

              : tiltDeviation <= 8

              ? "Stable"

              : tiltDeviation <= 20

              ? "Moderate"

              : "Needs Correction"}

          </span>

        </section>


        {/* PRESSURE BALANCE */}

        <section className="posture-card pressure-card">

          <h3>
            Pressure Balance
          </h3>


          <div className="pressure-balance">

            {chairStatus === "OCCUPIED"
              ? pressureBalance
              : "Waiting"}

          </div>


          <div className="pressure-bar">

            <span
              style={{
                width:
                  `${leftPercentage}%`
              }}
            />

          </div>


          <div className="pressure-values">

            <div>

              <span>
                Left FSR
              </span>

              <strong>
                {fsrLeft}
              </strong>

            </div>


            <div>

              <span>
                Right FSR
              </span>

              <strong>
                {fsrRight}
              </strong>

            </div>

          </div>


          <p className="posture-label">

            Difference: {pressureDifference}

          </p>

        </section>


        {/* SUGGESTED ACTION */}

        <section className="posture-card">

          <h3>
            Suggested Action
          </h3>


          <p className="big-text">

            {chairAction}

          </p>


          <span
            className={
              chairStatus !== "OCCUPIED"

                ? "warning-badge"

                : postureStatus === "Good"

                ? "success-badge"

                : postureStatus === "Moderate"

                ? "warning-badge"

                : "danger-badge"
            }
          >

            {chairStatus !== "OCCUPIED"

              ? "Waiting"

              : postureStatus === "Good"

              ? "Safe"

              : postureStatus === "Moderate"

              ? "Attention"

              : "Alert"}

          </span>

        </section>


        {/* SENSOR SCORES */}

        <section className="posture-card">

          <h3>
            Sensor Analysis
          </h3>


          <div className="sensor-row">

            <span>
              MPU Score
            </span>

            <strong>
              {mpuScore}
            </strong>

          </div>


          <div className="sensor-row">

            <span>
              Flex Score
            </span>

            <strong>
              {flexScore}
            </strong>

          </div>


          <div className="sensor-row">

            <span>
              FSR Score
            </span>

            <strong>
              {fsrScore}
            </strong>

          </div>


          <div className="sensor-row">

            <span>
              Chair Score
            </span>

            <strong>
              {chairScore}
            </strong>

          </div>

        </section>


        {/* BACK SUPPORT PRESSURE */}

        <section className="posture-card">

          <h3>
            Back Support Pressure
          </h3>


          <div className="back-angle-value">

            {fsrBackCenter}

          </div>


          <p className="posture-label">

            Back Center FSR

          </p>

        </section>


      </div>


      {/* ======================================================
          LAST UPDATED
      ====================================================== */}

      <div className="sensor-update-time">

        {lastUpdated

          ? `Last sensor update: ${lastUpdated.toLocaleTimeString()}`

          : "Waiting for live sensor data..."}

      </div>


    </div>

  )

}


export default PostureAnalysis
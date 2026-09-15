import { useEffect, useState, useContext } from "react"
import { UserContext } from "../context/UserContext"


import {
  getSensorHistory,
  getRFIDStatus,
  getLatestActiveSensor,
  getHydration
} from "../services/api"


function Dashboard() {

  const { user, setUser } =
    useContext(UserContext)

  const [history, setHistory] =
    useState([])

  const [chairStatus, setChairStatus] =
    useState("--")
  const [hydration, setHydration] = useState({

  bottleDetected: false,

  currentWeight: null,

  consumption: null,

  lastCheck: "--:--"

});

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

      chairId: "CHAIR001",

      sessionStartedAt: null

    })


  // ============================================================
  // LOAD DASHBOARD DATA
  // ============================================================

  useEffect(() => {
    const fetchHydration = async()=>{
    
    try{
    
    const data = await getHydration()

setHydration(data)
    
    }
    catch(error){
    
    console.log(error);
    
    }
    
    
    };
    
    
    fetchHydration();

    let mounted = true


    async function loadData() {

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

            chairId: "CHAIR001",

            sessionStartedAt: null

          }


        setRfidStatus(currentRFID)


        // ======================================================
        // 2. NO RFID TAP
        //
        // Keep dashboard visible.
        // Do NOT set user to null.
        // ======================================================

        if (
          !currentRFID.tapped ||
          !currentRFID.employeeId
        ) {

          setChairStatus("--")

          setHistory([])

          return
        }


        // ======================================================
        // 3. ACTIVE EMPLOYEE
        // ======================================================

        const employeeId =
          currentRFID.employeeId


        // ======================================================
        // 4. GET LATEST ACTIVE SENSOR
        // ======================================================

        const activeData =
          await getLatestActiveSensor()


        if (!mounted) {
          return
        }


        const sensor =
          activeData?.data || {}


        // ======================================================
        // 5. FSR PRESENCE DETECTION
        //
        // FSR >= 100 means meaningful pressure.
        //
        // Any one of the three FSR sensors can detect presence.
        // ======================================================

        const leftPressure =
          Number(
            sensor.left_pressure ??
            sensor.fsrLeft ??
            0
          )


        const rightPressure =
          Number(
            sensor.right_pressure ??
            sensor.fsrRight ??
            0
          )


        const backPressure =
          Number(
            sensor.fsr_back_center ??
            sensor.fsrBackCenter ??
            0
          )


        const FSR_PRESENCE_THRESHOLD = 100


        const occupied =
          leftPressure >= FSR_PRESENCE_THRESHOLD ||
          rightPressure >= FSR_PRESENCE_THRESHOLD ||
          backPressure >= FSR_PRESENCE_THRESHOLD


        // ======================================================
        // 6. CHAIR STATUS
        // ======================================================

        if (occupied) {

          setChairStatus("OCCUPIED")

        }

        else {

          setChairStatus("AVAILABLE")

        }


        // ======================================================
        // 7. BUILD DASHBOARD USER
        // ======================================================

        const dashboardUser = {

          // ----------------------------------------------------
          // EMPLOYEE
          // ----------------------------------------------------

          employee_id:
            currentRFID.employeeId,

          name:
            currentRFID.employeeName ||
            activeData?.employeeName ||
            "",

          rfid_tag:
            currentRFID.rfidTag ||
            activeData?.rfidTag ||
            "",

          department:
            currentRFID.department ||
            activeData?.department ||
            "",


          // ----------------------------------------------------
          // PHYSICAL CHAIR
          // ----------------------------------------------------

          assigned_chair_id:
            "CHAIR001",

          chair_id:
            "CHAIR001",


          // ----------------------------------------------------
          // POSTURE
          //
          // Only meaningful when occupied.
          // ----------------------------------------------------

          posture_status:
            occupied
              ? (
                  sensor.posture_status ??
                  sensor.postureStatus ??
                  "Good"
                )
              : null,
          model_posture_status:
            occupied
              ? (sensor.model_posture_status ?? null)
              : null,


          current_posture_score:
            occupied
              ? (
                  sensor.current_posture_score ??
                  sensor.posture_score ??
                  null
                )
              : null,


          chair_score:
            occupied
              ? (
                  sensor.chair_score ??
                  null
                )
              : null,


          // ----------------------------------------------------
          // MPU6050
          // ----------------------------------------------------

          tilt:
            occupied
              ? (sensor.tilt ?? 0)
              : null,

          tilt_deviation:
            occupied
              ? (
                  sensor.tilt_deviation ??
                  sensor.tiltDeviation ??
                  0
                )
              : null,

          mpu_score:
            occupied
              ? (sensor.mpu_score ?? null)
              : null,


          // ----------------------------------------------------
          // FLEX SENSOR
          // ----------------------------------------------------

          flex:
            occupied
              ? (sensor.flex ?? 0)
              : null,

          flex_deviation:
            occupied
              ? (
                  sensor.flex_deviation ??
                  sensor.flexDeviation ??
                  0
                )
              : null,

          flex_score:
            occupied
              ? (sensor.flex_score ?? null)
              : null,


          // ----------------------------------------------------
          // FSR
          // ----------------------------------------------------

          left_pressure:
            occupied
              ? leftPressure
              : null,

          right_pressure:
            occupied
              ? rightPressure
              : null,

          back_pressure:
            occupied
              ? backPressure
              : null,


          fsrLeft:
            occupied
              ? leftPressure
              : null,

          fsrRight:
            occupied
              ? rightPressure
              : null,

          fsrBackCenter:
            occupied
              ? backPressure
              : null,


          fsr_score:
            occupied
              ? (
                  sensor.fsr_score ??
                  null
                )
              : null,


          // ----------------------------------------------------
          // PRODUCTIVITY
          // ----------------------------------------------------

          productivity_score:
            occupied
              ? (
                  sensor.productivity_score ??
                  null
                )
              : null,


          // ----------------------------------------------------
          // USER STATE
          // ----------------------------------------------------

          current_user_state:
            occupied
              ? (
                  sensor.current_user_state ||
                  sensor.user_state ||
                  "Focused"
                )
              : null,

          user_state:
            occupied
              ? (
                  sensor.user_state ||
                  sensor.current_user_state ||
                  "Focused"
                )
              : null,


          // ----------------------------------------------------
          // CHAIR ACTION
          // ----------------------------------------------------

          chair_action:
            occupied
              ? (
                  sensor.chair_action ||
                  "Maintain good posture"
                )
              : null,


          // ----------------------------------------------------
          // VIBRATION
          // ----------------------------------------------------

          vibration_alert:
            occupied
              ? (
                  sensor.vibration_alert ||
                  sensor.vibration ||
                  "OFF"
                )
              : null,


          // ----------------------------------------------------
          // FAN
          //
          // Hardware will be added later.
          // ----------------------------------------------------

          fan_status:
            occupied
              ? (
                  sensor.fan_status ||
                  "OFF"
                )
              : "N/A",


          // ----------------------------------------------------
          // HEART RATE
          //
          // Future sensor.
          // ----------------------------------------------------

          heart_rate:
            sensor.heart_rate ??
            null,


          // ----------------------------------------------------
          // TEMPERATURE
          //
          // Future sensor.
          // ----------------------------------------------------

          temperature:
            sensor.temperature ??
            null

        }


        // ======================================================
        // 8. UPDATE USER
        // ======================================================

        setUser(dashboardUser)


        // ======================================================
        // 9. SENSOR HISTORY
        //
        // IMPORTANT:
        //
        // History starts only when FSR detects OCCUPIED.
        // ======================================================

        if (!occupied) {

          setHistory([])

          return
        }


        const historyData =
          await getSensorHistory(
            employeeId
          )


        if (!mounted) {
          return
        }


        setHistory(

          Array.isArray(historyData)

            ? historyData.slice(-5)

            : []

        )

      }


      catch (error) {

        console.error(
          "Dashboard data loading failed:",
          error
        )

      }

    }


    // Initial load

    loadData()


    // ============================================================
    // REFRESH EVERY 3 SECONDS
    // ============================================================

    const interval =
      setInterval(
        () => {
      loadData()
      fetchHydration()
    },
    3000
      )


    return () => {

      mounted = false

      clearInterval(interval)

    }


  }, [setUser])


  // ============================================================
  // DASHBOARD SHOULD ALWAYS REMAIN VISIBLE
  // ============================================================

  const isRFIDActive =
    rfidStatus.tapped &&
    Boolean(rfidStatus.employeeId)


  const isOccupied =
    isRFIDActive &&
    chairStatus === "OCCUPIED"


  // ============================================================
  // POSTURE STATUS
  // ============================================================

  const rawPostureStatus =
    isOccupied

      ? String(
          user?.posture_status ||
          "Good"
        ).trim()

      : "--"


  const postureStatus =

    rawPostureStatus === "--"

      ? "--"

      : rawPostureStatus.toLowerCase() === "bad"

        ? "BAD"

        : rawPostureStatus.toLowerCase() === "moderate"

          ? "MODERATE"

          : "GOOD"


  const modelPostureStatus =
    isOccupied
      ? String(user?.model_posture_status || "--").toUpperCase()
      : "--"


  // ============================================================
  // PHYSIOLOGICAL / ERGONOMIC STATE
  // ============================================================

  let physiologicalState =
    "--"


  if (isOccupied) {

    physiologicalState =
      "Focused"


    if (
      postureStatus === "MODERATE"
    ) {

      physiologicalState =
        "Relaxed"

    }


    if (
      postureStatus === "BAD"
    ) {

      physiologicalState =
        "Strained"

    }

  }


  // ============================================================
  // CHAIR SCORE
  // ============================================================

  const chairScore =
    isOccupied

      ? Number(

          user?.current_chair_score ??

          user?.chair_score ??

          user?.current_posture_score ??

          3

        )

      : null


  // ============================================================
  // POSTURE SCORE
  // ============================================================

  let postureScore =
    null


  if (

    isOccupied &&

    chairScore !== null &&

    chairScore >= 3 &&

    chairScore <= 9

  ) {

    postureScore =
      Math.round(

        ((9 - chairScore) / 6) * 100

      )

  }


  if (
    postureScore !== null
  ) {

    postureScore =
      Math.max(

        0,

        Math.min(
          100,
          postureScore
        )

      )

  }


  // ============================================================
  // PRODUCTIVITY
  // ============================================================

  const overallProductivity =

    isOccupied &&
    postureScore !== null

      ? postureScore

      : null


  // ============================================================
  // SENSOR VALUES
  // ============================================================

  const leftPressure =
    isOccupied

      ? Number(

          user?.left_pressure ??

          user?.fsrLeft ??

          0

        )

      : null


  const rightPressure =
    isOccupied

      ? Number(

          user?.right_pressure ??

          user?.fsrRight ??

          0

        )

      : null


  const backPressure =
    isOccupied

      ? Number(

          user?.back_pressure ??

          user?.fsrBackCenter ??

          user?.fsr_back_center ??

          0

        )

      : null


  // ============================================================
  // OTHER VALUES
  // ============================================================

  const chairId =
    "CHAIR001"


  const vibrationAlert =
    isOccupied

      ? (
          user?.vibration_alert ||
          "OFF"
        )

      : "N/A"


  const fanStatus =
    isRFIDActive

      ? (
          user?.fan_status ||
          "OFF"
        )

      : "N/A"


  const chairAction =
    isOccupied

      ? (
          user?.chair_action ||
          "Maintain good posture"
        )

      : "--"


  // ============================================================
  // HEART RATE
  //
  // Keep N/A until hardware is added.
  // ============================================================

  // ============================================================
// HEART RATE
// ============================================================

const heartRate =
  isOccupied &&
  user?.heart_rate !== null &&
  user?.heart_rate !== undefined
    ? `${Number(user.heart_rate)} BPM`
    : "N/A"
    

  // ============================================================
  // TEMPERATURE
  //
  // Keep N/A until hardware is added.
  // ============================================================

  const temperature =
    "N/A"


  // ============================================================
  // PRESSURE BAR
  // ============================================================

  const leftPressurePercent =

    leftPressure === null

      ? 0

      : Math.min(

          (leftPressure / 1023) * 100,

          100

        )


  const rightPressurePercent =

    rightPressure === null

      ? 0

      : Math.min(

          (rightPressure / 1023) * 100,

          100

        )


  const backPressurePercent =

    backPressure === null

      ? 0

      : Math.min(

          (backPressure / 1023) * 100,

          100

        )


  // ============================================================
  // POSTURE COLOR
  // ============================================================

  let postureColor =
    "blue-text"


  if (
    postureStatus === "GOOD"
  ) {

    postureColor =
      "green"

  }


  if (
    postureStatus === "MODERATE"
  ) {

    postureColor =
      "orange"

  }


  if (
    postureStatus === "BAD"
  ) {

    postureColor =
      "red"

  }


  // ============================================================
  // WEEKLY PRODUCTIVITY
  // ============================================================

  const weeklyValues =

    history

      .map((item) => {

        const value =
          Number(

            item.productivity_score ??

            item.posture_score ??

            0

          )


        return Math.max(

          0,

          Math.min(
            100,
            value
          )

        )

      })

      .filter(
        (value) =>
          !isNaN(value)
      )


  const weekLabels = [

    "1",
    "2",
    "3",
    "4",
    "5"

  ]


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="ergonova-dashboard">


      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <div className="topbar">

        <div>

          <h1>
            ERGONOVA AI
          </h1>

          <span className="dashboard-subtitle">
            ERGONOMIC INTELLIGENCE
          </span>

        </div>


        <div className="clock">

          {new Date().toLocaleTimeString()}

        </div>

      </div>


      {/* ======================================================
          TOP CARDS
      ====================================================== */}

      <div className="cards">


        <Card

          title="Posture Score"

          value={
            postureScore === null
              ? "--"
              : `${postureScore}%`
          }

          icon="🪑"

          blue

        />


        <Card

          title="Heart Rate"

          value={heartRate}

          icon="❤️"

        />


        <Card

          title="Temperature"

          value={temperature}

          icon="🌡️"

        />


        <Card

          title="Physiological State"

          value={physiologicalState}

          icon="⭐"

        />


        <Card

          title="AI Model Output"

          value={modelPostureStatus}

          icon="🤖"

          blue

        />


      </div>


      <section className="panel model-values-panel">

        <div className="panel-header">

          <h2>Model Input Values</h2>

          <span>{isOccupied ? "LIVE" : "WAITING"}</span>

        </div>

        <div className="model-values-grid">

          <div><span>MPU Angle</span><strong>{isOccupied ? `${user?.tilt ?? "--"}°` : "--"}</strong></div>
          <div><span>MPU Deviation</span><strong>{isOccupied ? `${user?.tilt_deviation ?? "--"}°` : "--"}</strong></div>
          <div><span>Flex Value</span><strong>{isOccupied ? user?.flex ?? "--" : "--"}</strong></div>
          <div><span>Flex Deviation</span><strong>{isOccupied ? user?.flex_deviation ?? "--" : "--"}</strong></div>
          <div><span>Left FSR</span><strong>{isOccupied ? leftPressure : "--"}</strong></div>
          <div><span>Right FSR</span><strong>{isOccupied ? rightPressure : "--"}</strong></div>
          <div><span>Back FSR</span><strong>{isOccupied ? backPressure : "--"}</strong></div>
          <div><span>Pressure Imbalance</span><strong>{isOccupied ? Math.abs(leftPressure - rightPressure) : "--"}</strong></div>

        </div>

      </section>


      {/* ======================================================
          STATUS ROW
      ====================================================== */}

      <div className="status-row">


        {/* LIVE POSTURE */}

        <Status

          title="Live Posture"

          value={postureStatus}

          color={postureColor}

        />


        {/* FAN */}

        <Status

          title="Fan Status"

          value={fanStatus}

          color="blue-text"

        />


        {/* VIBRATION */}

        <Status

          title="Vibration Alert"

          value={vibrationAlert}

          color={
            isOccupied
              ? "orange"
              : "blue-text"
          }

        />


        {/* CHAIR ID */}

        <Status

          title="Chair ID"

          value={chairId}

          color="green"

        />


        {/* RFID */}

        <Status

          title="RFID Status"

          value={

            <span className="rfid-status-value">

              <span

                className={

                  rfidStatus.tapped

                    ? "rfid-light green"

                    : "rfid-light red"

                }

              >
              </span>


              {

                rfidStatus.tapped

                  ? "TAPPED"

                  : "NOT TAPPED"

              }

            </span>

          }

          color={

            rfidStatus.tapped

              ? "green"

              : "red"

          }

        />


        {/* ==================================================
            CHAIR STATUS
        ================================================== */}

        <Status

          title="Chair Status"

          value={

            !rfidStatus.tapped

              ? "--"

              : chairStatus

          }

          color={

            !rfidStatus.tapped

              ? "blue-text"

              : chairStatus === "OCCUPIED"

                ? "green"

                : "orange"

          }

        />


      </div>


      {/* ======================================================
          HYDRATION MONITORING
      ====================================================== */}

      <section className="dashboard-card hydration-card">

  <div className="hydration-header">

    <div>
      <h3>
        Hydration Intelligence
      </h3>

      <p>
        Smart water consumption monitoring
      </p>
    </div>


    <div className="hydration-icon">
      💧
    </div>

  </div>


  <div className="hydration-status">

    <span className="hydration-dot"></span>

    <strong>

      {hydration.bottleDetected
        ? "BOTTLE DETECTED"
        : "BOTTLE NOT DETECTED"
      }

    </strong>

  </div>



  <div className="hydration-details">


    <div>

      <span>
        Current Weight
      </span>

      <strong>
       {hydration.currentWeight === null
    ? "--"
    : `${hydration.currentWeight} g`
  }
      </strong>

    </div>



    <div>

      <span>
        Last Check
      </span>

      <strong>
        {hydration.lastCheck}
      </strong>

    </div>



    <div>

      <span>
        Consumption
      </span>

      <strong>
        {hydration.consumption === null
    ? "--"
    : `${hydration.consumption} g`
  }
      </strong>

    </div>


  </div>



  <div className="hydration-message">

    {hydration.bottleDetected

      ?

      "Bottle detected. Monitoring water consumption."

      :

      "Place the water bottle on the holder to begin hourly hydration monitoring."

    }

  </div>


</section>


      {/* ======================================================
          PRODUCTIVITY
      ====================================================== */}

      <div className="content">


        {/* PRODUCTIVITY HISTORY */}

        <section className="box">


          <div className="box-title">

            <h3>
              Productivity History
            </h3>

            <button>
              View Analytics
            </button>

          </div>


          <div className="bars">

            {weekLabels.map(
              (label, index) => {

                const productivityValue =
                  weeklyValues[index] ?? 0


                return (

                  <div

                    className="bar-item"

                    key={label}

                  >

                    <div

                      className="bar"

                      style={{

                        height:
                          `${productivityValue}%`

                      }}

                    >
                    </div>


                    <p>
                      {label}
                    </p>

                  </div>

                )

              }
            )}

          </div>


        </section>


        {/* OVERALL PRODUCTIVITY */}

        <section className="box score">


          <div className="circle">

            {

              overallProductivity === null

                ? "--"

                : `${overallProductivity}%`

            }

          </div>


          <h3>
            Overall Productivity
          </h3>


          <p>

            {rfidStatus.tapped &&
             rfidStatus.employeeName

              ? `${rfidStatus.employeeName} - ${rfidStatus.employeeId}`

              : "--"

            }

          </p>


        </section>


      </div>


      {/* ======================================================
          PRESSURE + NOTIFICATIONS
      ====================================================== */}

      <div className="bottom-section">


        {/* PRESSURE */}

        <section className="box">


          <h3>
            Pressure Balance Visualization
          </h3>


          {/* LEFT */}

          <div className="pressure-row">


            <div className="pressure-title">

              <span>
                Left Pressure
              </span>

              <strong>

                {

                  leftPressure === null

                    ? "--"

                    : leftPressure

                }

              </strong>

            </div>


            <div className="pressure-bar">

              <span

                style={{

                  width:
                    `${leftPressurePercent}%`

                }}

              >
              </span>

            </div>

          </div>


          {/* RIGHT */}

          <div className="pressure-row">


            <div className="pressure-title">

              <span>
                Right Pressure
              </span>

              <strong>

                {

                  rightPressure === null

                    ? "--"

                    : rightPressure

                }

              </strong>

            </div>


            <div className="pressure-bar">

              <span

                style={{

                  width:
                    `${rightPressurePercent}%`

                }}

              >
              </span>

            </div>

          </div>


          {/* BACK CENTER */}

          <div className="pressure-row">


            <div className="pressure-title">

              <span>
                Back Center
              </span>

              <strong>

                {

                  backPressure === null

                    ? "--"

                    : backPressure

                }

              </strong>

            </div>


            <div className="pressure-bar">

              <span

                style={{

                  width:
                    `${backPressurePercent}%`

                }}

              >
              </span>

            </div>

          </div>


        </section>


        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        <section className="box">


          <h3>
            Notifications
          </h3>


          <div className="alerts">


            <p>

              🔔 Physiological State:{" "}

              <strong>
                {physiologicalState}
              </strong>

            </p>


            <p>

              🔔 Posture:{" "}

              <strong>
                {postureStatus}
              </strong>

            </p>


            <p>

              🔔 Chair Status:{" "}

              <strong>
                {

                  !rfidStatus.tapped

                    ? "--"

                    : chairStatus

                }

              </strong>

            </p>


            <p>

              🔔 {chairAction}

            </p>


          </div>


        </section>


      </div>


    </div>

  )

}


// ============================================================
// CARD COMPONENT
// ============================================================

function Card({

  title,
  value,
  icon,
  blue

}) {

  return (

    <div

      className={

        blue

          ? "card blue"

          : "card"

      }

    >

      <div>

        <p>
          {title}
        </p>

        <h2>
          {value}
        </h2>

      </div>


      <span>
        {icon}
      </span>


    </div>

  )

}


// ============================================================
// STATUS COMPONENT
// ============================================================

function Status({

  title,
  value,
  color

}) {

  return (

    <div className="status-card">

      <p>
        {title}
      </p>

      <h3 className={color}>
        {value}
      </h3>

    </div>

  )

}


export default Dashboard
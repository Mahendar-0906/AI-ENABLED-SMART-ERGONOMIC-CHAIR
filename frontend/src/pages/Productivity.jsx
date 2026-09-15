import { useEffect, useState, useContext } from "react"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts"

import { UserContext } from "../context/UserContext"

import {
  getRFIDStatus,
  getLatestActiveSensor,
  getSensorHistory
} from "../services/api"


function Productivity() {

  const { user } = useContext(UserContext)

  const [history, setHistory] = useState([])

  const [latestSensor, setLatestSensor] =
    useState(null)

  const [lastUpdate, setLastUpdate] =
    useState(null)

  const [chairStatus, setChairStatus] =
    useState("AVAILABLE")


  // ============================================================
  // FSR PRESENCE THRESHOLD
  // ============================================================
  //
  // If ANY FSR reaches this value,
  // the chair is considered occupied.
  //
  // Tune this later after physical testing.
  //
  // ============================================================

  const FSR_PRESENCE_THRESHOLD = 100


  // ============================================================
  // LOAD REAL-TIME PRODUCTIVITY DATA
  // ============================================================

  useEffect(() => {

    if (!user?.employee_id) {
      return
    }

    let mounted = true


    const loadProductivityData = async () => {

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

          setHistory([])

          setChairStatus("AVAILABLE")

          setLastUpdate(new Date())

          return
        }


        // ======================================================
        // 3. GET CURRENT ACTIVE SENSOR
        // ======================================================

        const activeData =
          await getLatestActiveSensor()


        if (!mounted) {
          return
        }


        const sensor =
          activeData?.data || null


        // ======================================================
        // 4. NO ACTIVE SENSOR DATA
        // ======================================================

        if (!sensor) {

          setLatestSensor(null)

          setHistory([])

          setChairStatus("AVAILABLE")

          setLastUpdate(new Date())

          return
        }


        // ======================================================
        // 5. GET CURRENT FSR VALUES
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
        // 6. DETECT EMPLOYEE PRESENCE
        // ======================================================

        const occupied =
          leftPressure >=
            FSR_PRESENCE_THRESHOLD ||

          rightPressure >=
            FSR_PRESENCE_THRESHOLD ||

          backPressure >=
            FSR_PRESENCE_THRESHOLD


        // ======================================================
        // 7. CHAIR EMPTY
        // ======================================================

        if (!occupied) {

          setLatestSensor(null)

          setHistory([])

          setChairStatus("AVAILABLE")

          setLastUpdate(new Date())

          return
        }


        // ======================================================
        // 8. EMPLOYEE IS PRESENT
        // ======================================================

        setLatestSensor(sensor)

        setChairStatus("OCCUPIED")

        setLastUpdate(new Date())


        // ======================================================
        // 9. LOAD HISTORY
        //
        // History is used ONLY for graphs.
        //
        // It does NOT control the current live values.
        //
        // ======================================================

        try {

          const historyData =
            await getSensorHistory(
              user.employee_id
            )


          if (!mounted) {
            return
          }


          let records = []


          // Backend returns array

          if (
            Array.isArray(historyData)
          ) {

            records =
              historyData

          }


          // Backend returns { history: [] }

          else if (
            Array.isArray(
              historyData?.history
            )
          ) {

            records =
              historyData.history

          }


          // Backend returns { data: [] }

          else if (
            Array.isArray(
              historyData?.data
            )
          ) {

            records =
              historyData.data

          }


          setHistory(records)

        }

        catch (historyError) {

          console.error(
            "History loading failed:",
            historyError
          )

          setHistory([])

        }

      }

      catch (error) {

        console.error(
          "Productivity loading failed:",
          error
        )


        if (mounted) {

          setLatestSensor(null)

          setHistory([])

          setChairStatus("AVAILABLE")

          setLastUpdate(new Date())

        }

      }

    }


    // ==========================================================
    // INITIAL LOAD
    // ==========================================================

    loadProductivityData()


    // ==========================================================
    // REFRESH EVERY 2 SECONDS
    // ==========================================================

    const interval =
      setInterval(
        loadProductivityData,
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

      <div className="productivity-page">

        <h2>
          No Employee Logged In
        </h2>

      </div>

    )

  }


  // ============================================================
  // CURRENT SENSOR
  //
  // IMPORTANT:
  // Only use live sensor data when chair is occupied.
  //
  // ============================================================

  const sensor =
    chairStatus === "OCCUPIED"
      ? latestSensor || {}
      : {}


  // ============================================================
  // HELPER
  // Supports camelCase + snake_case
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
  // CURRENT POSTURE SCORE
  // ============================================================

  const currentPostureScore =

    chairStatus === "OCCUPIED"

      ? Number(
          getValue(
            "posture_score",
            "postureScore",
            "current_posture_score"
          )
        ) || 0

      : 0


  // ============================================================
  // CURRENT CHAIR SCORE
  // ============================================================

  const currentChairScore =

    chairStatus === "OCCUPIED"

      ? Number(
          getValue(
            "chair_score",
            "chairScore"
          )
        ) || 0

      : 0


  // ============================================================
  // CURRENT MPU SCORE
  // ============================================================

  const currentMPUScore =

    chairStatus === "OCCUPIED"

      ? Number(
          getValue(
            "mpu_score",
            "mpuScore"
          )
        ) || 0

      : 0


  // ============================================================
  // CURRENT FLEX SCORE
  // ============================================================

  const currentFlexScore =

    chairStatus === "OCCUPIED"

      ? Number(
          getValue(
            "flex_score",
            "flexScore"
          )
        ) || 0

      : 0


  // ============================================================
  // CURRENT FSR SCORE
  // ============================================================

  const currentFSRScore =

    chairStatus === "OCCUPIED"

      ? Number(
          getValue(
            "fsr_score",
            "fsrScore"
          )
        ) || 0

      : 0


  // ============================================================
  // CURRENT LEFT PRESSURE
  // ============================================================

  const currentLeftPressure =

    chairStatus === "OCCUPIED"

      ? Number(
          getValue(
            "fsr_left",
            "fsrLeft",
            "left_fsr",
            "left_pressure"
          )
        ) || 0

      : 0


  // ============================================================
  // CURRENT RIGHT PRESSURE
  // ============================================================

  const currentRightPressure =

    chairStatus === "OCCUPIED"

      ? Number(
          getValue(
            "fsr_right",
            "fsrRight",
            "right_fsr",
            "right_pressure"
          )
        ) || 0

      : 0


  // ============================================================
  // HEART RATE
  //
  // Sensor not installed yet.
  // ============================================================

  // ============================================================
// HEART RATE
// ============================================================

const currentHeartRate =
  chairStatus === "OCCUPIED"
    ? Number(
        getValue(
          "heart_rate",
          "heartRate"
        )
      ) || null
    : null


  // ============================================================
  // TEMPERATURE
  //
  // Sensor not installed yet.
  // ============================================================

  const currentTemperature = null


  // ============================================================
  // PRODUCTIVITY SCORE
  // ============================================================

  let currentProductivity = 0


  if (
    chairStatus === "OCCUPIED"
  ) {

    currentProductivity =
      getValue(
        "productivity_score",
        "productivityScore"
      )


    // ==========================================================
    // IF BACKEND DOES NOT PROVIDE PRODUCTIVITY
    // ==========================================================

    if (
      currentProductivity === null ||
      currentProductivity === undefined
    ) {

      if (
        currentChairScore === 3
      ) {

        currentProductivity =
          100

      }

      else if (
        currentChairScore === 5
      ) {

        currentProductivity =
          70

      }

      else if (
        currentChairScore === 7
      ) {

        currentProductivity =
          40

      }

      else {

        currentProductivity =
          currentPostureScore

      }

    }


    currentProductivity =
      Number(
        currentProductivity
      ) || 0

  }


  // ============================================================
  // TREND DATA
  //
  // Historical records are used for charts only.
  // ============================================================

  const trendData =
    history.length > 0

      ? history.map(
          (item, index) => {

            const posture =
              Number(
                item.posture_score ??
                item.postureScore ??
                item.current_posture_score
              ) || 0


            const chairScore =
              Number(
                item.chair_score ??
                item.chairScore
              ) || 0


            let productivity =
              Number(
                item.productivity_score ??
                item.productivityScore
              )


            // ==================================================
            // PRODUCTIVITY FALLBACK
            // ==================================================

            if (
              !productivity
            ) {

              if (
                chairScore === 3
              ) {

                productivity =
                  100

              }

              else if (
                chairScore === 5
              ) {

                productivity =
                  70

              }

              else if (
                chairScore === 7
              ) {

                productivity =
                  40

              }

              else {

                productivity =
                  posture

              }

            }


            const heartValue =
              item.heart_rate ??
              item.heartRate


            const temperatureValue =
              item.temperature ??
              item.temp


            return {

              time:
                `R${index + 1}`,

              posture,

              productivity,

              chairScore,

              heart:
                heartValue !== undefined &&
                heartValue !== null

                  ? Number(
                      heartValue
                    )

                  : null,

              temp:
                temperatureValue !== undefined &&
                temperatureValue !== null

                  ? Number(
                      temperatureValue
                    )

                  : null

            }

          }
        )

      : [
          {
            time: "Now",

            posture:
              currentPostureScore,

            productivity:
              currentProductivity,

            chairScore:
              currentChairScore,

            heart:
              null,

            temp:
              null
          }
        ]


  // ============================================================
  // PRESSURE DATA
  // ============================================================

  const pressureData = [

    {
      name: "Left",

      value:
        currentLeftPressure
    },

    {
      name: "Right",

      value:
        currentRightPressure
    }

  ]


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="productivity-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="productivity-header">

        <div>

          <h1 className="page-heading">
            Productivity Intelligence
          </h1>

          <p>
            ERGONOVA AI · Live employee productivity analytics
          </p>

        </div>


        <div className="live-indicator">

          <span></span>

          {chairStatus === "OCCUPIED"
            ? "LIVE SENSOR DATA"
            : "WAITING FOR PRESENCE"}

        </div>

      </div>


      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="productivity-summary">


        <SummaryCard

          title="Productivity Score"

          value={
            `${currentProductivity}%`
          }

        />


        <SummaryCard

          title="Posture Score"

          value={
            `${currentPostureScore}%`
          }

        />


        <SummaryCard

          title="Chair Score"

          value={
            currentChairScore
          }

        />


        <SummaryCard

          title="Chair Status"

          value={
            chairStatus
          }

        />


        <SummaryCard

          title="Heart Rate"

          value={
            currentHeartRate !== null

              ? `${currentHeartRate} BPM`

              : "N/A"
          }

        />

      </div>


      {/* ======================================================
          GRAPH GRID
      ====================================================== */}

      <div className="graph-grid">


        {/* ====================================================
            POSTURE
        ==================================================== */}

        <GraphBox
          title="Posture Score vs Time"
        >

          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <LineChart
              data={trendData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />


              <XAxis
                dataKey="time"
              />


              <YAxis
                domain={[0, 100]}
              />


              <Tooltip />


              <Legend />


              <Line

                type="monotone"

                dataKey="posture"

                name="Posture Score"

                stroke="#00b8d9"

                strokeWidth={3}

                dot={false}

                connectNulls

              />

            </LineChart>

          </ResponsiveContainer>

        </GraphBox>


        {/* ====================================================
            PRODUCTIVITY
        ==================================================== */}

        <GraphBox
          title="Productivity Trend"
        >

          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <BarChart
              data={trendData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />


              <XAxis
                dataKey="time"
              />


              <YAxis
                domain={[0, 100]}
              />


              <Tooltip />


              <Legend />


              <Bar

                dataKey="productivity"

                name="Productivity"

                fill="#0b3558"

              />

            </BarChart>

          </ResponsiveContainer>

        </GraphBox>


        {/* ====================================================
            HEART RATE
        ==================================================== */}

        <GraphBox
          title="Heart Rate vs Time"
        >

          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <LineChart
              data={trendData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />


              <XAxis
                dataKey="time"
              />


              <YAxis
                domain={[40, 140]}
              />


              <Tooltip />


              <Legend />


              <Line

                type="monotone"

                dataKey="heart"

                name="Heart Rate"

                stroke="orange"

                strokeWidth={3}

                dot={false}

                connectNulls={false}

              />

            </LineChart>

          </ResponsiveContainer>


          <p className="sensor-note">

            Heart rate sensor not currently installed.

          </p>

        </GraphBox>


        {/* ====================================================
            PRESSURE
        ==================================================== */}

        <GraphBox
          title="Pressure Distribution"
        >

          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <PieChart>

              <Pie

                data={pressureData}

                dataKey="value"

                nameKey="name"

                outerRadius={85}

                label

              >

                <Cell />

                <Cell />

              </Pie>


              <Tooltip />


              <Legend />

            </PieChart>

          </ResponsiveContainer>


          <div className="pressure-summary">

            <p>

              Left Pressure:

              {" "}

              <strong>
                {currentLeftPressure}
              </strong>

            </p>


            <p>

              Right Pressure:

              {" "}

              <strong>
                {currentRightPressure}
              </strong>

            </p>

          </div>

        </GraphBox>


        {/* ====================================================
            TEMPERATURE
        ==================================================== */}

        <GraphBox
          title="Temperature Trend"
        >

          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <LineChart
              data={trendData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />


              <XAxis
                dataKey="time"
              />


              <YAxis
                domain={[0, 50]}
              />


              <Tooltip />


              <Legend />


              <Line

                type="monotone"

                dataKey="temp"

                name="Temperature"

                stroke="red"

                strokeWidth={3}

                dot={false}

                connectNulls={false}

              />

            </LineChart>

          </ResponsiveContainer>


          <p className="sensor-note">

            Temperature sensor not currently installed.

          </p>

        </GraphBox>


      </div>


      {/* ======================================================
          SENSOR STATUS
      ====================================================== */}

      <section className="productivity-sensor-status">


        <h3>
          Live Sensor Analysis
        </h3>


        <div className="sensor-status-grid">


          <SensorValue

            label="MPU Score"

            value={
              currentMPUScore
            }

          />


          <SensorValue

            label="Flex Score"

            value={
              currentFlexScore
            }

          />


          <SensorValue

            label="FSR Score"

            value={
              currentFSRScore
            }

          />


          <SensorValue

            label="Chair Score"

            value={
              currentChairScore
            }

          />


        </div>


        <p className="last-update">

          {lastUpdate

            ? `Last sensor update: ${lastUpdate.toLocaleTimeString()}`

            : "Waiting for sensor data..."}

        </p>


      </section>


    </div>

  )

}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value
}) {

  return (

    <section
      className="productivity-summary-card"
    >

      <span>
        {title}
      </span>


      <strong>
        {value}
      </strong>

    </section>

  )

}


// ============================================================
// GRAPH BOX
// ============================================================

function GraphBox({
  title,
  children
}) {

  return (

    <section
      className="box productivity-graph-box"
    >

      <h3>
        {title}
      </h3>


      {children}

    </section>

  )

}


// ============================================================
// SENSOR VALUE
// ============================================================

function SensorValue({
  label,
  value
}) {

  return (

    <div
      className="sensor-status-item"
    >

      <span>
        {label}
      </span>


      <strong>
        {value}
      </strong>

    </div>

  )

}


export default Productivity
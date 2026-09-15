import {
    useEffect,
    useState,
    useContext
} from "react"

import {
    useNavigate
} from "react-router-dom"

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import {
    getEmployees,
    getChairs,
    getEmployeeDashboard,
    addEmployee
} from "../services/api"

import {
    UserContext
} from "../context/UserContext"


function HRDashboard() {

    const [employees, setEmployees] = useState([])
    const [chairs, setChairs] = useState([])
    const [employeeId, setEmployeeId] = useState("")
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    const [newEmployee, setNewEmployee] = useState({
        name: "",
        department: "",
        chairId: ""
    })

    const {
        setUser
    } = useContext(UserContext)

    const navigate = useNavigate()


    // ============================================================
    // LOAD DATA
    // ============================================================

    useEffect(() => {

        loadData()

        const timer = setInterval(() => {
            loadData()
        }, 5000)

        return () => clearInterval(timer)

    }, [])


    // ============================================================
    // LOAD HR DATA
    // ============================================================

    async function loadData() {

        try {

            const employeeResponse =
                await getEmployees()

            const chairResponse =
                await getChairs()


            const employeeList =
                Array.isArray(employeeResponse)
                    ? employeeResponse
                    : employeeResponse?.data || []


            const chairList =
                Array.isArray(chairResponse)
                    ? chairResponse
                    : chairResponse?.data || []


            console.log(
                "HR EMPLOYEES:",
                employeeList
            )


            console.log(
                "HR CHAIRS:",
                chairList
            )


            // ====================================================
            // GET DAILY DASHBOARD FOR EACH EMPLOYEE
            // ====================================================

            const results =
                await Promise.all(

                    employeeList.map(
                        async (employee) => {

                            try {

                                const dashboard =
                                    await getEmployeeDashboard(
                                        employee.employee_id
                                    )


                                console.log(
                                    "HR DASHBOARD:",
                                    employee.employee_id,
                                    dashboard
                                )


                                return {

                                    employee,

                                    dashboard

                                }

                            }
                            catch (error) {

                                console.error(
                                    "Dashboard error:",
                                    employee.employee_id,
                                    error
                                )


                                return {

                                    employee,

                                    dashboard: null

                                }

                            }

                        }
                    )

                )


            // ====================================================
            // CONVERT API DATA TO HR DATA
            // ====================================================

            const finalEmployees =
                results.map(
                    ({
                        employee,
                        dashboard
                    }) => {

                        const report =
                            dashboard?.report || {}


                        return {

                            ...employee,


                            // ------------------------------------
                            // CHAIR
                            // ------------------------------------

                            chair_id:
                                dashboard?.chair ||
                                employee.assigned_chair_id ||
                                "Not Assigned",


                            // ------------------------------------
                            // POSTURE
                            // ------------------------------------

                            current_posture_score:
                                Number(
                                    report.average_posture_score || 0
                                ),


                            // ------------------------------------
                            // PRODUCTIVITY
                            // ------------------------------------

                            productivity_score:
                                Number(
                                    report.average_productivity_score || 0
                                ),


                            // ------------------------------------
                            // CHAIR SCORE
                            // ------------------------------------

                            chairScore:
                                Number(
                                    report.average_chair_score || 0
                                ),


                            // ------------------------------------
                            // POSTURE COUNTS
                            // ------------------------------------

                            good_readings:
                                Number(
                                    report.good_readings || 0
                                ),


                            moderate_readings:
                                Number(
                                    report.moderate_readings || 0
                                ),


                            bad_readings:
                                Number(
                                    report.bad_readings || 0
                                ),


                            total_readings:
                                Number(
                                    report.total_readings || 0
                                ),


                            // ------------------------------------
                            // DAILY REPORT
                            // ------------------------------------

                            daily_report:
                                report

                        }

                    }
                )


            console.log(
                "FINAL HR DATA:",
                finalEmployees
            )


            setEmployees(
                finalEmployees
            )


            setChairs(
                chairList
            )

        }
        catch (error) {

            console.error(
                "HR LOAD ERROR:",
                error
            )

        }
        finally {

            setLoading(false)

        }

    }


    // ============================================================
    // ADD EMPLOYEE
    // ============================================================

    const openAddEmployeeModal = () => {

        setNewEmployee({
            name: "",
            department: "",
            chairId: ""
        })

        setShowModal(true)

    }


    const handleNewEmployeeChange = (e) => {

        setNewEmployee({

            ...newEmployee,

            [e.target.name]:
                e.target.value

        })

    }


    const handleAddEmployee = async () => {

        try {

            if (
                !newEmployee.name ||
                !newEmployee.department ||
                !newEmployee.chairId
            ) {

                alert(
                    "Enter all details"
                )

                return

            }


            const response =
                await addEmployee({

                    name:
                        newEmployee.name,

                    department:
                        newEmployee.department,

                    chairId:
                        newEmployee.chairId

                })


            alert(
                response.message ||
                "Employee Added"
            )


            setShowModal(false)

            loadData()

        }
        catch (error) {

            alert(
                error.message
            )

        }

    }


    // ============================================================
    // HELPERS
    // ============================================================

    const getEmployeeName = (emp) => {

        return (

            emp.name ||
            emp.employee_name ||
            "Employee"

        )

    }


    const getChairId = (emp) => {

        return (

            emp.chair_id ||
            emp.assigned_chair_id ||
            "Not Assigned"

        )

    }


    const getPostureScore = (emp) => {

        return Number(
            emp.current_posture_score || 0
        )

    }


    const getProductivity = (emp) => {

        return Number(
            emp.productivity_score || 0
        )

    }


    // ============================================================
    // POSTURE STATUS
    // ============================================================

    const getPostureStatus = (emp) => {

        const good =
            Number(
                emp.good_readings || 0
            )

        const moderate =
            Number(
                emp.moderate_readings || 0
            )

        const bad =
            Number(
                emp.bad_readings || 0
            )


        if (
            good === 0 &&
            moderate === 0 &&
            bad === 0
        ) {

            return "No Data"

        }


        if (
            bad > good &&
            bad > moderate
        ) {

            return "Bad"

        }


        if (
            moderate > good
        ) {

            return "Moderate"

        }


        return "Good"

    }


    // ============================================================
    // STATE
    // ============================================================

    const getMostRepeatedState = () => {

        return "Monitoring"

    }


    // ============================================================
    // ANALYTICS
    // ============================================================

    const goodPosture =
        employees.filter(
            emp =>
                getPostureStatus(emp)
                    === "Good"
        ).length


    const attentionRequired =
        employees.filter(
            emp => {

                const status =
                    getPostureStatus(emp)

                return (
                    status === "Moderate" ||
                    status === "Bad"
                )

            }
        ).length


    const postureScores =
        employees
            .map(
                emp =>
                    getPostureScore(emp)
            )
            .filter(
                score =>
                    score > 0
            )


    const averagePostureScore =
        postureScores.length > 0

            ?

            Math.round(

                postureScores.reduce(
                    (sum, score) =>
                        sum + score,
                    0
                )
                /
                postureScores.length

            )

            :

            0


    const activeChairs =
        employees.filter(
            emp =>
                getChairId(emp)
                !== "Not Assigned"
        ).length


    const ergonomicRisk =

        averagePostureScore >= 80

            ?

            "LOW RISK"

            :

            averagePostureScore >= 60

                ?

                "MODERATE"

                :

                "HIGH RISK"


    // ============================================================
    // WELL-BEING CHART
    // ============================================================

    const totalGood =
        employees.reduce(
            (sum, emp) =>
                sum +
                Number(
                    emp.good_readings || 0
                ),
            0
        )


    const totalModerate =
        employees.reduce(
            (sum, emp) =>
                sum +
                Number(
                    emp.moderate_readings || 0
                ),
            0
        )


    const totalBad =
        employees.reduce(
            (sum, emp) =>
                sum +
                Number(
                    emp.bad_readings || 0
                ),
            0
        )


    const stateData = [

        {
            name: "Good",
            value: totalGood
        },

        {
            name: "Moderate",
            value: totalModerate
        },

        {
            name: "Bad",
            value: totalBad
        }

    ]


    const COLORS = [

        "#31e981",
        "#ffc857",
        "#ff5964"

    ]


    // ============================================================
    // NAVIGATION
    // ============================================================

    const openEmployeeDashboard = () => {

        const employee =
            employees.find(
                emp =>
                    String(
                        emp.employee_id
                    )
                        .trim()
                        .toUpperCase()
                    ===
                    employeeId
                        .trim()
                        .toUpperCase()
            )


        if (!employee) {

            alert(
                "Employee not found"
            )

            return

        }


        setUser(employee)

        navigate("/dashboard")

    }


    const viewEmployee = (employee) => {

        setUser(employee)

        navigate("/dashboard")

    }


    const handleLogout = () => {

        setUser(null)

        navigate("/")

    }


    // ============================================================
    // DAILY REPORT
    // ============================================================

    const generateDailyReport = () => {

        const doc =
            new jsPDF()


        doc.setFontSize(18)


        doc.text(
            "ERGONOVA AI - Daily Employee Monitoring Report",
            14,
            20
        )


        autoTable(
            doc,
            {

                startY: 40,

                head: [[

                    "Employee ID",
                    "Name",
                    "Chair",
                    "Posture",
                    "Productivity"

                ]],

                body:

                    employees.map(
                        emp => [

                            emp.employee_id ||
                            "-",

                            getEmployeeName(
                                emp
                            ),

                            getChairId(
                                emp
                            ),

                            `${getPostureScore(emp)}%`,

                            `${getProductivity(emp)}%`

                        ]
                    )

            }
        )


        doc.save(
            "ERGONOVA_Daily_Report.pdf"
        )

    }


    // ============================================================
    // MONTHLY REPORT
    // ============================================================

    const generateOverallMonthlyReport = () => {

        const doc =
            new jsPDF()


        doc.setFontSize(18)


        doc.text(
            "ERGONOVA AI - Monthly Productivity Report",
            14,
            20
        )


        autoTable(
            doc,
            {

                startY: 40,

                head: [[

                    "Employee ID",
                    "Name",
                    "Chair",
                    "Posture",
                    "Productivity"

                ]],

                body:

                    employees.map(
                        emp => [

                            emp.employee_id ||
                            "-",

                            getEmployeeName(
                                emp
                            ),

                            getChairId(
                                emp
                            ),

                            `${getPostureScore(emp)}%`,

                            `${getProductivity(emp)}%`

                        ]
                    )

            }
        )


        doc.save(
            "ERGONOVA_Monthly_Report.pdf"
        )

    }


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <div className="hr-loading-screen">

                <h2>
                    ERGONOVA AI
                </h2>

                <p>
                    Loading HR Intelligence...
                </p>

            </div>

        )

    }


    // ============================================================
    // MAIN
    // ============================================================

    return (

        <div className="hr-dashboard">


            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <header className="hr-header">

                <div className="hr-brand">

                    <div className="hr-brand-icon">
                        E
                    </div>

                    <div>

                        <h1>
                            ERGONOVA AI
                        </h1>

                        <p>
                            HR INTELLIGENCE
                        </p>

                    </div>

                </div>


                <div className="hr-header-right">

                    <div className="hr-live-status">

                        <span></span>

                        LIVE SYSTEM

                    </div>


                    <button
                        className="hr-logout"
                        onClick={
                            handleLogout
                        }
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* ================================================= */}
            {/* HERO */}
            {/* ================================================= */}

            <section className="hr-hero">

                <div>

                    <h2>
                        Workforce Intelligence
                    </h2>

                    <p>
                        Real-time employee well-being and ergonomic insights
                    </p>

                </div>

            </section>


            {/* ================================================= */}
            {/* SUMMARY */}
            {/* ================================================= */}

            <section className="hr-summary">

                <HRMetric
                    icon="👥"
                    title="Total Employees"
                    value={
                        employees.length
                    }
                />


                <HRMetric
                    icon="🪑"
                    title="Active Chairs"
                    value={
                        activeChairs
                    }
                />


                <HRMetric
                    icon="✓"
                    title="Good Posture"
                    value={
                        goodPosture
                    }
                    type="good"
                />


                <HRMetric
                    icon="⚠"
                    title="Needs Attention"
                    value={
                        attentionRequired
                    }
                    type="warning"
                />

            </section>


            {/* ================================================= */}
            {/* ANALYTICS */}
            {/* ================================================= */}

            <section className="hr-analytics-grid">


                <div className="hr-panel">

                    <div className="hr-panel-header">

                        <h3>
                            Employee Well-being
                        </h3>

                        <p>
                            Today's posture readings
                        </p>

                    </div>


                    <div className="hr-chart-area">

                        <ResponsiveContainer
                            width="100%"
                            height={330}
                        >

                            <PieChart>

                                <Pie
                                    data={
                                        stateData
                                    }
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={115}
                                >

                                    {
                                        stateData.map(
                                            (
                                                entry,
                                                index
                                            ) => (

                                                <Cell
                                                    key={
                                                        entry.name
                                                    }
                                                    fill={
                                                        COLORS[
                                                            index
                                                        ]
                                                    }
                                                />

                                            )
                                        )
                                    }

                                </Pie>

                                <Tooltip />

                            </PieChart>

                        </ResponsiveContainer>

                    </div>

                </div>


                {/* ================================================= */}
                {/* ERGONOMIC HEALTH */}
                {/* ================================================= */}

                <div className="hr-panel posture-panel">

                    <div className="hr-panel-header">

                        <h3>
                            Ergonomic Health
                        </h3>

                        <p>
                            Today's posture performance
                        </p>

                    </div>


                    <div className="posture-details">


                        <div className="health-box">

                            <div className="health-icon good-icon">
                                ✓
                            </div>

                            <div>

                                <p>
                                    Good Posture
                                </p>

                                <h2>
                                    {goodPosture}
                                </h2>

                                <span>
                                    Employees with healthy posture
                                </span>

                            </div>

                        </div>


                        <div className="health-box">

                            <div className="health-icon warning-icon">
                                ⚠
                            </div>

                            <div>

                                <p>
                                    Needs Attention
                                </p>

                                <h2>
                                    {attentionRequired}
                                </h2>

                                <span>
                                    Employees requiring correction
                                </span>

                            </div>

                        </div>


                        <div className="health-box">

                            <div className="health-icon score-icon">
                                ★
                            </div>

                            <div>

                                <p>
                                    Average Score
                                </p>

                                <h2>
                                    {averagePostureScore}%
                                </h2>

                                <span>
                                    Overall ergonomic rating
                                </span>

                            </div>

                        </div>


                        <div className="risk-card">

                            <p>
                                Ergonomic Risk
                            </p>

                            <h2>
                                {ergonomicRisk}
                            </h2>

                        </div>

                    </div>

                </div>

            </section>


            {/* ================================================= */}
            {/* EMPLOYEE ACTIONS */}
            {/* ================================================= */}

            <section className="hr-panel employee-actions">

                <div className="hr-panel-header">

                    <h3>
                        Employee Actions
                    </h3>

                    <p>
                        Manage employees and reports
                    </p>

                </div>


                <div className="hr-action-row">


                    <button
                        className="hr-primary-btn"
                        onClick={
                            openAddEmployeeModal
                        }
                    >
                        + Add Employee
                    </button>


                    <input
                        type="text"
                        placeholder="Enter Employee ID"
                        value={
                            employeeId
                        }
                        onChange={
                            e =>
                                setEmployeeId(
                                    e.target.value
                                )
                        }
                    />


                    <button
                        className="hr-action-btn"
                        onClick={
                            openEmployeeDashboard
                        }
                    >
                        View Dashboard
                    </button>


                    <button
                        className="hr-action-btn"
                        onClick={
                            generateDailyReport
                        }
                    >
                        Daily Report
                    </button>


                    <button
                        className="hr-action-btn"
                        onClick={
                            generateOverallMonthlyReport
                        }
                    >
                        Monthly Report
                    </button>

                </div>

            </section>


            {/* ================================================= */}
            {/* EMPLOYEE TABLE */}
            {/* ================================================= */}

            <section className="hr-panel employee-monitoring">

                <div className="hr-panel-header">

                    <h3>
                        Employee Monitoring
                    </h3>

                    <p>
                        Daily ergonomic performance
                    </p>

                </div>


                <div className="employee-table-wrapper">

                    <table className="hr-employee-table">

                        <thead>

                            <tr>

                                <th>
                                    Employee
                                </th>

                                <th>
                                    ID
                                </th>

                                <th>
                                    Chair
                                </th>

                                <th>
                                    Posture
                                </th>

                                <th>
                                    Productivity
                                </th>

                                <th>
                                    Good
                                </th>

                                <th>
                                    Moderate
                                </th>

                                <th>
                                    Bad
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {

                                employees.map(
                                    emp => (

                                        <tr
                                            key={
                                                emp.employee_id
                                            }
                                        >

                                            <td>

                                                <div className="employee-name">

                                                    <div className="employee-mini-avatar">

                                                        {
                                                            getEmployeeName(
                                                                emp
                                                            )
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()
                                                        }

                                                    </div>


                                                    <strong>

                                                        {
                                                            getEmployeeName(
                                                                emp
                                                            )
                                                        }

                                                    </strong>

                                                </div>

                                            </td>


                                            <td>
                                                {
                                                    emp.employee_id
                                                }
                                            </td>


                                            <td>
                                                {
                                                    getChairId(
                                                        emp
                                                    )
                                                }
                                            </td>


                                            <td>

                                                <strong>

                                                    {
                                                        getPostureScore(
                                                            emp
                                                        )
                                                    }%

                                                </strong>

                                                <br />

                                                <small>

                                                    {
                                                        getPostureStatus(
                                                            emp
                                                        )
                                                    }

                                                </small>

                                            </td>


                                            <td>

                                                {
                                                    getProductivity(
                                                        emp
                                                    )
                                                }%

                                            </td>


                                            <td>
                                                {
                                                    emp.good_readings
                                                }
                                            </td>


                                            <td>
                                                {
                                                    emp.moderate_readings
                                                }
                                            </td>


                                            <td>
                                                {
                                                    emp.bad_readings
                                                }
                                            </td>


                                            <td>

                                                <button
                                                    className="table-view-btn"
                                                    onClick={
                                                        () =>
                                                            viewEmployee(
                                                                emp
                                                            )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )

                            }

                        </tbody>

                    </table>

                </div>

            </section>


            {/* ================================================= */}
            {/* ADD EMPLOYEE MODAL */}
            {/* ================================================= */}

            {

                showModal && (

                    <div className="hr-modal-overlay">

                        <div className="hr-modal">

                            <h3>
                                Add New Employee
                            </h3>


                            <input
                                name="name"
                                placeholder="Employee Name"
                                value={
                                    newEmployee.name
                                }
                                onChange={
                                    handleNewEmployeeChange
                                }
                            />


                            <input
                                name="department"
                                placeholder="Department"
                                value={
                                    newEmployee.department
                                }
                                onChange={
                                    handleNewEmployeeChange
                                }
                            />


                            <input
                                name="chairId"
                                placeholder="Chair ID"
                                value={
                                    newEmployee.chairId
                                }
                                onChange={
                                    handleNewEmployeeChange
                                }
                            />


                            <div className="modal-actions">

                                <button
                                    className="cancel-btn"
                                    onClick={
                                        () =>
                                            setShowModal(
                                                false
                                            )
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    className="hr-primary-btn"
                                    onClick={
                                        handleAddEmployee
                                    }
                                >
                                    Save Employee
                                </button>

                            </div>

                        </div>

                    </div>

                )

            }

        </div>

    )

}


// ============================================================
// HR METRIC
// ============================================================

function HRMetric({
    icon,
    title,
    value,
    type = ""
}) {

    return (

        <div
            className={
                `hr-metric-card ${type}`
            }
        >

            <div className="metric-icon">
                {icon}
            </div>

            <div>

                <p>
                    {title}
                </p>

                <h2>
                    {value}
                </h2>

            </div>

        </div>

    )

}


export default HRDashboard
"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";

type LoginResponse = {
  accessToken: string;
  user: {
    email: string;
    roles: string[];
    permissions: string[];
  };
};

type DashboardSummary = {
  assignmentDate: string;
  totalRoutes: number;
  assignedRoutes: number;
  unassignedRoutes: number;
  pendingStops: number;
  completedStops: number;
  lateRoutes: number;
  manualOverrides: number;
  issueReportedStops: number;
};

type Branch = {
  id: string;
  code: string;
  name: string;
};

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  branch: Branch;
};

type Vehicle = {
  id: string;
  vehicleNumber: string;
  plateNumber?: string | null;
  branch: Branch;
};

type Stop = {
  id: string;
  clientStopId: string;
  name: string;
  category: "pressure_washing" | "shelter" | "standalone";
  serviceFrequency: "7_day" | "5_day" | "biweekly";
};

type Route = {
  id: string;
  code: string;
  name: string;
  stopCount: number;
  branch: Branch;
};

type AssignmentBoard = {
  assignmentDate: string;
  routes: Array<{
    id: string;
    routeCode: string;
    routeName: string;
    employeeName: string;
    vehicleNumber: string;
    pendingStops: number;
    completedStops: number;
    status: string;
  }>;
};

type FormState = {
  busy: boolean;
  message: string | null;
  error: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "lgc_access_token";

async function apiFetch<T>(path: string, token: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function apiMutate<T>(path: string, token: string, body: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function emptyFormState(): FormState {
  return {
    busy: false,
    message: null,
    error: null
  };
}

export function AppShell() {
  const [email, setEmail] = useState("admin@lgc.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<LoginResponse["user"] | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [assignments, setAssignments] = useState<AssignmentBoard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [branchCode, setBranchCode] = useState("DAL");
  const [branchName, setBranchName] = useState("Dallas Operations");
  const [employeeBranchId, setEmployeeBranchId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("FIELD-201");
  const [employeeFirstName, setEmployeeFirstName] = useState("Taylor");
  const [employeeLastName, setEmployeeLastName] = useState("Brooks");
  const [employeePhone, setEmployeePhone] = useState("214-555-0147");
  const [vehicleBranchId, setVehicleBranchId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("Truck-21");
  const [vehiclePlate, setVehiclePlate] = useState("LGC-210");
  const [stopClientStopId, setStopClientStopId] = useState("METRO-2100");
  const [stopName, setStopName] = useState("Smith St & Walker");
  const [stopLatitude, setStopLatitude] = useState("29.7557");
  const [stopLongitude, setStopLongitude] = useState("-95.3658");
  const [stopCategory, setStopCategory] = useState<Stop["category"]>("shelter");
  const [stopServiceFrequency, setStopServiceFrequency] = useState<Stop["serviceFrequency"]>("7_day");
  const [routeBranchId, setRouteBranchId] = useState("");
  const [routeCode, setRouteCode] = useState("R-24");
  const [routeName, setRouteName] = useState("Midtown Sweep");
  const [selectedStopIds, setSelectedStopIds] = useState<string[]>([]);
  const [assignmentRouteId, setAssignmentRouteId] = useState("");
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState("");
  const [assignmentVehicleId, setAssignmentVehicleId] = useState("");
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().slice(0, 10));

  const [branchFormState, setBranchFormState] = useState<FormState>(emptyFormState);
  const [employeeFormState, setEmployeeFormState] = useState<FormState>(emptyFormState);
  const [vehicleFormState, setVehicleFormState] = useState<FormState>(emptyFormState);
  const [stopFormState, setStopFormState] = useState<FormState>(emptyFormState);
  const [routeFormState, setRouteFormState] = useState<FormState>(emptyFormState);
  const [assignmentFormState, setAssignmentFormState] = useState<FormState>(emptyFormState);

  const refreshData = async (activeToken: string) => {
    const [
      user,
      dashboardSummary,
      branchList,
      employeeList,
      vehicleList,
      stopList,
      routeList,
      assignmentBoard
    ] = await Promise.all([
      apiFetch<LoginResponse["user"]>("/auth/me", activeToken),
      apiFetch<DashboardSummary>("/dashboard/manager/today", activeToken),
      apiFetch<Branch[]>("/branches", activeToken),
      apiFetch<Employee[]>("/employees", activeToken),
      apiFetch<Vehicle[]>("/vehicles", activeToken),
      apiFetch<Stop[]>("/stops", activeToken),
      apiFetch<Route[]>("/routes", activeToken),
      apiFetch<AssignmentBoard>("/assignments/today", activeToken)
    ]);

    setAuthUser(user);
    setDashboard(dashboardSummary);
    setBranches(branchList);
    setEmployees(employeeList);
    setVehicles(vehicleList);
    setStops(stopList);
    setRoutes(routeList);
    setAssignments(assignmentBoard);
    setLoadError(null);
  };

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setAuthUser(null);
      setDashboard(null);
      setAssignments(null);
      return;
    }

    startTransition(() => {
      void refreshData(token).catch(() => {
        setLoadError("Could not load the operations dashboard.");
        setToken(null);
        window.localStorage.removeItem(TOKEN_KEY);
      });
    });
  }, [token]);

  useEffect(() => {
    const fallbackBranchId = branches[0]?.id ?? "";
    if (!employeeBranchId) {
      setEmployeeBranchId(fallbackBranchId);
    }
    if (!vehicleBranchId) {
      setVehicleBranchId(fallbackBranchId);
    }
    if (!routeBranchId) {
      setRouteBranchId(fallbackBranchId);
    }
  }, [branches, employeeBranchId, routeBranchId, vehicleBranchId]);

  useEffect(() => {
    if (!assignmentRouteId) {
      setAssignmentRouteId(routes[0]?.id ?? "");
    }
  }, [routes, assignmentRouteId]);

  useEffect(() => {
    if (!assignmentEmployeeId) {
      setAssignmentEmployeeId(employees[0]?.id ?? "");
    }
  }, [employees, assignmentEmployeeId]);

  useEffect(() => {
    if (!assignmentVehicleId) {
      setAssignmentVehicleId(vehicles[0]?.id ?? "");
    }
  }, [vehicles, assignmentVehicleId]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        throw new Error("Invalid email or password.");
      }

      const payload = (await response.json()) as LoginResponse;
      setToken(payload.accessToken);
      setAuthUser(payload.user);
      window.localStorage.setItem(TOKEN_KEY, payload.accessToken);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthUser(null);
  }

  async function withSubmission(
    setState: (state: FormState) => void,
    successMessage: string,
    task: () => Promise<void>
  ) {
    setState({
      busy: true,
      error: null,
      message: null
    });

    try {
      await task();
      setState({
        busy: false,
        error: null,
        message: successMessage
      });
    } catch (error) {
      setState({
        busy: false,
        message: null,
        error: error instanceof Error ? error.message : "Request failed."
      });
    }
  }

  async function handleCreateBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    await withSubmission(setBranchFormState, "Branch created.", async () => {
      await apiMutate("/branches", token, {
        code: branchCode,
        name: branchName
      });
      await refreshData(token);
      setBranchCode("");
      setBranchName("");
    });
  }

  async function handleCreateEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !employeeBranchId) {
      return;
    }

    await withSubmission(setEmployeeFormState, "Employee created.", async () => {
      await apiMutate("/employees", token, {
        branchId: employeeBranchId,
        employeeCode,
        firstName: employeeFirstName,
        lastName: employeeLastName,
        phoneNumber: employeePhone
      });
      await refreshData(token);
      setEmployeeCode("");
      setEmployeeFirstName("");
      setEmployeeLastName("");
      setEmployeePhone("");
    });
  }

  async function handleCreateVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !vehicleBranchId) {
      return;
    }

    await withSubmission(setVehicleFormState, "Vehicle created.", async () => {
      await apiMutate("/vehicles", token, {
        branchId: vehicleBranchId,
        vehicleNumber,
        plateNumber: vehiclePlate
      });
      await refreshData(token);
      setVehicleNumber("");
      setVehiclePlate("");
    });
  }

  async function handleCreateStop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    await withSubmission(setStopFormState, "Stop created.", async () => {
      await apiMutate("/stops", token, {
        clientStopId: stopClientStopId,
        name: stopName,
        latitude: Number(stopLatitude),
        longitude: Number(stopLongitude),
        category: stopCategory,
        serviceFrequency: stopServiceFrequency,
        isActive: true
      });
      await refreshData(token);
      setSelectedStopIds([]);
      setStopClientStopId("");
      setStopName("");
      setStopLatitude("");
      setStopLongitude("");
    });
  }

  async function handleCreateRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !routeBranchId) {
      return;
    }

    await withSubmission(setRouteFormState, "Route created.", async () => {
      await apiMutate("/routes", token, {
        branchId: routeBranchId,
        code: routeCode,
        name: routeName,
        stopIds: selectedStopIds
      });
      await refreshData(token);
      setRouteCode("");
      setRouteName("");
      setSelectedStopIds([]);
    });
  }

  async function handleCreateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !assignmentRouteId || !assignmentEmployeeId || !assignmentVehicleId) {
      return;
    }

    await withSubmission(setAssignmentFormState, "Assignment created.", async () => {
      await apiMutate("/assignments", token, {
        routeId: assignmentRouteId,
        employeeId: assignmentEmployeeId,
        vehicleId: assignmentVehicleId,
        assignmentDate: `${assignmentDate}T00:00:00.000Z`
      });
      await refreshData(token);
    });
  }

  function toggleStopSelection(stopId: string) {
    setSelectedStopIds((current) =>
      current.includes(stopId) ? current.filter((id) => id !== stopId) : [...current, stopId]
    );
  }

  const summaryCards = useMemo(
    () =>
      dashboard
        ? [
            { label: "Routes Today", value: dashboard.totalRoutes },
            { label: "Completed Stops", value: dashboard.completedStops },
            { label: "Pending Stops", value: dashboard.pendingStops },
            { label: "Manual Overrides", value: dashboard.manualOverrides }
          ]
        : [],
    [dashboard]
  );

  const routeOptions = routes.map((route) => ({
    value: route.id,
    label: `${route.code} · ${route.name}`
  }));
  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: `${employee.employeeCode} · ${employee.fullName}`
  }));
  const vehicleOptions = vehicles.map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.vehicleNumber} · ${vehicle.branch.code}`
  }));

  if (!token) {
    return (
      <main className="shell app-shell min-h-screen">
        <section className="login-stage">
          <div className="login-copy">
            <p className="eyebrow">Operations Login</p>
            <h1>Sign in to the fleet command center.</h1>
            <p className="lede">
              This first browser flow talks to the real Nest API and seeded database. After login, the page
              loads live branches, employees, vehicles, routes, assignments, and today&apos;s dashboard summary.
            </p>
          </div>

          <form className="login-card" onSubmit={handleLogin}>
            <label className="field">
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
              />
            </label>

            {loginError ? <p className="error-copy">{loginError}</p> : null}

            <button
              className="action-button transition-transform duration-150 hover:-translate-y-0.5"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell app-shell min-h-screen">
      <section className="topbar">
        <div>
          <p className="eyebrow">Authenticated Session</p>
          <h1>Fleet operations dashboard</h1>
          <p className="lede">
            Signed in as {authUser?.email}. This screen is now both a live dashboard and a manager workspace
            for creating the core operational records.
          </p>
          {loadError ? <p className="error-copy">{loadError}</p> : null}
        </div>

        <button
          className="ghost-button transition-colors duration-150 hover:bg-slate-900/10"
          onClick={handleLogout}
          type="button"
        >
          Log Out
        </button>
      </section>

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <article className="summary-card" key={card.label}>
            <p className="card-kicker">{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="management-grid">
        <article className="card control-card">
          <div className="section-header">
            <div>
              <p className="card-kicker">Branches</p>
              <h2>Branch control</h2>
            </div>
            <span className="section-count">{branches.length}</span>
          </div>

          <form className="stack-form" onSubmit={handleCreateBranch}>
            <div className="inline-fields">
              <label className="field">
                <span>Code</span>
                <input value={branchCode} onChange={(event) => setBranchCode(event.target.value)} />
              </label>
              <label className="field">
                <span>Name</span>
                <input value={branchName} onChange={(event) => setBranchName(event.target.value)} />
              </label>
            </div>
            <button
              className="action-button transition-transform duration-150 hover:-translate-y-0.5"
              disabled={branchFormState.busy}
              type="submit"
            >
              {branchFormState.busy ? "Saving..." : "Create Branch"}
            </button>
            {branchFormState.message ? <p className="success-copy">{branchFormState.message}</p> : null}
            {branchFormState.error ? <p className="error-copy">{branchFormState.error}</p> : null}
          </form>

          <ul className="data-list">
            {branches.map((branch) => (
              <li key={branch.id}>
                <strong>{branch.code}</strong>
                <span>{branch.name}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card control-card">
          <div className="section-header">
            <div>
              <p className="card-kicker">Employees</p>
              <h2>Field staff</h2>
            </div>
            <span className="section-count">{employees.length}</span>
          </div>

          <form className="stack-form" onSubmit={handleCreateEmployee}>
            <div className="inline-fields">
              <label className="field">
                <span>Branch</span>
                <select value={employeeBranchId} onChange={(event) => setEmployeeBranchId(event.target.value)}>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Employee code</span>
                <input value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} />
              </label>
            </div>
            <div className="inline-fields">
              <label className="field">
                <span>First name</span>
                <input
                  value={employeeFirstName}
                  onChange={(event) => setEmployeeFirstName(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Last name</span>
                <input value={employeeLastName} onChange={(event) => setEmployeeLastName(event.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>Phone</span>
              <input value={employeePhone} onChange={(event) => setEmployeePhone(event.target.value)} />
            </label>
            <button
              className="action-button transition-transform duration-150 hover:-translate-y-0.5"
              disabled={employeeFormState.busy}
              type="submit"
            >
              {employeeFormState.busy ? "Saving..." : "Create Employee"}
            </button>
            {employeeFormState.message ? <p className="success-copy">{employeeFormState.message}</p> : null}
            {employeeFormState.error ? <p className="error-copy">{employeeFormState.error}</p> : null}
          </form>

          <ul className="data-list">
            {employees.map((employee) => (
              <li key={employee.id}>
                <div>
                  <strong>{employee.employeeCode}</strong>
                  <span>{employee.fullName}</span>
                </div>
                <span>{employee.branch.code}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card control-card">
          <div className="section-header">
            <div>
              <p className="card-kicker">Vehicles</p>
              <h2>Fleet assets</h2>
            </div>
            <span className="section-count">{vehicles.length}</span>
          </div>

          <form className="stack-form" onSubmit={handleCreateVehicle}>
            <div className="inline-fields">
              <label className="field">
                <span>Branch</span>
                <select value={vehicleBranchId} onChange={(event) => setVehicleBranchId(event.target.value)}>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Vehicle #</span>
                <input value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>Plate</span>
              <input value={vehiclePlate} onChange={(event) => setVehiclePlate(event.target.value)} />
            </label>
            <button
              className="action-button transition-transform duration-150 hover:-translate-y-0.5"
              disabled={vehicleFormState.busy}
              type="submit"
            >
              {vehicleFormState.busy ? "Saving..." : "Create Vehicle"}
            </button>
            {vehicleFormState.message ? <p className="success-copy">{vehicleFormState.message}</p> : null}
            {vehicleFormState.error ? <p className="error-copy">{vehicleFormState.error}</p> : null}
          </form>

          <ul className="data-list">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <div>
                  <strong>{vehicle.vehicleNumber}</strong>
                  <span>{vehicle.plateNumber ?? "No plate"}</span>
                </div>
                <span>{vehicle.branch.code}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card control-card">
          <div className="section-header">
            <div>
              <p className="card-kicker">Stops</p>
              <h2>Master stop data</h2>
            </div>
            <span className="section-count">{stops.length}</span>
          </div>

          <form className="stack-form" onSubmit={handleCreateStop}>
            <div className="inline-fields">
              <label className="field">
                <span>Client stop ID</span>
                <input
                  value={stopClientStopId}
                  onChange={(event) => setStopClientStopId(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Stop name</span>
                <input value={stopName} onChange={(event) => setStopName(event.target.value)} />
              </label>
            </div>
            <div className="inline-fields">
              <label className="field">
                <span>Latitude</span>
                <input value={stopLatitude} onChange={(event) => setStopLatitude(event.target.value)} />
              </label>
              <label className="field">
                <span>Longitude</span>
                <input value={stopLongitude} onChange={(event) => setStopLongitude(event.target.value)} />
              </label>
            </div>
            <div className="inline-fields">
              <label className="field">
                <span>Category</span>
                <select
                  value={stopCategory}
                  onChange={(event) => setStopCategory(event.target.value as Stop["category"])}
                >
                  <option value="shelter">Shelter</option>
                  <option value="standalone">Standalone</option>
                  <option value="pressure_washing">Pressure Washing</option>
                </select>
              </label>
              <label className="field">
                <span>Frequency</span>
                <select
                  value={stopServiceFrequency}
                  onChange={(event) =>
                    setStopServiceFrequency(event.target.value as Stop["serviceFrequency"])
                  }
                >
                  <option value="7_day">7-day</option>
                  <option value="5_day">5-day</option>
                  <option value="biweekly">Biweekly</option>
                </select>
              </label>
            </div>
            <button
              className="action-button transition-transform duration-150 hover:-translate-y-0.5"
              disabled={stopFormState.busy}
              type="submit"
            >
              {stopFormState.busy ? "Saving..." : "Create Stop"}
            </button>
            {stopFormState.message ? <p className="success-copy">{stopFormState.message}</p> : null}
            {stopFormState.error ? <p className="error-copy">{stopFormState.error}</p> : null}
          </form>

          <ul className="data-list compact-list">
            {stops.map((stop) => (
              <li key={stop.id}>
                <div>
                  <strong>{stop.clientStopId}</strong>
                  <span>{stop.name}</span>
                </div>
                <span>{stop.category.replaceAll("_", " ")}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card control-card wide-card">
          <div className="section-header">
            <div>
              <p className="card-kicker">Routes</p>
              <h2>Route builder</h2>
            </div>
            <span className="section-count">{routes.length}</span>
          </div>

          <form className="stack-form" onSubmit={handleCreateRoute}>
            <div className="inline-fields">
              <label className="field">
                <span>Branch</span>
                <select value={routeBranchId} onChange={(event) => setRouteBranchId(event.target.value)}>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Route code</span>
                <input value={routeCode} onChange={(event) => setRouteCode(event.target.value)} />
              </label>
              <label className="field">
                <span>Route name</span>
                <input value={routeName} onChange={(event) => setRouteName(event.target.value)} />
              </label>
            </div>

            <div className="selector-panel">
              <p className="selector-label">Attach stops in order</p>
              <div className="selector-grid">
                {stops.map((stop) => {
                  const isSelected = selectedStopIds.includes(stop.id);
                  return (
                    <button
                      className={`selector-chip${isSelected ? " selector-chip-active" : ""}`}
                      key={stop.id}
                      onClick={() => toggleStopSelection(stop.id)}
                      type="button"
                    >
                      <strong>{stop.clientStopId}</strong>
                      <span>{stop.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="action-button transition-transform duration-150 hover:-translate-y-0.5"
              disabled={routeFormState.busy}
              type="submit"
            >
              {routeFormState.busy ? "Saving..." : "Create Route"}
            </button>
            {routeFormState.message ? <p className="success-copy">{routeFormState.message}</p> : null}
            {routeFormState.error ? <p className="error-copy">{routeFormState.error}</p> : null}
          </form>

          <ul className="data-list">
            {routes.map((route) => (
              <li key={route.id}>
                <div>
                  <strong>{route.code}</strong>
                  <span>{route.name}</span>
                </div>
                <span>{route.stopCount} stops</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card control-card wide-card">
          <div className="section-header">
            <div>
              <p className="card-kicker">Assignments</p>
              <h2>Daily dispatch</h2>
            </div>
            <span className="section-count">{assignments?.routes.length ?? 0}</span>
          </div>

          <form className="stack-form" onSubmit={handleCreateAssignment}>
            <div className="inline-fields">
              <label className="field">
                <span>Date</span>
                <input value={assignmentDate} onChange={(event) => setAssignmentDate(event.target.value)} type="date" />
              </label>
              <label className="field">
                <span>Route</span>
                <select value={assignmentRouteId} onChange={(event) => setAssignmentRouteId(event.target.value)}>
                  {routeOptions.map((route) => (
                    <option key={route.value} value={route.value}>
                      {route.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Employee</span>
                <select
                  value={assignmentEmployeeId}
                  onChange={(event) => setAssignmentEmployeeId(event.target.value)}
                >
                  {employeeOptions.map((employee) => (
                    <option key={employee.value} value={employee.value}>
                      {employee.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Vehicle</span>
                <select
                  value={assignmentVehicleId}
                  onChange={(event) => setAssignmentVehicleId(event.target.value)}
                >
                  {vehicleOptions.map((vehicle) => (
                    <option key={vehicle.value} value={vehicle.value}>
                      {vehicle.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              className="action-button transition-transform duration-150 hover:-translate-y-0.5"
              disabled={assignmentFormState.busy}
              type="submit"
            >
              {assignmentFormState.busy ? "Saving..." : "Create Assignment"}
            </button>
            {assignmentFormState.message ? <p className="success-copy">{assignmentFormState.message}</p> : null}
            {assignmentFormState.error ? <p className="error-copy">{assignmentFormState.error}</p> : null}
          </form>

          <ul className="assignment-list">
            {assignments?.routes.map((assignment) => (
              <li key={assignment.id}>
                <div>
                  <strong>{assignment.routeCode}</strong>
                  <span>{assignment.routeName}</span>
                </div>
                <div>
                  <span>{assignment.employeeName}</span>
                  <span>{assignment.vehicleNumber}</span>
                </div>
                <div>
                  <span className="status-pill">{assignment.status}</span>
                  <span>
                    {assignment.completedStops}/{assignment.completedStops + assignment.pendingStops} complete
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

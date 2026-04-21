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
  branch: Branch;
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
  const [routes, setRoutes] = useState<Route[]>([]);
  const [assignments, setAssignments] = useState<AssignmentBoard | null>(null);
  const [isPending, startTransition] = useTransition();

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
      void Promise.all([
        apiFetch<LoginResponse["user"]>("/auth/me", token),
        apiFetch<DashboardSummary>("/dashboard/manager/today", token),
        apiFetch<Branch[]>("/branches", token),
        apiFetch<Employee[]>("/employees", token),
        apiFetch<Vehicle[]>("/vehicles", token),
        apiFetch<Route[]>("/routes", token),
        apiFetch<AssignmentBoard>("/assignments/today", token)
      ])
        .then(([user, dashboardSummary, branchList, employeeList, vehicleList, routeList, assignmentBoard]) => {
          setAuthUser(user);
          setDashboard(dashboardSummary);
          setBranches(branchList);
          setEmployees(employeeList);
          setVehicles(vehicleList);
          setRoutes(routeList);
          setAssignments(assignmentBoard);
        })
        .catch(() => {
          setToken(null);
          window.localStorage.removeItem(TOKEN_KEY);
        });
    });
  }, [token]);

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

  if (!token) {
    return (
      <main className="shell app-shell">
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

            <button className="action-button" disabled={isPending} type="submit">
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Authenticated Session</p>
          <h1>Fleet operations dashboard</h1>
          <p className="lede">
            Signed in as {authUser?.email}. This screen is already reading live API data from the local app
            stack.
          </p>
        </div>

        <button className="ghost-button" onClick={handleLogout} type="button">
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

      <section className="grid data-grid">
        <article className="card data-card">
          <p className="card-kicker">Branches</p>
          <h2>{branches.length}</h2>
          <ul className="data-list">
            {branches.map((branch) => (
              <li key={branch.id}>
                <strong>{branch.code}</strong>
                <span>{branch.name}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card data-card">
          <p className="card-kicker">Employees</p>
          <h2>{employees.length}</h2>
          <ul className="data-list">
            {employees.map((employee) => (
              <li key={employee.id}>
                <strong>{employee.employeeCode}</strong>
                <span>{employee.fullName}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card data-card">
          <p className="card-kicker">Vehicles</p>
          <h2>{vehicles.length}</h2>
          <ul className="data-list">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <strong>{vehicle.vehicleNumber}</strong>
                <span>{vehicle.branch.code}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="roadmap assignments-panel">
        <div>
          <p className="eyebrow">Routes</p>
          <h2>Operational data snapshot</h2>
          <ul className="data-list compact-list">
            {routes.map((route) => (
              <li key={route.id}>
                <strong>{route.code}</strong>
                <span>
                  {route.name} · {route.stopCount} stops
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Assignments for {assignments?.assignmentDate}</p>
          <ul className="assignment-list">
            {assignments?.routes.map((assignment) => (
              <li key={assignment.id}>
                <div>
                  <strong>{assignment.routeCode}</strong>
                  <span>{assignment.employeeName}</span>
                </div>
                <div>
                  <span>{assignment.vehicleNumber}</span>
                  <span>
                    {assignment.completedStops}/{assignment.completedStops + assignment.pendingStops} complete
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

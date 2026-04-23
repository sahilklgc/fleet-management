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
  isActive: boolean;
};

type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string | null;
  isActive: boolean;
  branch: Branch;
};

type Vehicle = {
  id: string;
  vehicleNumber: string;
  plateNumber?: string | null;
  vin?: string | null;
  isActive: boolean;
  branch: Branch;
};

type Stop = {
  id: string;
  clientStopId: string;
  name: string;
  latitude: number;
  longitude: number;
  category: "pressure_washing" | "shelter" | "standalone";
  serviceFrequency: "7_day" | "5_day" | "biweekly";
  isActive: boolean;
  manualOverride: boolean;
};

type Route = {
  id: string;
  branchId: string;
  code: string;
  name: string;
  stopCount: number;
  branch: Branch;
};

type RouteDetail = Route & {
  stops: Array<
    Stop & {
      routeStopId: string;
      sequenceNumber: number;
    }
  >;
};

type RouteSplitImportPayload = {
  branchId: string;
  workbookName: string;
  routes: Array<{
    routeName: string;
    rows: Array<{
      bsid: string;
      stopName?: string;
      sourceRouteNumber?: string;
      sourceRouteName?: string;
    }>;
  }>;
};

type RouteSplitImportPreview = {
  workbookName: string;
  branchId: string;
  receivedRoutes: number;
  receivedRows: number;
  matchedStops: number;
  unmatchedBsids: string[];
  duplicateBsids: string[];
  routeSummaries: Array<{
    routeName: string;
    routeCode: string;
    rowCount: number;
    matchedRowCount: number;
    unmatchedBsids: string[];
    existingRoute: boolean;
  }>;
};

type RouteSplitApplyResult = {
  importBatchId: string;
  appliedRoutes: number;
  appliedStops: number;
  updatedRoutes: number;
  createdRoutes: number;
};

type AssignmentRow = {
  id: string;
  routeId: string;
  employeeId: string;
  vehicleId: string;
  assignmentDate: string;
  routeCode: string;
  routeName: string;
  employeeName: string;
  vehicleNumber: string;
  pendingStops: number;
  completedStops: number;
  issueReportedStops: number;
  status: string;
};

type AssignmentBoard = {
  assignmentDate: string;
  routes: AssignmentRow[];
};

type FormState = {
  busy: boolean;
  message: string | null;
  error: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "lgc_access_token";

function emptyFormState(): FormState {
  return {
    busy: false,
    error: null,
    message: null
  };
}

async function apiRequest<T>(
  path: string,
  token: string,
  options?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
  }
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options?.body ? { "Content-Type": "application/json" } : {})
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function getStopLabel(stop: Stop) {
  return `${stop.clientStopId} · ${stop.name}`;
}

async function parseRouteSplitWorkbook(file: File, branchId: string): Promise<RouteSplitImportPayload> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const routes: RouteSplitImportPayload["routes"] = [];

  for (const sheetName of workbook.SheetNames) {
    if (sheetName.trim().toLowerCase() === "summary") {
      continue;
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      continue;
    }

    const rows = (XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: ""
    }) as Array<Array<string | number | null>>)
      .slice(1)
      .map((row) => ({
        bsid: String(row[4] ?? "").trim(),
        stopName: String(row[5] ?? "").trim(),
        sourceRouteNumber: String(row[2] ?? "").trim(),
        sourceRouteName: String(row[3] ?? "").trim()
      }))
      .filter((row) => row.bsid);

    if (rows.length === 0) {
      continue;
    }

    routes.push({
      routeName: sheetName.trim(),
      rows
    });
  }

  return {
    branchId,
    workbookName: file.name,
    routes
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
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeDetail, setRouteDetail] = useState<RouteDetail | null>(null);
  const [routeDetailError, setRouteDetailError] = useState<string | null>(null);
  const [routeDetailLoading, setRouteDetailLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchCode, setBranchCode] = useState("DAL");
  const [branchName, setBranchName] = useState("Dallas Operations");

  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeBranchId, setEmployeeBranchId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("FIELD-201");
  const [employeeFirstName, setEmployeeFirstName] = useState("Taylor");
  const [employeeLastName, setEmployeeLastName] = useState("Brooks");
  const [employeePhone, setEmployeePhone] = useState("214-555-0147");

  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleBranchId, setVehicleBranchId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("Truck-21");
  const [vehiclePlate, setVehiclePlate] = useState("LGC-210");
  const [vehicleVin, setVehicleVin] = useState("");

  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [stopClientStopId, setStopClientStopId] = useState("METRO-2100");
  const [stopName, setStopName] = useState("Smith St & Walker");
  const [stopLatitude, setStopLatitude] = useState("29.7557");
  const [stopLongitude, setStopLongitude] = useState("-95.3658");
  const [stopCategory, setStopCategory] = useState<Stop["category"]>("shelter");
  const [stopServiceFrequency, setStopServiceFrequency] = useState<Stop["serviceFrequency"]>("7_day");
  const [stopIsActive, setStopIsActive] = useState(true);

  const [routeBranchId, setRouteBranchId] = useState("");
  const [routeCode, setRouteCode] = useState("R-24");
  const [routeName, setRouteName] = useState("Midtown Sweep");
  const [selectedStopIds, setSelectedStopIds] = useState<string[]>([]);
  const [routeImportBranchId, setRouteImportBranchId] = useState("");
  const [routeImportFile, setRouteImportFile] = useState<File | null>(null);
  const [routeImportPayload, setRouteImportPayload] = useState<RouteSplitImportPayload | null>(null);
  const [routeImportPreview, setRouteImportPreview] = useState<RouteSplitImportPreview | null>(null);

  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentRouteId, setAssignmentRouteId] = useState("");
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState("");
  const [assignmentVehicleId, setAssignmentVehicleId] = useState("");
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().slice(0, 10));

  const [branchFormState, setBranchFormState] = useState<FormState>(emptyFormState);
  const [employeeFormState, setEmployeeFormState] = useState<FormState>(emptyFormState);
  const [vehicleFormState, setVehicleFormState] = useState<FormState>(emptyFormState);
  const [stopFormState, setStopFormState] = useState<FormState>(emptyFormState);
  const [routeFormState, setRouteFormState] = useState<FormState>(emptyFormState);
  const [routeImportFormState, setRouteImportFormState] = useState<FormState>(emptyFormState);
  const [assignmentFormState, setAssignmentFormState] = useState<FormState>(emptyFormState);

  const refreshData = async (activeToken: string) => {
    const [user, dashboardSummary, branchList, employeeList, vehicleList, stopList, routeList, assignmentBoard] =
      await Promise.all([
        apiRequest<LoginResponse["user"]>("/auth/me", activeToken),
        apiRequest<DashboardSummary>("/dashboard/manager/today", activeToken),
        apiRequest<Branch[]>("/branches", activeToken),
        apiRequest<Employee[]>("/employees", activeToken),
        apiRequest<Vehicle[]>("/vehicles", activeToken),
        apiRequest<Stop[]>("/stops", activeToken),
        apiRequest<Route[]>("/routes", activeToken),
        apiRequest<AssignmentBoard>("/assignments/today", activeToken)
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

    return {
      user,
      dashboardSummary,
      branchList,
      employeeList,
      vehicleList,
      stopList,
      routeList,
      assignmentBoard
    };
  };

  const loadRouteDetail = async (routeId: string, activeToken: string) => {
    setRouteDetailLoading(true);
    setRouteDetailError(null);

    try {
      const detail = await apiRequest<RouteDetail>(`/routes/${routeId}`, activeToken);
      setRouteDetail(detail);
      setRouteBranchId(detail.branchId);
      setRouteCode(detail.code);
      setRouteName(detail.name);
      setSelectedStopIds(detail.stops.map((stop) => stop.id));
    } catch (error) {
      setRouteDetail(null);
      setRouteDetailError(error instanceof Error ? error.message : "Could not load route detail.");
    } finally {
      setRouteDetailLoading(false);
    }
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
      setRouteDetail(null);
      setSelectedRouteId(null);
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
    if (!routeImportBranchId) {
      setRouteImportBranchId(fallbackBranchId);
    }
  }, [branches, employeeBranchId, routeBranchId, routeImportBranchId, vehicleBranchId]);

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

  useEffect(() => {
    if (!selectedRouteId || !token) {
      setRouteDetail(null);
      setRouteDetailError(null);
      return;
    }

    void loadRouteDetail(selectedRouteId, token);
  }, [selectedRouteId, token]);

  useEffect(() => {
    if (!selectedRouteId) {
      return;
    }

    if (!routes.some((route) => route.id === selectedRouteId)) {
      resetRouteForm();
    }
  }, [routes, selectedRouteId]);

  const routeStopLookup = useMemo(
    () => new Map(stops.map((stop) => [stop.id, stop])),
    [stops]
  );

  const orderedSelectedStops = selectedStopIds
    .map((stopId) => routeStopLookup.get(stopId))
    .filter((stop): stop is Stop => Boolean(stop));

  const availableStops = stops.filter((stop) => !selectedStopIds.includes(stop.id));

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

  const canApplyRouteImport =
    Boolean(routeImportPreview) &&
    routeImportPreview!.unmatchedBsids.length === 0 &&
    routeImportPreview!.duplicateBsids.length === 0;

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

  function resetBranchForm() {
    setEditingBranchId(null);
    setBranchCode("DAL");
    setBranchName("Dallas Operations");
    setBranchFormState(emptyFormState());
  }

  function resetEmployeeForm() {
    setEditingEmployeeId(null);
    setEmployeeCode("FIELD-201");
    setEmployeeFirstName("Taylor");
    setEmployeeLastName("Brooks");
    setEmployeePhone("214-555-0147");
    setEmployeeFormState(emptyFormState());
  }

  function resetVehicleForm() {
    setEditingVehicleId(null);
    setVehicleNumber("Truck-21");
    setVehiclePlate("LGC-210");
    setVehicleVin("");
    setVehicleFormState(emptyFormState());
  }

  function resetStopForm() {
    setEditingStopId(null);
    setStopClientStopId("METRO-2100");
    setStopName("Smith St & Walker");
    setStopLatitude("29.7557");
    setStopLongitude("-95.3658");
    setStopCategory("shelter");
    setStopServiceFrequency("7_day");
    setStopIsActive(true);
    setStopFormState(emptyFormState());
  }

  function resetRouteForm() {
    setSelectedRouteId(null);
    setRouteDetail(null);
    setRouteDetailError(null);
    setRouteBranchId(branches[0]?.id ?? "");
    setRouteCode("R-24");
    setRouteName("Midtown Sweep");
    setSelectedStopIds([]);
    setRouteFormState(emptyFormState());
  }

  function resetRouteImport() {
    setRouteImportFile(null);
    setRouteImportPayload(null);
    setRouteImportPreview(null);
    setRouteImportFormState(emptyFormState());
  }

  function resetAssignmentForm() {
    setEditingAssignmentId(null);
    setAssignmentDate(new Date().toISOString().slice(0, 10));
    setAssignmentRouteId(routes[0]?.id ?? "");
    setAssignmentEmployeeId(employees[0]?.id ?? "");
    setAssignmentVehicleId(vehicles[0]?.id ?? "");
    setAssignmentFormState(emptyFormState());
  }

  function beginEditBranch(branch: Branch) {
    setEditingBranchId(branch.id);
    setBranchCode(branch.code);
    setBranchName(branch.name);
    setBranchFormState(emptyFormState());
  }

  function beginEditEmployee(employee: Employee) {
    setEditingEmployeeId(employee.id);
    setEmployeeBranchId(employee.branch.id);
    setEmployeeCode(employee.employeeCode);
    setEmployeeFirstName(employee.firstName);
    setEmployeeLastName(employee.lastName);
    setEmployeePhone(employee.phoneNumber ?? "");
    setEmployeeFormState(emptyFormState());
  }

  function beginEditVehicle(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.id);
    setVehicleBranchId(vehicle.branch.id);
    setVehicleNumber(vehicle.vehicleNumber);
    setVehiclePlate(vehicle.plateNumber ?? "");
    setVehicleVin(vehicle.vin ?? "");
    setVehicleFormState(emptyFormState());
  }

  function beginEditStop(stop: Stop) {
    setEditingStopId(stop.id);
    setStopClientStopId(stop.clientStopId);
    setStopName(stop.name);
    setStopLatitude(String(stop.latitude));
    setStopLongitude(String(stop.longitude));
    setStopCategory(stop.category);
    setStopServiceFrequency(stop.serviceFrequency);
    setStopIsActive(stop.isActive);
    setStopFormState(emptyFormState());
  }

  function beginEditRoute(routeId: string) {
    setRouteFormState(emptyFormState());
    setSelectedRouteId(routeId);
  }

  function beginEditAssignment(assignment: AssignmentRow) {
    setEditingAssignmentId(assignment.id);
    setAssignmentDate(assignment.assignmentDate);
    setAssignmentRouteId(assignment.routeId);
    setAssignmentEmployeeId(assignment.employeeId);
    setAssignmentVehicleId(assignment.vehicleId);
    setAssignmentFormState(emptyFormState());
  }

  function handleLogout() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthUser(null);
  }

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
        error: error instanceof Error ? error.message : "Request failed.",
        message: null
      });
    }
  }

  async function handleCreateOrUpdateBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    const isEditing = Boolean(editingBranchId);
    await withSubmission(setBranchFormState, isEditing ? "Branch updated." : "Branch created.", async () => {
      await apiRequest<Branch>(isEditing ? `/branches/${editingBranchId}` : "/branches", token, {
        method: isEditing ? "PATCH" : "POST",
        body: {
          code: branchCode,
          name: branchName
        }
      });
      await refreshData(token);
      resetBranchForm();
    });
  }

  async function handleDeleteBranch(branch: Branch) {
    if (!token || !window.confirm(`Delete branch ${branch.code}?`)) {
      return;
    }

    await withSubmission(setBranchFormState, "Branch deleted.", async () => {
      await apiRequest(`/branches/${branch.id}`, token, {
        method: "DELETE"
      });
      await refreshData(token);
      if (editingBranchId === branch.id) {
        resetBranchForm();
      }
    });
  }

  async function handleCreateOrUpdateEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !employeeBranchId) {
      return;
    }

    const isEditing = Boolean(editingEmployeeId);
    await withSubmission(
      setEmployeeFormState,
      isEditing ? "Employee updated." : "Employee created.",
      async () => {
        await apiRequest<Employee>(isEditing ? `/employees/${editingEmployeeId}` : "/employees", token, {
          method: isEditing ? "PATCH" : "POST",
          body: {
            branchId: employeeBranchId,
            employeeCode,
            firstName: employeeFirstName,
            lastName: employeeLastName,
            phoneNumber: employeePhone
          }
        });
        await refreshData(token);
        resetEmployeeForm();
      }
    );
  }

  async function handleDeleteEmployee(employee: Employee) {
    if (!token || !window.confirm(`Delete employee ${employee.fullName}?`)) {
      return;
    }

    await withSubmission(setEmployeeFormState, "Employee deleted.", async () => {
      await apiRequest(`/employees/${employee.id}`, token, {
        method: "DELETE"
      });
      await refreshData(token);
      if (editingEmployeeId === employee.id) {
        resetEmployeeForm();
      }
    });
  }

  async function handleCreateOrUpdateVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !vehicleBranchId) {
      return;
    }

    const isEditing = Boolean(editingVehicleId);
    await withSubmission(
      setVehicleFormState,
      isEditing ? "Vehicle updated." : "Vehicle created.",
      async () => {
        await apiRequest<Vehicle>(isEditing ? `/vehicles/${editingVehicleId}` : "/vehicles", token, {
          method: isEditing ? "PATCH" : "POST",
          body: {
            branchId: vehicleBranchId,
            vehicleNumber,
            plateNumber: vehiclePlate,
            vin: vehicleVin
          }
        });
        await refreshData(token);
        resetVehicleForm();
      }
    );
  }

  async function handleDeleteVehicle(vehicle: Vehicle) {
    if (!token || !window.confirm(`Delete vehicle ${vehicle.vehicleNumber}?`)) {
      return;
    }

    await withSubmission(setVehicleFormState, "Vehicle deleted.", async () => {
      await apiRequest(`/vehicles/${vehicle.id}`, token, {
        method: "DELETE"
      });
      await refreshData(token);
      if (editingVehicleId === vehicle.id) {
        resetVehicleForm();
      }
    });
  }

  async function handleCreateOrUpdateStop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    const isEditing = Boolean(editingStopId);
    await withSubmission(setStopFormState, isEditing ? "Stop updated." : "Stop created.", async () => {
      await apiRequest<Stop>(isEditing ? `/stops/${editingStopId}` : "/stops", token, {
        method: isEditing ? "PATCH" : "POST",
        body: {
          clientStopId: stopClientStopId,
          name: stopName,
          latitude: Number(stopLatitude),
          longitude: Number(stopLongitude),
          category: stopCategory,
          serviceFrequency: stopServiceFrequency,
          isActive: stopIsActive
        }
      });
      await refreshData(token);
      resetStopForm();
    });
  }

  async function handleDeleteStop(stop: Stop) {
    if (!token || !window.confirm(`Delete stop ${stop.clientStopId}?`)) {
      return;
    }

    await withSubmission(setStopFormState, "Stop deleted.", async () => {
      await apiRequest(`/stops/${stop.id}`, token, {
        method: "DELETE"
      });
      await refreshData(token);
      if (editingStopId === stop.id) {
        resetStopForm();
      }
      setSelectedStopIds((current) => current.filter((stopId) => stopId !== stop.id));
    });
  }

  async function handleCreateOrUpdateRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !routeBranchId) {
      return;
    }

    const isEditing = Boolean(selectedRouteId);
    await withSubmission(setRouteFormState, isEditing ? "Route updated." : "Route created.", async () => {
      const route = await apiRequest<RouteDetail | Route>(
        isEditing ? `/routes/${selectedRouteId}` : "/routes",
        token,
        {
          method: isEditing ? "PATCH" : "POST",
          body: {
            branchId: routeBranchId,
            code: routeCode,
            name: routeName,
            stopIds: selectedStopIds
          }
        }
      );

      await refreshData(token);
      setSelectedRouteId(route.id);

      if (!isEditing) {
        setRouteFormState({
          busy: false,
          error: null,
          message: "Route created."
        });
      }
    });
  }

  async function handleDeleteRoute(route: Route) {
    if (!token || !window.confirm(`Delete route ${route.code}?`)) {
      return;
    }

    await withSubmission(setRouteFormState, "Route deleted.", async () => {
      await apiRequest(`/routes/${route.id}`, token, {
        method: "DELETE"
      });
      await refreshData(token);
      if (selectedRouteId === route.id) {
        resetRouteForm();
      }
    });
  }

  async function handlePreviewRouteImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !routeImportBranchId || !routeImportFile) {
      return;
    }

    await withSubmission(setRouteImportFormState, "Route split preview ready.", async () => {
      const payload = await parseRouteSplitWorkbook(routeImportFile, routeImportBranchId);
      const preview = await apiRequest<RouteSplitImportPreview>("/imports/routes/preview", token, {
        method: "POST",
        body: payload
      });
      setRouteImportPayload(payload);
      setRouteImportPreview(preview);
    });
  }

  async function handleApplyRouteImport() {
    if (!token || !routeImportPayload || !routeImportPreview) {
      return;
    }

    setRouteImportFormState({
      busy: true,
      error: null,
      message: null
    });

    try {
      const result = await apiRequest<RouteSplitApplyResult>("/imports/routes/apply", token, {
        method: "POST",
        body: routeImportPayload
      });
      const refreshed = await refreshData(token);
      const firstImportedRouteCode = routeImportPreview.routeSummaries[0]?.routeCode;
      const firstImportedRoute = refreshed.routeList.find(
        (route) =>
          route.branchId === routeImportPayload.branchId && route.code === firstImportedRouteCode
      );

      if (firstImportedRoute) {
        setSelectedRouteId(firstImportedRoute.id);
      }

      setRouteImportFile(null);
      setRouteImportPayload(null);
      setRouteImportFormState({
        busy: false,
        error: null,
        message: `Applied ${result.appliedRoutes} routes and ${result.appliedStops} stops. ${result.createdRoutes} created, ${result.updatedRoutes} updated.`
      });
    } catch (error) {
      setRouteImportFormState({
        busy: false,
        error: error instanceof Error ? error.message : "Could not apply route split.",
        message: null
      });
    }
  }

  async function handleCreateOrUpdateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !assignmentRouteId || !assignmentEmployeeId || !assignmentVehicleId) {
      return;
    }

    const isEditing = Boolean(editingAssignmentId);
    await withSubmission(
      setAssignmentFormState,
      isEditing ? "Assignment updated." : "Assignment created.",
      async () => {
        await apiRequest(
          isEditing ? `/assignments/${editingAssignmentId}` : "/assignments",
          token,
          {
            method: isEditing ? "PATCH" : "POST",
            body: {
              routeId: assignmentRouteId,
              employeeId: assignmentEmployeeId,
              vehicleId: assignmentVehicleId,
              assignmentDate: `${assignmentDate}T00:00:00.000Z`
            }
          }
        );
        await refreshData(token);
        resetAssignmentForm();
      }
    );
  }

  async function handleDeleteAssignment(assignment: AssignmentRow) {
    if (!token || !window.confirm(`Delete assignment for ${assignment.routeCode} on ${assignment.assignmentDate}?`)) {
      return;
    }

    await withSubmission(setAssignmentFormState, "Assignment deleted.", async () => {
      await apiRequest(`/assignments/${assignment.id}`, token, {
        method: "DELETE"
      });
      await refreshData(token);
      if (editingAssignmentId === assignment.id) {
        resetAssignmentForm();
      }
    });
  }

  function addStopToRoute(stopId: string) {
    setSelectedStopIds((current) => (current.includes(stopId) ? current : [...current, stopId]));
  }

  function removeStopFromRoute(stopId: string) {
    setSelectedStopIds((current) => current.filter((id) => id !== stopId));
  }

  function moveStop(stopId: string, direction: -1 | 1) {
    setSelectedStopIds((current) => {
      const index = current.indexOf(stopId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [movedStopId] = next.splice(index, 1);
      if (!movedStopId) {
        return current;
      }
      next.splice(targetIndex, 0, movedStopId);
      return next;
    });
  }

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
            Signed in as {authUser?.email}. The workspace now supports editing, deleting, and managing route
            stop order directly from the browser.
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

          <form className="stack-form" onSubmit={handleCreateOrUpdateBranch}>
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
            <div className="form-actions">
              <button className="action-button" disabled={branchFormState.busy} type="submit">
                {branchFormState.busy
                  ? "Saving..."
                  : editingBranchId
                    ? "Save Branch"
                    : "Create Branch"}
              </button>
              {editingBranchId ? (
                <button className="ghost-button" onClick={resetBranchForm} type="button">
                  Cancel
                </button>
              ) : null}
            </div>
            {branchFormState.message ? <p className="success-copy">{branchFormState.message}</p> : null}
            {branchFormState.error ? <p className="error-copy">{branchFormState.error}</p> : null}
          </form>

          <ul className="data-list">
            {branches.map((branch) => (
              <li key={branch.id}>
                <div>
                  <strong>{branch.code}</strong>
                  <span>{branch.name}</span>
                </div>
                <div className="list-actions">
                  <button className="list-button" onClick={() => beginEditBranch(branch)} type="button">
                    Edit
                  </button>
                  <button
                    className="list-button danger-button"
                    onClick={() => handleDeleteBranch(branch)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
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

          <form className="stack-form" onSubmit={handleCreateOrUpdateEmployee}>
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
            <div className="form-actions">
              <button className="action-button" disabled={employeeFormState.busy} type="submit">
                {employeeFormState.busy
                  ? "Saving..."
                  : editingEmployeeId
                    ? "Save Employee"
                    : "Create Employee"}
              </button>
              {editingEmployeeId ? (
                <button className="ghost-button" onClick={resetEmployeeForm} type="button">
                  Cancel
                </button>
              ) : null}
            </div>
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
                <div className="row-meta-actions">
                  <span>{employee.branch.code}</span>
                  <div className="list-actions">
                    <button className="list-button" onClick={() => beginEditEmployee(employee)} type="button">
                      Edit
                    </button>
                    <button
                      className="list-button danger-button"
                      onClick={() => handleDeleteEmployee(employee)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
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

          <form className="stack-form" onSubmit={handleCreateOrUpdateVehicle}>
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
            <div className="inline-fields">
              <label className="field">
                <span>Plate</span>
                <input value={vehiclePlate} onChange={(event) => setVehiclePlate(event.target.value)} />
              </label>
              <label className="field">
                <span>VIN</span>
                <input value={vehicleVin} onChange={(event) => setVehicleVin(event.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <button className="action-button" disabled={vehicleFormState.busy} type="submit">
                {vehicleFormState.busy
                  ? "Saving..."
                  : editingVehicleId
                    ? "Save Vehicle"
                    : "Create Vehicle"}
              </button>
              {editingVehicleId ? (
                <button className="ghost-button" onClick={resetVehicleForm} type="button">
                  Cancel
                </button>
              ) : null}
            </div>
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
                <div className="row-meta-actions">
                  <span>{vehicle.branch.code}</span>
                  <div className="list-actions">
                    <button className="list-button" onClick={() => beginEditVehicle(vehicle)} type="button">
                      Edit
                    </button>
                    <button
                      className="list-button danger-button"
                      onClick={() => handleDeleteVehicle(vehicle)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
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

          <form className="stack-form" onSubmit={handleCreateOrUpdateStop}>
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
            <label className="checkbox-field">
              <input
                checked={stopIsActive}
                onChange={(event) => setStopIsActive(event.target.checked)}
                type="checkbox"
              />
              <span>Stop is active</span>
            </label>
            <div className="form-actions">
              <button className="action-button" disabled={stopFormState.busy} type="submit">
                {stopFormState.busy ? "Saving..." : editingStopId ? "Save Stop" : "Create Stop"}
              </button>
              {editingStopId ? (
                <button className="ghost-button" onClick={resetStopForm} type="button">
                  Cancel
                </button>
              ) : null}
            </div>
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
                <div className="row-meta-actions">
                  <span>{stop.category.replaceAll("_", " ")}</span>
                  <div className="list-actions">
                    <button className="list-button" onClick={() => beginEditStop(stop)} type="button">
                      Edit
                    </button>
                    <button
                      className="list-button danger-button"
                      onClick={() => handleDeleteStop(stop)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="card control-card wide-card">
          <div className="section-header">
            <div>
              <p className="card-kicker">Routes</p>
              <h2>Route detail management</h2>
            </div>
            <div className="section-actions">
              <span className="section-count">{routes.length}</span>
              <button className="ghost-button" onClick={resetRouteForm} type="button">
                New Route
              </button>
            </div>
          </div>

          <div className="route-workspace">
            <div className="route-list-panel">
              <ul className="data-list route-list">
                {routes.map((route) => (
                  <li
                    className={selectedRouteId === route.id ? "route-row route-row-active" : "route-row"}
                    key={route.id}
                  >
                    <button className="route-select" onClick={() => beginEditRoute(route.id)} type="button">
                      <strong>{route.code}</strong>
                      <span>{route.name}</span>
                    </button>
                    <div className="row-meta-actions">
                      <span>{route.stopCount} stops</span>
                      <div className="list-actions">
                        <button className="list-button" onClick={() => beginEditRoute(route.id)} type="button">
                          Edit
                        </button>
                        <button
                          className="list-button danger-button"
                          onClick={() => handleDeleteRoute(route)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="route-detail-panel">
              <form className="stack-form" onSubmit={handleCreateOrUpdateRoute}>
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

                <div className="route-detail-header">
                  <div>
                    <p className="selector-label">
                      {selectedRouteId
                        ? `Editing ${routeDetail?.code ?? "selected route"}`
                        : "New route draft"}
                    </p>
                    <p className="lede small-copy">
                      Build the ordered stop list below. The route detail panel reflects the actual stop
                      sequence that will be assigned out.
                    </p>
                  </div>
                  {routeDetailLoading ? <span className="muted-badge">Loading route...</span> : null}
                </div>

                {routeDetailError ? <p className="error-copy">{routeDetailError}</p> : null}

                <div className="route-builder-grid">
                  <div className="selector-panel">
                    <p className="selector-label">Route sequence</p>
                    <div className="ordered-stop-list">
                      {orderedSelectedStops.length ? (
                        orderedSelectedStops.map((stop, index) => (
                          <div className="ordered-stop-card" key={stop.id}>
                            <div>
                              <strong>
                                {index + 1}. {stop.clientStopId}
                              </strong>
                              <span>{stop.name}</span>
                            </div>
                            <div className="list-actions">
                              <button
                                className="list-button"
                                disabled={index === 0}
                                onClick={() => moveStop(stop.id, -1)}
                                type="button"
                              >
                                Up
                              </button>
                              <button
                                className="list-button"
                                disabled={index === orderedSelectedStops.length - 1}
                                onClick={() => moveStop(stop.id, 1)}
                                type="button"
                              >
                                Down
                              </button>
                              <button
                                className="list-button danger-button"
                                onClick={() => removeStopFromRoute(stop.id)}
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty-copy">No stops attached yet. Add them from the right panel.</p>
                      )}
                    </div>
                  </div>

                  <div className="selector-panel">
                    <p className="selector-label">Available stops</p>
                    <div className="selector-grid">
                      {availableStops.map((stop) => (
                        <button
                          className="selector-chip"
                          key={stop.id}
                          onClick={() => addStopToRoute(stop.id)}
                          type="button"
                        >
                          <strong>{stop.clientStopId}</strong>
                          <span>{stop.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="action-button" disabled={routeFormState.busy} type="submit">
                    {routeFormState.busy ? "Saving..." : selectedRouteId ? "Save Route" : "Create Route"}
                  </button>
                  {selectedRouteId ? (
                    <button className="ghost-button" onClick={resetRouteForm} type="button">
                      Stop Editing
                    </button>
                  ) : null}
                </div>
                {routeFormState.message ? <p className="success-copy">{routeFormState.message}</p> : null}
                {routeFormState.error ? <p className="error-copy">{routeFormState.error}</p> : null}
              </form>
            </div>
          </div>
        </article>

        <article className="card control-card wide-card">
          <div className="section-header">
            <div>
              <p className="card-kicker">Assignments</p>
              <h2>Daily dispatch</h2>
            </div>
            <span className="section-count">{assignments?.routes.length ?? 0}</span>
          </div>

          <form className="stack-form" onSubmit={handleCreateOrUpdateAssignment}>
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

            <div className="form-actions">
              <button className="action-button" disabled={assignmentFormState.busy} type="submit">
                {assignmentFormState.busy
                  ? "Saving..."
                  : editingAssignmentId
                    ? "Save Assignment"
                    : "Create Assignment"}
              </button>
              {editingAssignmentId ? (
                <button className="ghost-button" onClick={resetAssignmentForm} type="button">
                  Cancel
                </button>
              ) : null}
            </div>
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
                <div className="row-meta-actions">
                  <div>
                    <span className="status-pill">{assignment.status}</span>
                    <span>
                      {assignment.completedStops}/{assignment.completedStops + assignment.pendingStops} complete
                    </span>
                  </div>
                  <div className="list-actions">
                    <button className="list-button" onClick={() => beginEditAssignment(assignment)} type="button">
                      Edit
                    </button>
                    <button
                      className="list-button danger-button"
                      onClick={() => handleDeleteAssignment(assignment)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="card control-card wide-card">
          <div className="section-header">
            <div>
              <p className="card-kicker">Route Split Import</p>
              <h2>Manager workbook intake</h2>
            </div>
            <span className="section-count">{routeImportPreview?.receivedRoutes ?? 0}</span>
          </div>

          <form className="stack-form" onSubmit={handlePreviewRouteImport}>
            <div className="inline-fields">
              <label className="field">
                <span>Branch</span>
                <select
                  value={routeImportBranchId}
                  onChange={(event) => {
                    setRouteImportBranchId(event.target.value);
                    setRouteImportPreview(null);
                  }}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Workbook</span>
                <input
                  accept=".xlsx,.xls"
                  onChange={(event) => {
                    setRouteImportFile(event.target.files?.[0] ?? null);
                    setRouteImportPreview(null);
                  }}
                  type="file"
                />
              </label>
            </div>

            <p className="small-copy">
              The importer treats each sheet as an internal route, ignores <code>Sequence #</code>, and
              matches rows against master stops by unique <code>BSID</code>.
            </p>

            <div className="form-actions">
              <button className="action-button" disabled={routeImportFormState.busy || !routeImportFile} type="submit">
                {routeImportFormState.busy
                  ? routeImportPreview
                    ? "Applying..."
                    : "Reading workbook..."
                  : "Preview Workbook"}
              </button>
              {routeImportPreview ? (
                <button
                  className="ghost-button"
                  disabled={routeImportFormState.busy || !canApplyRouteImport}
                  onClick={handleApplyRouteImport}
                  type="button"
                >
                  {routeImportFormState.busy ? "Applying..." : "Apply Route Split"}
                </button>
              ) : null}
              {(routeImportFile || routeImportPreview) ? (
                <button className="ghost-button" disabled={routeImportFormState.busy} onClick={resetRouteImport} type="button">
                  Clear
                </button>
              ) : null}
            </div>

            {routeImportFormState.message ? <p className="success-copy">{routeImportFormState.message}</p> : null}
            {routeImportFormState.error ? <p className="error-copy">{routeImportFormState.error}</p> : null}
            {routeImportPreview && !canApplyRouteImport ? (
              <p className="error-copy">
                This workbook cannot be applied yet. Import the full master stops first so the BSIDs in
                this route split workbook can be matched.
              </p>
            ) : null}
          </form>

          {routeImportPreview ? (
            <div className="import-preview-grid">
              <article className="summary-card">
                <p className="card-kicker">Workbook</p>
                <strong>{routeImportPreview.workbookName}</strong>
                <p className="small-copy">
                  {routeImportPreview.receivedRoutes} routes · {routeImportPreview.receivedRows} rows
                </p>
              </article>
              <article className="summary-card">
                <p className="card-kicker">Matched BSIDs</p>
                <strong>{routeImportPreview.matchedStops}</strong>
                <p className="small-copy">
                  {routeImportPreview.unmatchedBsids.length} unmatched · {routeImportPreview.duplicateBsids.length} duplicates
                </p>
              </article>

              {routeImportPreview.unmatchedBsids.length ? (
                <div className="import-preview-panel">
                  <p className="card-kicker">Unmatched BSIDs</p>
                  <p className="small-copy">{routeImportPreview.unmatchedBsids.join(", ")}</p>
                </div>
              ) : null}

              {routeImportPreview.duplicateBsids.length ? (
                <div className="import-preview-panel">
                  <p className="card-kicker">Duplicate BSIDs</p>
                  <p className="small-copy">{routeImportPreview.duplicateBsids.join(", ")}</p>
                </div>
              ) : null}

              <div className="import-preview-panel">
                <p className="card-kicker">Route Preview</p>
                <ul className="data-list compact-list">
                  {routeImportPreview.routeSummaries.map((route) => (
                    <li key={route.routeCode}>
                      <div>
                        <strong>{route.routeName}</strong>
                        <span>{route.routeCode}</span>
                      </div>
                      <div className="row-meta-actions">
                        <span>
                          {route.matchedRowCount}/{route.rowCount} matched
                        </span>
                        <span>{route.existingRoute ? "Will update" : "Will create"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}

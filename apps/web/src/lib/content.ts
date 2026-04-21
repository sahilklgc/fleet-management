export const APP_SECTIONS = [
  {
    kicker: "Security",
    title: "Access control before velocity",
    description:
      "Admin, manager, on-site manager, and worker roles should be enforced centrally so every future screen inherits the same permission model."
  },
  {
    kicker: "Operations",
    title: "Daily routes are the first product",
    description:
      "Dispatch, assignments, stop flow, and override auditing are what make the system useful before maps and telematics arrive."
  },
  {
    kicker: "Scalability",
    title: "Shared backend, mobile-ready contracts",
    description:
      "A modular monolith with shared TypeScript domain contracts keeps the web product fast now and reduces rewrite risk later."
  }
] as const;

export const DAILY_PRIORITIES = [
  "Lock the role and permission matrix.",
  "Model master stops separately from internal routes.",
  "Ship daily assignments before live tracking.",
  "Require reasons for manager overrides.",
  "Treat audit logs as a first-class product feature."
] as const;

/* Obecno screen catalog — APIs & bottom sheets for Archify passport cards.
 * Paths are relative to AppConstants: base https://app.obecno.com + /api/v1
 */
window.OBECNO_SCREEN_CATALOG = {
  // —— Auth / launch ——
  open: {
    title: "Open app",
    purpose: "User launches Obecno from the home screen or a deep link.",
    apis: [],
    sheets: [],
    notes: "No API call yet — Splash decides the next route."
  },
  splash: {
    title: "Splash",
    purpose: "Resolves onboarding flag, session, permissions, and role, then routes.",
    apis: [
      { method: "GET", path: "/api/v1/auth/me", purpose: "Restore the signed-in user when a session token exists." },
      { method: "GET", path: "/api/v1/employee/permissions", purpose: "Load company attendance policies / permission flags after auth." }
    ],
    sheets: [],
    notes: "May skip straight to a role shell when already signed in."
  },
  onboarding: {
    title: "Onboarding",
    purpose: "First-run carousel; entry to Sign in or Book a demo.",
    apis: [],
    sheets: [],
    notes: "Local UI only — marks onboarding complete on device."
  },
  demo: {
    title: "Book demo",
    purpose: "Marketing / sales demo request flow.",
    apis: [
      { method: "POST", path: "/api/v1 (book-demo endpoint)", purpose: "Submit demo request contact details (BookDemoService)." }
    ],
    sheets: [],
    notes: "Reached from onboarding, not from role shells."
  },
  invite: {
    title: "Invite deep link",
    purpose: "obecno:// (or https) invite opens the app to join a company.",
    apis: [],
    sheets: [],
    notes: "Handled by JoinDeepLinkService before navigation."
  },
  joined: {
    title: "You've joined",
    purpose: "Confirms invite acceptance and continues into login.",
    apis: [],
    sheets: [],
    notes: "Join invite provider may hydrate company name from the link payload."
  },
  login: {
    title: "Login email",
    purpose: "Collect email, then continue to password.",
    apis: [],
    sheets: [],
    notes: "API login happens on the password screen."
  },
  password: {
    title: "Login password",
    purpose: "Authenticate with email + password and start a session.",
    apis: [
      { method: "POST", path: "/api/v1/auth/login", purpose: "Exchange credentials for tokens and user/company payload." },
      { method: "GET", path: "/api/v1/auth/me", purpose: "Confirm session user after login when needed." }
    ],
    sheets: [],
    notes: "On success → permissions or role shell."
  },
  forgot: {
    title: "Forgot password",
    purpose: "Request a password-reset email.",
    apis: [
      { method: "POST", path: "/api/v1/auth/forgot-password", purpose: "Send reset instructions to the email address." }
    ],
    sheets: [
      { name: "ForgotPasswordSheet", purpose: "Collect email and confirm the reset request was sent." }
    ]
  },
  permissions: {
    title: "Enable permissions",
    purpose: "Prompt for location / notification / motion access required for attendance.",
    apis: [
      { method: "GET", path: "/api/v1/employee/permissions", purpose: "Read company policy flags that drive which OS permissions matter." }
    ],
    sheets: [],
    notes: "Uses OS permission dialogs; not a REST write."
  },
  blocked: {
    title: "Device blocked",
    purpose: "Stop the user when this device is not approved for the account.",
    apis: [
      { method: "GET", path: "/api/v1/employee/devices", purpose: "Device approval state is reflected from linked-devices / auth bootstrap." }
    ],
    sheets: [],
    notes: "User can return to login or wait for manager approval."
  },
  employee: {
    title: "Employee home",
    purpose: "Employee bottom-nav shell (/employee_nav).",
    apis: [],
    sheets: [],
    notes: "Hosts Clock, Attendance, Alerts, More tabs."
  },
  manager: {
    title: "Manager home",
    purpose: "Manager bottom-nav shell (/manager_nav).",
    apis: [],
    sheets: [],
    notes: "Hosts Overview, Clock, Team attendance, Alerts, More."
  },

  // —— Employee module ——
  shell: {
    title: "Nav shell",
    purpose: "Bottom navigation container for the active role.",
    apis: [],
    sheets: [],
    notes: "Same id used on employee and manager tab diagrams."
  },
  clock: {
    title: "Clock",
    purpose: "Live punch in/out, breaks, and today’s timeline.",
    apis: [
      { method: "GET", path: "/api/v1/employee/attendance", purpose: "Load today’s attendance / punch timeline." },
      { method: "POST", path: "/api/v1/employee/attendance", purpose: "Record check-in, check-out, or break events (also via offline queue sync)." },
      { method: "GET", path: "/api/v1/employee/permissions", purpose: "Read check-in / grace / break policy values for the clock UI." }
    ],
    sheets: [
      { name: "LocationBottomSheet", purpose: "Pick which office/location the punch applies to." },
      { name: "ClockAttendanceDetailsSheet", purpose: "Inspect a punch event from the clock card (when opened)." }
    ]
  },
  attendance: {
    title: "Attendance / Team attendance",
    purpose: "Employee history calendar, or manager team attendance list (context depends on diagram).",
    apis: [
      { method: "GET", path: "/api/v1/employee/attendance", purpose: "Employee: month / day attendance records." },
      { method: "GET", path: "/api/v1/employee/attendance/details", purpose: "Employee: detailed day events and edit requests." },
      { method: "GET", path: "/api/v1/employee/calendar", purpose: "Employee calendar markers (holidays / leaves)." },
      { method: "GET", path: "/api/v1/manager/team-attendance", purpose: "Manager: team list for a date / filters." },
      { method: "GET", path: "/api/v1/manager/team-attendance/filters", purpose: "Manager: status & location filter options." },
      { method: "GET", path: "/api/v1/manager/team-attendance/details", purpose: "Manager: one employee’s day details." }
    ],
    sheets: [
      { name: "AttendanceDetailsSheet", purpose: "Employee day detail + edit history." },
      { name: "AddAttendanceBottomSheet", purpose: "Add or correct a punch." },
      { name: "HolidayBottomSheet", purpose: "Show holiday info for a calendar day." },
      { name: "MonthYearPickerSheet", purpose: "Jump the calendar to another month." },
      { name: "ManagerAttendanceDetailsSheet", purpose: "Manager row → employee day detail." },
      { name: "StatusFilterSheet", purpose: "Filter team list by status." },
      { name: "LocationsFilterSheet", purpose: "Filter team list by location." }
    ]
  },
  alerts: {
    title: "Alerts",
    purpose: "In-app notification inbox (device / attendance / join alerts).",
    apis: [
      { method: "local + push", path: "(AlertNotificationService / providers)", purpose: "Alerts are hydrated from app services and notification taps; not a single CMS path." }
    ],
    sheets: [],
    notes: "Deep links can force-open this tab via goToAlerts()."
  },
  more: {
    title: "More tab",
    purpose: "Opens the shared ProfileSettingsScreen hub.",
    apis: [
      { method: "GET", path: "/api/v1/employee/profile", purpose: "Profile header on the More hub." }
    ],
    sheets: [],
    notes: "See section 4 for every destination under More."
  },
  "loc-sheet": {
    title: "Location picker",
    purpose: "Choose the active office for clock punches.",
    apis: [],
    sheets: [
      { name: "LocationBottomSheet", purpose: "Lists authProvider.locations; selection stays on device for the clock controller." }
    ],
    notes: "Uses locations already loaded with the session — no extra REST call on open."
  },
  "day-sheet": {
    title: "Day details",
    purpose: "Full punch timeline for one calendar day.",
    apis: [
      { method: "GET", path: "/api/v1/employee/attendance/details", purpose: "Load events and pending edits for the day." }
    ],
    sheets: [
      { name: "AttendanceDetailsSheet", purpose: "Primary day detail overlay." }
    ]
  },
  "add-sheet": {
    title: "Add / edit punch",
    purpose: "Manually add or correct attendance times.",
    apis: [
      { method: "POST", path: "/api/v1/employee/attendance/edit", purpose: "Submit an attendance edit request / correction." },
      { method: "POST", path: "/api/v1/employee/attendance", purpose: "Create punches when adding a missing entry." }
    ],
    sheets: [
      { name: "AddAttendanceBottomSheet", purpose: "Form for time, type, and notes." }
    ]
  },
  holiday: {
    title: "Holiday detail",
    purpose: "Explain a holiday marker on the calendar.",
    apis: [
      { method: "GET", path: "/api/v1/employee/calendar", purpose: "Holiday metadata comes from the calendar payload." }
    ],
    sheets: [
      { name: "HolidayBottomSheet", purpose: "Read-only holiday summary." }
    ]
  },
  month: {
    title: "Month picker",
    purpose: "Jump attendance history to another month.",
    apis: [],
    sheets: [
      { name: "MonthYearPickerSheet", purpose: "Local date picker; then reloads attendance for that month." }
    ]
  },

  // —— Manager ——
  overview: {
    title: "Overview",
    purpose: "Manager dashboard: stats, quick actions, directories.",
    apis: [
      { method: "GET", path: "/api/v1/manager/dashboard", purpose: "Summary cards (headcount, presence, etc.)." },
      { method: "GET", path: "/api/v1/manager/team-attendance", purpose: "Seed today’s team presence for overview widgets." },
      { method: "GET", path: "/api/v1/manager/employees", purpose: "Directory counts / lists used by overview actions." },
      { method: "GET", path: "/api/v1/manager/locations", purpose: "Location counts for the directory card." }
    ],
    sheets: [
      { name: "NewLocationSheet", purpose: "Start creating a location from Overview." },
      { name: "AddEmployeeSheet", purpose: "Invite / add an employee from Overview." }
    ]
  },
  "add-emp": {
    title: "Add employee",
    purpose: "Invite or create a team member.",
    apis: [
      { method: "GET", path: "/api/v1/manager/employees/create", purpose: "Load create-form metadata when needed." },
      { method: "POST", path: "/api/v1/manager/employees", purpose: "Create employee record." },
      { method: "POST", path: "/api/v1/manager/employees/invite", purpose: "Send invite to the employee email." }
    ],
    sheets: [
      { name: "AddEmployeeSheet", purpose: "Collect name/email/role and submit." },
      { name: "InviteSentDialog", purpose: "Confirm invite was sent." }
    ]
  },
  "add-loc": {
    title: "New location",
    purpose: "Create a workplace location (name, geo, members).",
    apis: [
      { method: "POST", path: "/api/v1/manager/locations", purpose: "Create the location." },
      { method: "POST", path: "/api/v1/manager/locations/{id}/members", purpose: "Attach members after create (AddMembersSheet)." }
    ],
    sheets: [
      { name: "NewLocationSheet", purpose: "Location create form." },
      { name: "AddMembersSheet", purpose: "Assign employees to the new location." }
    ]
  },
  "all-emp": {
    title: "All employees",
    purpose: "Full employee directory with filters.",
    apis: [
      { method: "GET", path: "/api/v1/manager/employees", purpose: "Paginated / filtered employee list." }
    ],
    sheets: [
      { name: "ManagerEmployeeProfileSheet", purpose: "Open an employee card." },
      { name: "AddEmployeeSheet", purpose: "Add from the directory header." },
      { name: "StatusFilterSheet", purpose: "Filter by employment / attendance status." },
      { name: "LocationsFilterSheet", purpose: "Filter by location." }
    ]
  },
  "all-loc": {
    title: "All locations",
    purpose: "List every office / site the company manages.",
    apis: [
      { method: "GET", path: "/api/v1/manager/locations", purpose: "Fetch all locations." }
    ],
    sheets: [
      { name: "NewLocationSheet", purpose: "Create another location from the list." }
    ]
  },
  "emp-profile": {
    title: "Employee profile sheet",
    purpose: "Manager hub for one employee: contact, attendance, locations, devices, schedule.",
    apis: [
      { method: "GET", path: "/api/v1/manager/employees/{id}", purpose: "Load employee profile detail." },
      { method: "PUT/PATCH", path: "/api/v1/manager/employees/{id}", purpose: "Update profile fields." }
    ],
    sheets: [
      { name: "ManagerEmployeeProfileSheet", purpose: "Root sheet." },
      { name: "AccountInformationSheet", purpose: "Edit account fields." },
      { name: "ManagerEmployeeAttendanceSheet", purpose: "Employee attendance history." },
      { name: "EmployeeDefaultLocationsSheet", purpose: "Assigned / default locations." },
      { name: "ManagerLinkedDevicesSheet", purpose: "Review linked devices." },
      { name: "CheckInOutTimingSheet", purpose: "Edit check-in / out windows." },
      { name: "WorkingDaysSheet", purpose: "Edit working days." },
      { name: "BreakTimingSheet", purpose: "Edit break timing." }
    ]
  },
  "emp-att": {
    title: "Employee attendance sheet",
    purpose: "History for one employee from the profile sheet.",
    apis: [
      { method: "GET", path: "/api/v1/manager/team-attendance/details", purpose: "Day-level attendance for that employee." },
      { method: "GET", path: "/api/v1/attendance/monthly/{employeeId}/{yearMonth}", purpose: "Monthly summary when used." }
    ],
    sheets: [
      { name: "ManagerEmployeeAttendanceSheet", purpose: "Scrollable history UI." }
    ]
  },
  "emp-locs": {
    title: "Assigned locations sheet",
    purpose: "See / change which locations an employee belongs to.",
    apis: [
      { method: "GET", path: "/api/v1/manager/locations", purpose: "Available locations." },
      { method: "POST", path: "/api/v1/manager/locations/{id}/members", purpose: "Assign member to a location." }
    ],
    sheets: [
      { name: "EmployeeDefaultLocationsSheet", purpose: "Assigned vs default location modes." }
    ]
  },
  "emp-devices": {
    title: "Manager linked devices",
    purpose: "Approve or manage devices for one employee.",
    apis: [
      { method: "GET", path: "/api/v1/manager/employees/{id}/devices", purpose: "List devices." },
      { method: "POST/PUT/PATCH", path: "/api/v1/manager/employees/{id}/devices/{deviceId}/review", purpose: "Approve / reject a device." }
    ],
    sheets: [
      { name: "ManagerLinkedDevicesSheet", purpose: "Device list + review actions." }
    ]
  },
  "emp-timing": {
    title: "Schedule settings sheets",
    purpose: "Edit check-in window, working days, and breaks for an employee.",
    apis: [
      { method: "PUT/PATCH", path: "/api/v1/manager/employees/{id}", purpose: "Persist schedule-related fields on the employee." }
    ],
    sheets: [
      { name: "CheckInOutTimingSheet", purpose: "Check-in / check-out times." },
      { name: "WorkingDaysSheet", purpose: "Working days of week." },
      { name: "BreakTimingSheet", purpose: "Break length / window." }
    ]
  },
  "loc-overview": {
    title: "Location overview",
    purpose: "Dashboard for one location (members, schedule summary).",
    apis: [
      { method: "GET", path: "/api/v1/manager/locations/{id}", purpose: "Location detail." },
      { method: "GET", path: "/api/v1/manager/locations/{id}/schedule", purpose: "Schedule for the location." }
    ],
    sheets: []
  },
  "loc-setup": {
    title: "Location setup",
    purpose: "Edit location metadata, geofence, and permissions.",
    apis: [
      { method: "GET", path: "/api/v1/manager/locations/{id}", purpose: "Load editable fields." },
      { method: "PUT/PATCH", path: "/api/v1/manager/locations/{id}", purpose: "Save location changes." },
      { method: "PUT/PATCH", path: "/api/v1/manager/locations/{id}/schedule", purpose: "Save schedule." }
    ],
    sheets: []
  },
  "loc-map": {
    title: "Map setup",
    purpose: "Place the location pin / geofence on the map.",
    apis: [
      { method: "PUT/PATCH", path: "/api/v1/manager/locations/{id}", purpose: "Persist lat/lng / radius after map pick." }
    ],
    sheets: [],
    notes: "Uses Google Maps UI locally; save goes through the locations API."
  },
  "att-details": {
    title: "Manager attendance details",
    purpose: "Inspect one team member’s day; jump to profile or edit.",
    apis: [
      { method: "GET", path: "/api/v1/manager/team-attendance/details", purpose: "Load the day detail payload." },
      { method: "GET", path: "/api/v1/manager/team-attendance/edit", purpose: "Load edit form data." },
      { method: "POST", path: "/api/v1/manager/team-attendance/edit/save", purpose: "Save manager corrections." }
    ],
    sheets: [
      { name: "ManagerAttendanceDetailsSheet", purpose: "Detail + actions." },
      { name: "AddAttendanceBottomSheet", purpose: "Edit / add punches from details." },
      { name: "ManagerEmployeeProfileSheet", purpose: "Open full employee profile." }
    ]
  },
  "status-filter": {
    title: "Status filter",
    purpose: "Filter team attendance by status.",
    apis: [
      { method: "GET", path: "/api/v1/manager/team-attendance/filters", purpose: "Available status options." }
    ],
    sheets: [
      { name: "StatusFilterSheet", purpose: "Pick status chips." }
    ]
  },
  "loc-filter": {
    title: "Location filter",
    purpose: "Filter team attendance by workplace.",
    apis: [
      { method: "GET", path: "/api/v1/manager/team-attendance/filters", purpose: "Available locations for filtering." }
    ],
    sheets: [
      { name: "LocationsFilterSheet", purpose: "Multi-select locations." }
    ]
  },

  // —— More / settings ——
  hub: {
    title: "More hub",
    purpose: "Shared settings home for employee and manager.",
    apis: [
      { method: "GET", path: "/api/v1/employee/profile", purpose: "Profile header (name, photo, role)." }
    ],
    sheets: [],
    notes: "Tiles push dedicated screens listed below."
  },
  account: {
    title: "Account info",
    purpose: "View / edit personal account fields.",
    apis: [
      { method: "GET", path: "/api/v1/employee/profile", purpose: "Load account fields." },
      { method: "PUT/PATCH", path: "/api/v1/employee/profile", purpose: "Save profile changes." },
      { method: "POST", path: "/api/v1/employee/profile/photo", purpose: "Upload or remove profile photo." }
    ],
    sheets: [
      { name: "EditAccountFieldSheet", purpose: "Edit a single field (name, phone, etc.)." }
    ]
  },
  offices: {
    title: "Offices & locations",
    purpose: "Show workplaces attached to the signed-in user.",
    apis: [],
    sheets: [],
    notes: "Primarily reads locations already on AuthProvider from login / session refresh."
  },
  reminders: {
    title: "My reminders",
    purpose: "Configure attendance reminder notifications.",
    apis: [],
    sheets: [
      { name: "ReminderTimePickerSheet", purpose: "Pick reminder clock times." },
      { name: "ReminderDurationPickerSheet", purpose: "Pick reminder window / duration." }
    ],
    notes: "Stored locally + scheduled via ReminderNotificationService / native alarms."
  },
  pickers: {
    title: "Reminder pickers",
    purpose: "Time and duration editors for reminders.",
    apis: [],
    sheets: [
      { name: "ReminderTimePickerSheet", purpose: "Time of day." },
      { name: "ReminderDurationPickerSheet", purpose: "Duration minutes." }
    ]
  },
  devices: {
    title: "Linked devices",
    purpose: "See devices registered to this account.",
    apis: [
      { method: "GET", path: "/api/v1/employee/devices", purpose: "List linked devices." },
      { method: "POST", path: "/api/v1/employee/devices", purpose: "Register the current device." },
      { method: "DELETE", path: "/api/v1/employee/devices/{id}", purpose: "Remove a device." }
    ],
    sheets: []
  },
  password: {
    title: "Change password",
    purpose: "Update account password while signed in.",
    apis: [
      { method: "POST", path: "/api/v1/auth/change-password", purpose: "Submit current + new password." }
    ],
    sheets: []
  },
  terms: {
    title: "Terms of use",
    purpose: "Show the company’s terms & conditions document.",
    apis: [
      { method: "GET", path: "/api/v1/terms-and-conditions", purpose: "Fetch CMS terms content (cached on device after load)." }
    ],
    sheets: [],
    notes: "TermsProvider loads cache first, then refreshes from the API."
  },
  privacy: {
    title: "Privacy policy",
    purpose: "Show the privacy policy document.",
    apis: [
      { method: "GET", path: "/api/v1/privacy-policy", purpose: "Fetch CMS privacy content (cached on device after load)." }
    ],
    sheets: []
  },
  help: {
    title: "Help & feedback",
    purpose: "Submit a support ticket.",
    apis: [
      { method: "GET", path: "/api/v1/employee/tickets/meta", purpose: "Load ticket form metadata / categories." },
      { method: "POST", path: "/api/v1/employee/tickets", purpose: "Create a help ticket." }
    ],
    sheets: []
  },
  sent: {
    title: "Ticket sent",
    purpose: "Confirmation after a successful help ticket submit.",
    apis: [],
    sheets: [],
    notes: "No additional API — success state from the previous POST."
  },
  logout: {
    title: "Logout",
    purpose: "End the session and return to onboarding.",
    apis: [
      { method: "POST", path: "/api/v1/auth/logout", purpose: "Invalidate the server session when reachable." }
    ],
    sheets: [],
    notes: "Always clears local tokens; then GoRouter → /onboarding."
  }
};

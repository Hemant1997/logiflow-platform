import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Mock data. Replace with axiosInstance.get("/api/shipments") later. */
/* ------------------------------------------------------------------ */

const STATUS = {
  in_transit: { label: "In transit", tone: "sea" },
  delayed: { label: "Delayed", tone: "red" },
  delivered: { label: "Delivered", tone: "green" },
  pending: { label: "Awaiting pickup", tone: "slate" },
};

// Full class strings so Tailwind can detect them.
const TONE = {
  sea: { pill: "bg-[#d9eeef] text-[#11585d]", bg: "bg-[#1b7f86]", stroke: "#1b7f86" },
  red: { pill: "bg-[#f9e1de] text-[#8f2a21]", bg: "bg-[#c73a2e]", stroke: "#c73a2e" },
  green: { pill: "bg-[#dcefe4] text-[#1f6240]", bg: "bg-[#2e8b57]", stroke: "#2e8b57" },
  slate: { pill: "bg-[#e3e8ec] text-[#4a5a68]", bg: "bg-[#7b8a98]", stroke: "#7b8a98" },
  gold: { pill: "", bg: "bg-[#d49a0a]", stroke: "#d49a0a" },
};

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0b323]";
const DISPLAY = "font-['Bricolage_Grotesque','Segoe_UI',system-ui,sans-serif]";
const BODY = "font-['Instrument_Sans','Segoe_UI',system-ui,sans-serif]";

const RAW_SHIPMENTS = [
  { id: "LF-20418", from: "Ahmedabad", to: "Mumbai", carrier: "BlueLine Freight", status: "in_transit", etaH: 6, kg: 1240, progress: 68 },
  { id: "LF-20419", from: "Delhi", to: "Jaipur", carrier: "Rajdoot Cargo", status: "delivered", etaH: -3, kg: 480, progress: 100 },
  { id: "LF-20421", from: "Mumbai", to: "Bengaluru", carrier: "SouthStar Logistics", status: "delayed", etaH: 14, kg: 2650, progress: 41, reason: "Vehicle breakdown near Kolhapur", lateH: 9 },
  { id: "LF-20422", from: "Pune", to: "Hyderabad", carrier: "BlueLine Freight", status: "in_transit", etaH: 11, kg: 910, progress: 52 },
  { id: "LF-20425", from: "Surat", to: "Delhi", carrier: "Rajdoot Cargo", status: "in_transit", etaH: 22, kg: 3300, progress: 34 },
  { id: "LF-20427", from: "Bengaluru", to: "Chennai", carrier: "SouthStar Logistics", status: "delivered", etaH: -8, kg: 620, progress: 100 },
  { id: "LF-20430", from: "Kolkata", to: "Delhi", carrier: "EastWind Movers", status: "delayed", etaH: 30, kg: 1980, progress: 27, reason: "Held at state border checkpost", lateH: 5 },
  { id: "LF-20431", from: "Ahmedabad", to: "Pune", carrier: "BlueLine Freight", status: "pending", etaH: 40, kg: 760, progress: 0 },
  { id: "LF-20433", from: "Hyderabad", to: "Chennai", carrier: "SouthStar Logistics", status: "in_transit", etaH: 8, kg: 1120, progress: 74 },
  { id: "LF-20436", from: "Delhi", to: "Kolkata", carrier: "EastWind Movers", status: "in_transit", etaH: 27, kg: 2410, progress: 22 },
  { id: "LF-20438", from: "Jaipur", to: "Ahmedabad", carrier: "Rajdoot Cargo", status: "delivered", etaH: -12, kg: 540, progress: 100 },
  { id: "LF-20440", from: "Mumbai", to: "Surat", carrier: "BlueLine Freight", status: "pending", etaH: 18, kg: 330, progress: 0 },
  { id: "LF-20442", from: "Chennai", to: "Bengaluru", carrier: "SouthStar Logistics", status: "in_transit", etaH: 4, kg: 870, progress: 83 },
  { id: "LF-20445", from: "Pune", to: "Mumbai", carrier: "BlueLine Freight", status: "delivered", etaH: -1, kg: 410, progress: 100 },
];

const WEEK = [
  { d: "Mon", delivered: 31, delayed: 3 },
  { d: "Tue", delivered: 38, delayed: 2 },
  { d: "Wed", delivered: 29, delayed: 6 },
  { d: "Thu", delivered: 42, delayed: 4 },
  { d: "Fri", delivered: 47, delayed: 3 },
  { d: "Sat", delivered: 26, delayed: 1 },
  { d: "Sun", delivered: 18, delayed: 2 },
];

const CITIES = {
  Delhi: [300, 60],
  Jaipur: [228, 118],
  Ahmedabad: [158, 192],
  Surat: [170, 238],
  Mumbai: [148, 292],
  Pune: [184, 314],
  Hyderabad: [290, 322],
  Bengaluru: [262, 388],
  Chennai: [340, 372],
  Kolkata: [484, 190],
};
const HUBS = new Set(["Delhi", "Ahmedabad", "Mumbai", "Bengaluru"]);

const STEPS = [
  "Booking confirmed",
  "Picked up",
  "Left origin hub",
  "On the road",
  "Reached destination hub",
  "Delivered",
];

const NAV = [
  { label: "Overview", icon: "grid", active: true },
  { label: "Shipments", icon: "box" },
  { label: "Warehouses", icon: "building" },
  { label: "Products", icon: "tag" },
  { label: "Team", icon: "users" },
];

const TABS = [
  ["all", "All"],
  ["in_transit", "In transit"],
  ["delayed", "Delayed"],
  ["delivered", "Delivered"],
  ["pending", "Awaiting pickup"],
];

/* ------------------------------ helpers ---------------------------- */

const fmtEta = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

function readUser() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to individual keys */
  }
  return {
    fullName: localStorage.getItem("fullName") || "",
    email: localStorage.getItem("email") || "",
    role: localStorage.getItem("role") || "",
  };
}

const initials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

function reachedSteps(s) {
  if (s.status === "delivered") return STEPS.length;
  if (s.status === "pending") return 1;
  if (s.progress < 15) return 2;
  if (s.progress < 30) return 3;
  if (s.progress < 85) return 4;
  return 5;
}

// Border rules for the KPI band: 1 column on mobile, 2 on sm, 4 on lg.
const KPI_BORDER = [
  "",
  "border-t sm:border-t-0 sm:border-l",
  "border-t lg:border-t-0 lg:border-l",
  "border-t sm:border-l lg:border-t-0",
];

/* ------------------------------ small SVG -------------------------- */

const ICONS = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  box: "M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10",
  building: "M4 21V5l8-2v18M12 9l8 2v10M8 9h1M8 13h1M8 17h1M16 15h1M16 18h1",
  tag: "M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01",
  users: "M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.2a3.5 3.5 0 010 6.6",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  close: "M6 6l12 12M18 6L6 18",
  alert: "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
};

function Icon({ name }) {
  return (
    <svg
      className="h-[18px] w-[18px] shrink-0 fill-none stroke-current"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

function Sparkline({ data, tone }) {
  const w = 96;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 3 - ((v - min) / (max - min || 1)) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      className="absolute right-5 top-[18px] h-7 w-24 fill-none"
      viewBox={`0 0 ${w} ${h}`}
      stroke={TONE[tone].stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={pts} />
    </svg>
  );
}

/* ------------------------------ lane map --------------------------- */

function laneGeometry(a, b) {
  const [x1, y1] = CITIES[a];
  const [x2, y2] = CITIES[b];
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const bend = 0.16 * len;
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M${x1} ${y1} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}`;
}

function LaneMap({ shipments }) {
  const reduced = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const lanes = useMemo(() => {
    const map = new Map();
    shipments
      .filter((s) => s.status === "in_transit" || s.status === "delayed")
      .forEach((s) => {
        const key = `${s.from}>${s.to}`;
        const lane = map.get(key) || { key, from: s.from, to: s.to, count: 0, delayed: false };
        lane.count += 1;
        lane.delayed = lane.delayed || s.status === "delayed";
        map.set(key, lane);
      });
    return [...map.values()];
  }, [shipments]);

  return (
    <svg
      className="block h-auto max-h-[440px] w-full"
      viewBox="0 0 600 440"
      role="img"
      aria-label={`Map of ${lanes.length} active shipping lanes between Indian cities`}
    >
      <defs>
        <pattern id="lf-grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M30 0H0V30" fill="none" stroke="#1d3852" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="600" height="440" fill="url(#lf-grid)" />

      {lanes.map((l, i) => (
        <path
          key={l.key}
          id={`lane-${i}`}
          d={laneGeometry(l.from, l.to)}
          fill="none"
          strokeLinecap="round"
          stroke={l.delayed ? "#ff6b5c" : "#5fb7bd"}
          strokeOpacity={l.delayed ? 0.8 : 0.55}
          strokeDasharray={l.delayed ? "5 5" : undefined}
          strokeWidth={1.2 + l.count * 0.8}
        />
      ))}

      {!reduced &&
        lanes.map((l, i) => (
          <circle key={`dot-${l.key}`} r="3.6" fill={l.delayed ? "#ff6b5c" : "#f0b323"}>
            <animateMotion dur={`${7 + (i % 4)}s`} begin={`-${i * 1.3}s`} repeatCount="indefinite">
              <mpath href={`#lane-${i}`} />
            </animateMotion>
          </circle>
        ))}

      {Object.entries(CITIES).map(([name, [x, y]]) => {
        const hub = HUBS.has(name);
        return (
          <g key={name}>
            <circle
              cx={x}
              cy={y}
              r={hub ? 6 : 4}
              fill={hub ? "#f0b323" : "#0f2338"}
              stroke={hub ? "#0f2338" : "#cfdbe5"}
              strokeWidth={hub ? 2 : 1.6}
            />
            <text
              x={x + 10}
              y={y + 4}
              fontSize="12"
              fill="#e6eef4"
              stroke="#0f2338"
              strokeWidth="3"
              paintOrder="stroke"
            >
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------ charts ----------------------------- */

function WeekChart() {
  const W = 440;
  const H = 190;
  const pad = { l: 28, r: 8, t: 10, b: 24 };
  const max = 50;
  const bw = (W - pad.l - pad.r) / WEEK.length;
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);

  return (
    <svg
      className="mt-2.5 block h-auto w-full"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Deliveries per day this week, split into on time and delayed"
    >
      {[0, 25, 50].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#dde4e8" strokeWidth="1" />
          <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize="11" fill="#5a6b7a">
            {t}
          </text>
        </g>
      ))}
      {WEEK.map((d, i) => {
        const x = pad.l + i * bw + bw * 0.2;
        const w = bw * 0.6;
        const onTime = d.delivered - d.delayed;
        return (
          <g key={d.d}>
            <title>{`${d.d}: ${d.delivered} delivered, ${d.delayed} of them late`}</title>
            <rect x={x} y={y(onTime)} width={w} height={y(0) - y(onTime)} fill="#1b7f86" />
            <rect x={x} y={y(d.delivered)} width={w} height={y(onTime) - y(d.delivered)} fill="#ff6b5c" />
            <text x={x + w / 2} y={H - 7} textAnchor="middle" fontSize="11" fill="#5a6b7a">
              {d.d}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------ drawer ----------------------------- */

function Pill({ status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-block whitespace-nowrap rounded-xl px-2.5 py-0.5 text-[13px] font-medium ${TONE[s.tone].pill}`}>
      {s.label}
    </span>
  );
}

function Drawer({ shipment, onClose }) {
  const closeRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const reached = reachedSteps(shipment);

  return (
    <>
      <div className="fixed inset-0 z-20 bg-[#0f2338]/45" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Shipment ${shipment.id}`}
        className={`fixed inset-y-0 right-0 z-[21] flex w-full max-w-[400px] flex-col gap-5 overflow-y-auto bg-[#fafbfc] p-6 shadow-[-12px_0_32px_rgba(15,35,56,0.2)] transition-all duration-200 ease-out motion-reduce:transition-none ${
          shown ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`${DISPLAY} m-0 text-2xl font-bold tracking-tight`}>{shipment.id}</h2>
            <p className="mt-0.5 text-[#5a6b7a]">
              {shipment.from} to {shipment.to}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className={`grid h-[34px] w-[34px] shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-[#7f96aa]/20 ${FOCUS}`}
          >
            <Icon name="close" />
          </button>
        </div>

        <dl className="m-0 grid grid-cols-2 gap-x-5 gap-y-3.5">
          <div>
            <dt className="text-[13px] text-[#5a6b7a]">Status</dt>
            <dd className="m-0 mt-0.5 font-medium">
              <Pill status={shipment.status} />
            </dd>
          </div>
          <div>
            <dt className="text-[13px] text-[#5a6b7a]">Arrival</dt>
            <dd className="m-0 mt-0.5 font-medium">{fmtEta(shipment.eta)}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-[#5a6b7a]">Carrier</dt>
            <dd className="m-0 mt-0.5 font-medium">{shipment.carrier}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-[#5a6b7a]">Weight</dt>
            <dd className="m-0 mt-0.5 font-medium">{shipment.kg.toLocaleString("en-IN")} kg</dd>
          </div>
        </dl>

        {shipment.status === "delayed" && (
          <p className="m-0 rounded-lg bg-[#f9e1de] px-3.5 py-3 text-[#6f1f18]">
            <strong>{shipment.lateH} hours behind.</strong> {shipment.reason}.
          </p>
        )}

        <ol className="m-0 list-none p-0">
          {STEPS.map((step, i) => {
            const done = i < reached;
            const stuck = shipment.status === "delayed" && i === reached - 1;
            return (
              <li
                key={step}
                className={`relative flex items-center gap-3.5 pb-[22px] before:absolute before:left-1.5 before:-bottom-2 before:top-3.5 before:w-0.5 before:content-[''] last:pb-0 last:before:hidden ${
                  done ? "text-[#0f2338] before:bg-[#1b7f86]" : "text-[#5a6b7a] before:bg-[#d3dce1]"
                } ${stuck ? "font-semibold !text-[#c73a2e]" : ""}`}
              >
                <span
                  className={`relative h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                    stuck
                      ? "border-[#c73a2e] bg-[#c73a2e]"
                      : done
                      ? "border-[#1b7f86] bg-[#1b7f86]"
                      : "border-[#d3dce1] bg-[#fafbfc]"
                  }`}
                />
                <span>{step}</span>
              </li>
            );
          })}
        </ol>
      </aside>
    </>
  );
}

/* ------------------------------ page ------------------------------- */

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [openId, setOpenId] = useState(null);

  // Load the two Google fonts once (no CSS file needed).
  useEffect(() => {
    if (document.getElementById("lf-fonts")) return;
    const link = document.createElement("link");
    link.id = "lf-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700&family=Instrument+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  // Route guard: no token, back to login.
  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login", { replace: true });
  }, [navigate]);

  const shipments = useMemo(() => {
    const now = Date.now();
    return RAW_SHIPMENTS.map((s) => ({ ...s, eta: new Date(now + s.etaH * 3600e3) }));
  }, []);

  const counts = useMemo(() => {
    const c = { all: shipments.length, in_transit: 0, delayed: 0, delivered: 0, pending: 0 };
    shipments.forEach((s) => (c[s.status] += 1));
    return c;
  }, [shipments]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments
      .filter((s) => filter === "all" || s.status === filter)
      .filter((s) => !q || [s.id, s.from, s.to, s.carrier].some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => (sortAsc ? a.eta - b.eta : b.eta - a.eta));
  }, [shipments, filter, query, sortAsc]);

  const delayedList = shipments.filter((s) => s.status === "delayed");
  const open = shipments.find((s) => s.id === openId) || null;
  const active = counts.in_transit + counts.delayed;
  const deliveredWeek = WEEK.reduce((a, d) => a + d.delivered, 0);
  const onTimePct = Math.round(
    (WEEK.reduce((a, d) => a + d.delivered - d.delayed, 0) / deliveredWeek) * 100
  );

  const closeDrawer = () => setOpenId(null);

  const logout = () => {
    ["token", "user", "fullName", "email", "role"].forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  const firstName = (user.fullName || user.email || "there").split(/[ @]/)[0];

  const kpis = [
    { label: "Active shipments", value: active, note: `${counts.delayed} running late`, series: [9, 11, 10, 13, 12, 14, active], tone: "sea" },
    { label: "Delivered this week", value: deliveredWeek, note: "Best day was Friday", series: WEEK.map((d) => d.delivered), tone: "green" },
    { label: "On-time rate", value: `${onTimePct}%`, note: "Target is 92%", series: [88, 90, 87, 91, 90, 93, onTimePct], tone: "gold" },
    { label: "Awaiting pickup", value: counts.pending, note: "Next pickup in 2 hours", series: [4, 3, 5, 3, 2, 3, counts.pending], tone: "slate" },
  ];

  const statusMix = ["in_transit", "delayed", "delivered", "pending"].map((k) => ({
    key: k,
    ...STATUS[k],
    n: counts[k],
  }));

  const h2 = `${DISPLAY} m-0 text-lg font-bold tracking-tight`;

  return (
    <div
      className={`${BODY} grid min-h-screen bg-[#edf1f3] text-[15px] leading-[1.45] text-[#0f2338] md:grid-cols-[236px_1fr]`}
    >
      {/* ---------- sidebar ---------- */}
      <aside className="flex items-center gap-3 overflow-x-auto bg-[#0f2338] px-3.5 py-2.5 text-[#dbe5ec] md:sticky md:top-0 md:h-screen md:flex-col md:items-stretch md:gap-7 md:overflow-visible md:py-[22px]">
        <div className="flex items-center gap-2.5 md:px-2">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-[#f0b323]" aria-hidden="true">
            <svg className="h-[22px] w-[22px] fill-none stroke-[#0f2338]" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round">
              <path d="M3 17c4-8 8-8 12-3s4 3 6-1" />
              <circle cx="3" cy="17" r="1.6" fill="#0f2338" />
              <circle cx="21" cy="13" r="1.6" fill="#0f2338" />
            </svg>
          </span>
          <span className={`${DISPLAY} text-xl font-bold text-white`}>LogiFlow</span>
        </div>

        <nav className="flex gap-0.5 md:flex-col" aria-label="Main">
          {NAV.map((n) => (
            <button
              key={n.label}
              type="button"
              aria-current={n.active ? "page" : undefined}
              aria-disabled={!n.active}
              title={n.active ? undefined : "Coming soon"}
              className={`flex items-center gap-3 rounded-lg border-0 px-3 py-2.5 text-left ${FOCUS} ${
                n.active
                  ? "cursor-pointer bg-[#172f48] text-white shadow-[inset_3px_0_0_#f0b323]"
                  : "cursor-default bg-transparent text-[#9fb2c2] hover:bg-[#172f48]"
              }`}
            >
              <Icon name={n.icon} />
              <span className="hidden md:inline">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 md:ml-0 md:mt-auto md:border-t md:border-[#25405a] md:px-2 md:pt-3">
          <span
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#1b7f86] text-[13px] font-semibold text-white"
            aria-hidden="true"
          >
            {initials(user.fullName || user.email)}
          </span>
          <div className="hidden min-w-0 flex-col leading-tight md:flex">
            <strong className="truncate text-sm font-semibold text-white">{user.fullName || "Signed in"}</strong>
            <span className="truncate text-xs text-[#8ea3b4]">{user.role || user.email}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className={`ml-auto grid h-[34px] w-[34px] shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-[#7f96aa]/20 ${FOCUS}`}
          >
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      {/* ---------- main ---------- */}
      <main className="flex min-w-0 flex-col gap-[22px] px-4 pb-10 pt-5 md:px-8 md:pb-12 md:pt-7">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className={`${DISPLAY} m-0 text-2xl font-bold tracking-tight sm:text-3xl`}>
              {greeting()}, {firstName}
            </h1>
            <p className="mb-0 mt-1 text-[#5a6b7a]">
              {delayedList.length > 0
                ? `${delayedList.length} shipments need attention today.`
                : "Everything is moving on schedule."}
            </p>
          </div>
          <label className="flex h-[42px] w-full max-w-[340px] items-center gap-2 rounded-[21px] border border-[#d3dce1] bg-white px-3 text-[#5a6b7a] focus-within:border-[#1b7f86]">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Search shipment, city or carrier"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search shipments"
              className="min-w-0 flex-1 border-0 bg-transparent text-inherit text-[#0f2338] focus-visible:outline-none"
            />
          </label>
        </header>

        {/* KPI band: one panel, divided, not four cards */}
        <section
          className="grid grid-cols-1 rounded-[14px] border border-[#d3dce1] bg-[#fafbfc] sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Key numbers"
        >
          {kpis.map((k, i) => (
            <div key={k.label} className={`relative flex flex-col border-[#d3dce1] px-[22px] pb-4 pt-[18px] ${KPI_BORDER[i]}`}>
              <span className="text-sm text-[#5a6b7a]">{k.label}</span>
              <span className={`${DISPLAY} mt-1 text-[40px] font-bold leading-[1.1] tabular-nums`}>{k.value}</span>
              <span className="text-[13px] text-[#5a6b7a]">{k.note}</span>
              <Sparkline data={k.series} tone={k.tone} />
            </div>
          ))}
        </section>

        {/* Lane map + attention list */}
        <section className="grid gap-[18px] lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <div className="overflow-hidden rounded-[18px] bg-[#0f2338] px-5 pb-2.5 pt-[18px] text-[#cfdbe5]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={`${h2} text-white`}>Live lanes</h2>
              <span className="flex items-center gap-2 text-[13px] text-[#9fb2c2]">
                <i className="inline-block h-[9px] w-[9px] rounded-full bg-[#f0b323]" /> On schedule
                <i className="ml-2.5 inline-block h-[9px] w-[9px] rounded-full bg-[#ff6b5c]" /> Delayed
              </span>
            </div>
            <LaneMap shipments={shipments} />
          </div>

          <div className="flex flex-col rounded-[6px_18px_6px_18px] border border-[#d3dce1] bg-[#fafbfc] px-2 pb-2.5 pt-[18px]">
            <h2 className={`${h2} px-3 pb-2`}>Needs attention</h2>
            {delayedList.length === 0 ? (
              <p className="m-0 p-3 text-[#5a6b7a]">No late shipments. New delays will show up here.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {delayedList.map((s) => (
                  <li key={s.id} className="border-[#d3dce1] [&+li]:border-t">
                    <button
                      type="button"
                      onClick={() => setOpenId(s.id)}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border-0 bg-transparent p-3 text-left hover:bg-[#eef2f4] ${FOCUS}`}
                    >
                      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-[#f9e1de] text-[#c73a2e]">
                        <Icon name="alert" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col text-sm">
                        <strong>
                          {s.id}: {s.from} to {s.to}
                        </strong>
                        <span className="text-[#5a6b7a]">{s.reason}</span>
                      </span>
                      <span className="whitespace-nowrap text-[13px] font-semibold tabular-nums text-[#c73a2e]">
                        {s.lateH}h late
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Table + charts */}
        <section className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
          <div className="rounded-[14px] border border-[#d3dce1] bg-[#fafbfc] pb-1.5 pt-[18px]">
            <div className="flex flex-col gap-3 px-5 pb-3">
              <h2 className={h2}>Shipments</h2>
              <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
                {TABS.map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={filter === k}
                    onClick={() => setFilter(k)}
                    className={`cursor-pointer rounded-2xl border border-transparent px-3 py-1.5 ${FOCUS} ${
                      filter === k ? "bg-[#0f2338] text-white" : "bg-transparent text-[#5a6b7a] hover:bg-[#eaeff2]"
                    }`}
                  >
                    {label} <em className="ml-1 text-xs not-italic tabular-nums">{counts[k]}</em>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    {["Shipment", "Route", "Carrier", "Status", "Arrival", "Progress"].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap border-y border-[#d3dce1] bg-[#f2f5f7] px-5 py-2 text-left text-[13px] font-medium text-[#5a6b7a]"
                      >
                        {h === "Arrival" ? (
                          <button
                            type="button"
                            onClick={() => setSortAsc((v) => !v)}
                            className={`cursor-pointer border-0 bg-transparent p-0 text-[13px] font-medium text-[#0f2338] ${FOCUS}`}
                          >
                            Arrival {sortAsc ? "\u2191" : "\u2193"}
                          </button>
                        ) : (
                          h
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => (
                    <tr key={s.id} onClick={() => setOpenId(s.id)} className="cursor-pointer hover:bg-[#f0f4f6]">
                      <td className="border-b border-[#e4eaee] px-5 py-3">
                        <button
                          type="button"
                          onClick={() => setOpenId(s.id)}
                          className={`cursor-pointer border-0 bg-transparent p-0 font-semibold tabular-nums hover:underline ${FOCUS}`}
                        >
                          {s.id}
                        </button>
                      </td>
                      <td className="border-b border-[#e4eaee] px-5 py-3">
                        {s.from} to {s.to}
                      </td>
                      <td className="border-b border-[#e4eaee] px-5 py-3 text-[#5a6b7a]">{s.carrier}</td>
                      <td className="border-b border-[#e4eaee] px-5 py-3">
                        <Pill status={s.status} />
                      </td>
                      <td className="whitespace-nowrap border-b border-[#e4eaee] px-5 py-3 tabular-nums">{fmtEta(s.eta)}</td>
                      <td className="border-b border-[#e4eaee] px-5 py-3">
                        <span
                          className="block h-1.5 w-24 overflow-hidden rounded-[3px] bg-[#dfe6ea]"
                          role="img"
                          aria-label={`${s.progress}% of the route done`}
                        >
                          <span
                            className={`block h-full rounded-[3px] ${TONE[STATUS[s.status].tone].bg}`}
                            style={{ width: `${s.progress}%` }}
                          />
                        </span>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-7 text-center text-[#5a6b7a]">
                        No shipments match. Clear the search or pick another status.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-[18px]">
            <div className="rounded-[14px] border border-[#d3dce1] bg-[#fafbfc] px-5 py-[18px]">
              <h2 className={h2}>Deliveries this week</h2>
              <WeekChart />
              <p className="mb-0 mt-1.5 text-[13px] text-[#5a6b7a]">
                <i className="mr-0.5 inline-block h-[9px] w-[9px] rounded-full bg-[#1b7f86]" /> On time
                <i className="ml-2.5 mr-0.5 inline-block h-[9px] w-[9px] rounded-full bg-[#ff6b5c]" /> Late
              </p>
            </div>

            <div className="rounded-[14px] border border-[#d3dce1] bg-[#fafbfc] px-5 py-[18px]">
              <h2 className={h2}>Where shipments stand</h2>
              <div className="my-3.5 flex h-3.5 gap-[3px]" role="img" aria-label="Share of shipments by status">
                {statusMix.map((m) => (
                  <span
                    key={m.key}
                    title={`${m.label}: ${m.n}`}
                    className={`min-w-[6px] basis-0 rounded-[3px] ${TONE[m.tone].bg}`}
                    style={{ flexGrow: m.n }}
                  />
                ))}
              </div>
              <ul className="m-0 list-none p-0">
                {statusMix.map((m) => (
                  <li key={m.key} className="flex items-center gap-2 border-b border-[#e4eaee] py-1.5 last:border-b-0">
                    <i className={`inline-block h-[9px] w-[9px] rounded-full ${TONE[m.tone].bg}`} />
                    {m.label}
                    <strong className="ml-auto tabular-nums">{m.n}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {open && <Drawer key={open.id} shipment={open} onClose={closeDrawer} />}
    </div>
  );
}

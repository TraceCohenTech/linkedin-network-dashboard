"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import data from "./data.json";
import allContacts from "./contacts.json";

// ─── Types ─────────────────────────────────────────────────────────────────

type Contact = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  category: string;
  connectedOn: string;
  messages: number;
  lastMessageDate: string | null;
  linkedinUrl: string;
};

type View = "dashboard" | "contacts" | "analytics" | string; // string covers smart list IDs

type Stage = "" | "prospect" | "reached-out" | "in-talks" | "deal" | "pass";

const STAGE_LABELS: Record<Stage, string> = {
  "":            "No stage",
  "prospect":    "Prospect",
  "reached-out": "Reached Out",
  "in-talks":    "In Talks",
  "deal":        "Deal / Partner",
  "pass":        "Pass",
};

const STAGE_COLORS: Record<Stage, string> = {
  "":            "#3f3f46",
  "prospect":    "#3b82f6",
  "reached-out": "#f59e0b",
  "in-talks":    "#8b5cf6",
  "deal":        "#10b981",
  "pass":        "#6b7280",
};

// ─── Constants ──────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  "Founder/CEO": "#3b82f6",
  "Executive":   "#8b5cf6",
  "Investor/VC": "#10b981",
  "Healthcare":  "#f59e0b",
  "Director/VP": "#ef4444",
  "Sales/BD":    "#06b6d4",
  "Marketing":   "#f97316",
  "Other":       "#6b7280",
};

const PIE_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#f97316","#6b7280"];

const contacts = allContacts as Contact[];

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(mo) - 1]} '${y.slice(2)}`;
}

function parseConnectedDate(d: string): Date | null {
  if (!d) return null;
  const parts = d.split(" ");
  if (parts.length !== 3) return null;
  try { return new Date(`${parts[1]} ${parts[0]} ${parts[2]}`); }
  catch { return null; }
}

// ─── Smart List Definitions ──────────────────────────────────────────────────

type SmartList = {
  id: string;
  label: string;
  icon: string;
  sub: string;
  color: string;
  description: string;
  filter: (c: Contact) => boolean;
};

const SMART_LISTS: SmartList[] = [
  {
    id: "b2b-prospects",
    label: "B2B Prospects",
    icon: "🏥",
    sub: "PeelAways buyers",
    color: "#f59e0b",
    description: "Healthcare, senior care & caregiving professionals — potential PeelAways customers, distributors, and partners.",
    filter: (c) =>
      c.category === "Healthcare" ||
      /nursing|hospital|senior living|assisted living|home care|hospice|memory care|skilled nursing|homecare|caregiv|long.?term care|home health|elder|geriatric|palliative|rehab|residential care/i.test(c.position + " " + c.company),
  },
  {
    id: "investors",
    label: "Investors",
    icon: "💰",
    sub: "VCs, angels & funds",
    color: "#10b981",
    description: "Investors, venture capitalists, angels, and fund managers who could fund PeelAways.",
    filter: (c) =>
      c.category === "Investor/VC" ||
      /\bvc\b|venture|angel investor|angel fund|family office|\bfund\b|limited partner|general partner|managing partner|investment|private equity|seed fund|early stage fund/i.test(c.position + " " + c.company),
  },
  {
    id: "founders-to-engage",
    label: "Founders to Engage",
    icon: "🤝",
    sub: "Untouched Founders/CEOs",
    color: "#3b82f6",
    description: "Fellow founders and CEOs you're connected to but have never messaged — potential partners, advisors, or intros.",
    filter: (c) => c.category === "Founder/CEO" && c.messages < 2,
  },
  {
    id: "re-engage",
    label: "Re-engage",
    icon: "🔄",
    sub: "Went cold after conversation",
    color: "#ef4444",
    description: "Contacts you've had real conversations with (3+ messages) but who have gone quiet since mid-2025.",
    filter: (c) =>
      c.messages >= 3 &&
      c.lastMessageDate !== null &&
      c.lastMessageDate < "2025-06-01",
  },
  {
    id: "new-no-followup",
    label: "New + No Follow-up",
    icon: "⚡",
    sub: "Connected Jul–Jan, no message",
    color: "#8b5cf6",
    description: "People you connected with in the last 6 months but have never messaged — the warm window is still open.",
    filter: (c) => {
      const dt = parseConnectedDate(c.connectedOn);
      return !!dt && dt >= new Date("2025-07-01") && c.messages === 0;
    },
  },
  {
    id: "decision-makers",
    label: "Decision Makers",
    icon: "👔",
    sub: "C-suite, never messaged",
    color: "#06b6d4",
    description: "C-suite executives and Presidents you've never messaged — high-value cold outreach targets.",
    filter: (c) =>
      c.messages === 0 &&
      /\bceo\b|chief executive|chief operating|chief marketing|chief financial|coo\b|cmo\b|cfo\b|president\b|svp\b|evp\b/i.test(c.position),
  },
];

const PAGE_SIZE = 50;

// ─── Contact Detail Panel ────────────────────────────────────────────────────

function ContactPanel({
  contact,
  onClose,
  stage,
  note,
  onStageChange,
  onNoteChange,
}: {
  contact: Contact;
  onClose: () => void;
  stage: Stage;
  note: string;
  onStageChange: (s: Stage) => void;
  onNoteChange: (n: string) => void;
}) {
  const initials = `${contact.firstName[0] || ""}${contact.lastName[0] || ""}`;
  const color = CAT_COLORS[contact.category] || "#6b7280";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="w-96 bg-[#18181b] border-l border-[#27272a] flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: color }}>
              {initials}
            </div>
            <div>
              <div className="text-base font-bold text-[#fafafa]">{contact.name}</div>
              <div className="text-xs text-[#71717a] mt-0.5">{contact.position || "—"}</div>
              <div className="text-xs text-[#a1a1aa] mt-0.5 font-medium">{contact.company || "—"}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#52525b] hover:text-[#a1a1aa] text-lg leading-none mt-0.5">✕</button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#09090b] rounded-lg p-3">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Category</div>
              <div className="text-xs font-semibold" style={{ color }}>{contact.category}</div>
            </div>
            <div className="bg-[#09090b] rounded-lg p-3">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Connected</div>
              <div className="text-xs font-semibold text-[#a1a1aa]">{contact.connectedOn || "—"}</div>
            </div>
            <div className="bg-[#09090b] rounded-lg p-3">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Messages</div>
              <div className="text-sm font-bold" style={{ color: contact.messages > 0 ? "#3b82f6" : "#3f3f46" }}>
                {contact.messages > 0 ? contact.messages : "None"}
              </div>
            </div>
            <div className="bg-[#09090b] rounded-lg p-3">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Last Message</div>
              <div className="text-xs font-semibold text-[#a1a1aa]">{contact.lastMessageDate || "—"}</div>
            </div>
          </div>

          {/* Pipeline stage */}
          <div>
            <div className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-2">Pipeline Stage</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.entries(STAGE_LABELS) as [Stage, string][]).filter(([k]) => k !== "").map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => onStageChange(stage === key ? "" : key)}
                  className="px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors border"
                  style={{
                    background: stage === key ? `${STAGE_COLORS[key]}20` : "transparent",
                    color: stage === key ? STAGE_COLORS[key] : "#52525b",
                    borderColor: stage === key ? STAGE_COLORS[key] : "#27272a",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-2">Notes</div>
            <textarea
              value={note}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="Add context, talking points, follow-up reminders..."
              rows={5}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-xs text-[#d4d4d8] placeholder-[#3f3f46] focus:outline-none focus:border-[#3b82f6] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {contact.linkedinUrl && (
              <a href={contact.linkedinUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#0a66c2] hover:bg-[#0052a0] text-white text-xs font-semibold transition-colors">
                <span>↗</span> Open LinkedIn Profile
              </a>
            )}
            <a href={`https://www.linkedin.com/messaging/compose?recipient=${contact.linkedinUrl?.split('/in/')[1]?.replace('/', '')}`}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#27272a] hover:border-[#3b82f6] text-[#a1a1aa] hover:text-[#3b82f6] text-xs font-semibold transition-colors">
              <span>✉</span> Message on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contacts Table (reused across views) ────────────────────────────────────

function ContactsTable({
  list,
  pipeline,
  onSelect,
  emptyMessage,
}: {
  list: Contact[];
  pipeline: Record<number, Stage>;
  onSelect: (c: Contact) => void;
  emptyMessage?: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const pageData = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (list.length === 0) return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-12 text-center text-[#52525b] text-sm">
      {emptyMessage || "No contacts found."}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#27272a]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider hidden md:table-cell">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider hidden lg:table-cell">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider">Msgs</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider hidden md:table-cell">Connected</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((c) => {
              const stage = pipeline[c.id] || "";
              return (
                <tr key={c.id}
                  onClick={() => onSelect(c)}
                  className="border-b border-[#27272a]/50 hover:bg-[#27272a]/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: CAT_COLORS[c.category] || "#6b7280" }}>
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-[#fafafa] text-sm">{c.name}</div>
                        <div className="text-[10px] text-[#52525b] md:hidden">{c.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#a1a1aa] text-xs hidden md:table-cell max-w-[140px] truncate">{c.company || "—"}</td>
                  <td className="px-4 py-3 text-[#71717a] text-xs hidden lg:table-cell max-w-[180px] truncate">{c.position || "—"}</td>
                  <td className="px-4 py-3">
                    {stage ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: `${STAGE_COLORS[stage]}20`, color: STAGE_COLORS[stage] }}>
                        {STAGE_LABELS[stage]}
                      </span>
                    ) : (
                      <span className="text-[#3f3f46] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.messages > 0
                      ? <span className="text-[#3b82f6] font-semibold text-sm">{c.messages}</span>
                      : <span className="text-[#3f3f46] text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#52525b] text-xs hidden md:table-cell">{c.connectedOn || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#52525b]">
          <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, list.length)} of {list.length.toLocaleString()}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-[#27272a] hover:border-[#3f3f46] disabled:opacity-30 transition-colors text-[#71717a]">
              ← Prev
            </button>
            <span className="px-3 py-1.5 text-[#3f3f46]">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-[#27272a] hover:border-[#3f3f46] disabled:opacity-30 transition-colors text-[#71717a]">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Smart List View ─────────────────────────────────────────────────────────

function SmartListView({
  list: smartList,
  pipeline,
  onSelect,
}: {
  list: SmartList;
  pipeline: Record<number, Stage>;
  onSelect: (c: Contact) => void;
}) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");

  const filtered = useMemo(() => {
    let list = contacts.filter(smartList.filter);
    if (stageFilter !== "all") {
      list = list.filter(c => (pipeline[c.id] || "") === stageFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q)
      );
    }
    return list;
  }, [smartList, search, stageFilter, pipeline]);

  const stageCounts = useMemo(() => {
    const base = contacts.filter(smartList.filter);
    const counts: Record<string, number> = { all: base.length };
    base.forEach(c => {
      const s = pipeline[c.id] || "";
      if (s) counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [smartList, pipeline]);

  return (
    <div className="space-y-5">
      {/* List header */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="text-3xl">{smartList.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-[#fafafa]">{smartList.label}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: `${smartList.color}20`, color: smartList.color }}>
                {stageCounts.all} contacts
              </span>
            </div>
            <p className="text-sm text-[#71717a] mt-1">{smartList.description}</p>
          </div>
        </div>

        {/* Stage pipeline mini-view */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {([["all", "All"], ...Object.entries(STAGE_LABELS).filter(([k]) => k !== "")] as [string, string][]).map(([key, label]) => {
            const count = stageCounts[key] || 0;
            if (key !== "all" && count === 0) return null;
            return (
              <button key={key}
                onClick={() => setStageFilter(key as Stage | "all")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                style={{
                  background: stageFilter === key ? `${key === "all" ? smartList.color : STAGE_COLORS[key as Stage]}20` : "transparent",
                  color: stageFilter === key ? (key === "all" ? smartList.color : STAGE_COLORS[key as Stage]) : "#52525b",
                  borderColor: stageFilter === key ? (key === "all" ? smartList.color : STAGE_COLORS[key as Stage]) : "#27272a",
                }}>
                {label}
                <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={`Search within ${smartList.label}...`}
        className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#fafafa] placeholder-[#3f3f46] focus:outline-none focus:border-[#3b82f6]"
      />

      <ContactsTable list={filtered} pipeline={pipeline} onSelect={onSelect} emptyMessage="No contacts match this filter." />
    </div>
  );
}

// ─── All Contacts View ────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Founder/CEO", "Executive", "Investor/VC", "Healthcare", "Director/VP", "Sales/BD", "Marketing", "Other"];

function ContactsView({
  pipeline,
  onSelect,
}: {
  pipeline: Record<number, Stage>;
  onSelect: (c: Contact) => void;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [msgFilter, setMsgFilter] = useState<"all" | "messaged" | "never">("all");

  const filtered = useMemo(() => {
    let list = contacts;
    if (catFilter !== "All") list = list.filter(c => c.category === catFilter);
    if (msgFilter === "messaged") list = list.filter(c => c.messages > 0);
    if (msgFilter === "never") list = list.filter(c => c.messages === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, catFilter, msgFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, company, title..."
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#fafafa] placeholder-[#3f3f46] focus:outline-none focus:border-[#3b82f6] w-64" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#fafafa] focus:outline-none focus:border-[#3b82f6]">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex rounded-lg border border-[#27272a] overflow-hidden">
          {(["all", "messaged", "never"] as const).map(v => (
            <button key={v} onClick={() => setMsgFilter(v)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${msgFilter === v ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-[#52525b] hover:text-[#a1a1aa]"}`}>
              {v === "all" ? "All" : v === "messaged" ? "Messaged" : "Never messaged"}
            </button>
          ))}
        </div>
        <div className="text-xs text-[#3f3f46]">{filtered.length.toLocaleString()} contacts</div>
      </div>
      <ContactsTable list={filtered} pipeline={pipeline} onSelect={onSelect} />
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({
  pipeline,
  onNavigate,
}: {
  pipeline: Record<number, Stage>;
  onNavigate: (v: View) => void;
}) {
  const last24 = data.monthly_growth.slice(-24);
  const stageStats = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(pipeline).forEach(s => { if (s) counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, [pipeline]);

  const totalTagged = Object.keys(pipeline).filter(k => pipeline[parseInt(k)]).length;

  return (
    <div className="space-y-5">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
          <div className="text-xs text-[#52525b] uppercase tracking-wider mb-2">Total Network</div>
          <div className="text-3xl font-bold text-[#3b82f6]">{data.stats.total_connections.toLocaleString()}</div>
          <div className="text-xs text-[#3f3f46] mt-1">as of Jan 2026</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
          <div className="text-xs text-[#52525b] uppercase tracking-wider mb-2">Untapped Leads</div>
          <div className="text-3xl font-bold text-[#f59e0b]">{(data.stats.total_connections - 1681).toLocaleString()}</div>
          <div className="text-xs text-[#3f3f46] mt-1">never messaged</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
          <div className="text-xs text-[#52525b] uppercase tracking-wider mb-2">Active Conversations</div>
          <div className="text-3xl font-bold text-[#10b981]">1,681</div>
          <div className="text-xs text-[#3f3f46] mt-1">have message history</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
          <div className="text-xs text-[#52525b] uppercase tracking-wider mb-2">In Pipeline</div>
          <div className="text-3xl font-bold text-[#8b5cf6]">{totalTagged}</div>
          <div className="text-xs text-[#3f3f46] mt-1">contacts tagged</div>
        </div>
      </div>

      {/* Smart lists quick-access */}
      <div>
        <div className="text-xs font-semibold text-[#3f3f46] uppercase tracking-widest mb-3">Smart Lists</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {SMART_LISTS.map(sl => {
            const count = contacts.filter(sl.filter).length;
            const staged = contacts.filter(sl.filter).filter(c => pipeline[c.id]).length;
            return (
              <button key={sl.id} onClick={() => onNavigate(sl.id)}
                className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-left hover:border-[#3f3f46] transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl">{sl.icon}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${sl.color}20`, color: sl.color }}>
                    {count}
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#fafafa] group-hover:text-white">{sl.label}</div>
                <div className="text-xs text-[#52525b] mt-0.5">{sl.sub}</div>
                {staged > 0 && (
                  <div className="text-[10px] text-[#3b82f6] mt-2">{staged} in pipeline →</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pipeline breakdown */}
      {totalTagged > 0 && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-4">Your Pipeline</div>
          <div className="grid grid-cols-5 gap-2">
            {(["prospect","reached-out","in-talks","deal","pass"] as Stage[]).map(stage => (
              <div key={stage} className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: STAGE_COLORS[stage] }}>
                  {stageStats[stage] || 0}
                </div>
                <div className="text-[10px] text-[#52525b]">{STAGE_LABELS[stage]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Network Growth</div>
          <div className="text-xs text-[#52525b] mb-4">Last 24 months</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={last24}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: "#52525b" }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#52525b" }} tickFormatter={(v: number) => v.toLocaleString()} />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString(), "Total"]}
                labelFormatter={(m) => fmtMonth(String(m))}
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#a1a1aa" }} itemStyle={{ color: "#3b82f6" }}
              />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Network Mix</div>
          <div className="text-xs text-[#52525b] mb-3">By role</div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={data.position_categories} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                {data.position_categories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} itemStyle={{ color: "#a1a1aa" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {data.position_categories.slice(0, 5).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-[#71717a]">{cat.name}</span>
                </div>
                <span className="text-[#a1a1aa] font-medium">{cat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────

function AnalyticsView() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Connections by Year</div>
          <div className="text-xs text-[#52525b] mb-4">2011–2026</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#52525b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#52525b" }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "#a1a1aa" }} labelStyle={{ color: "#a1a1aa" }} />
              <Bar dataKey="connections" fill="#3b82f6" radius={[3, 3, 0, 0]} name="New" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Network Composition</div>
          <div className="text-xs text-[#52525b] mb-3">4,888 connections by role</div>
          <div className="flex items-center gap-3">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={data.position_categories} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={38}>
                  {data.position_categories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} itemStyle={{ color: "#a1a1aa" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {data.position_categories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-[#71717a]">{cat.name}</span>
                  </div>
                  <span className="font-medium text-[#d4d4d8]">{cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
        <div className="text-sm font-semibold text-[#fafafa] mb-1">Messaging Activity</div>
        <div className="text-xs text-[#52525b] mb-4">Sent vs. received — last 24 months</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.messages_data.slice(-24)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: "#52525b" }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: "#52525b" }} />
            <Tooltip labelFormatter={(m) => fmtMonth(String(m))} contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#a1a1aa" }} />
            <Bar dataKey="sent" stackId="a" fill="#3b82f6" name="Sent" />
            <Bar dataKey="received" stackId="a" fill="#1d4ed8" radius={[3, 3, 0, 0]} name="Received" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
        <div className="text-sm font-semibold text-[#fafafa] mb-1">Top Skills by Endorsements</div>
        <div className="text-xs text-[#52525b] mb-4">191 total</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.skills_data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#52525b" }} />
            <YAxis dataKey="skill" type="category" tick={{ fontSize: 10, fill: "#a1a1aa" }} width={130} />
            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "#a1a1aa" }} labelStyle={{ color: "#a1a1aa" }} />
            <Bar dataKey="endorsements" fill="#8b5cf6" radius={[0, 3, 3, 0]} name="Endorsements" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

const NAV_MAIN = [
  { view: "dashboard", label: "Dashboard", icon: "⬡" },
  { view: "contacts",  label: "All Contacts", icon: "◎" },
  { view: "analytics", label: "Analytics",   icon: "◰" },
];

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [pipeline, setPipeline] = useState<Record<number, Stage>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    try {
      const p = localStorage.getItem("crm_pipeline");
      const n = localStorage.getItem("crm_notes");
      if (p) setPipeline(JSON.parse(p));
      if (n) setNotes(JSON.parse(n));
    } catch { /* ignore */ }
  }, []);

  const updateStage = useCallback((id: number, stage: Stage) => {
    setPipeline(prev => {
      const next = { ...prev, [id]: stage };
      if (!stage) delete next[id];
      localStorage.setItem("crm_pipeline", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateNote = useCallback((id: number, note: string) => {
    setNotes(prev => {
      const next = { ...prev, [id]: note };
      if (!note) delete next[id];
      localStorage.setItem("crm_notes", JSON.stringify(next));
      return next;
    });
  }, []);

  const activeSmartList = SMART_LISTS.find(sl => sl.id === view);

  const viewTitle = activeSmartList
    ? activeSmartList.label
    : view === "dashboard" ? "Dashboard"
    : view === "contacts" ? "All Contacts"
    : "Analytics";

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-[#18181b] border-r border-[#27272a] flex flex-col z-40 overflow-y-auto">
        <div className="p-5 border-b border-[#27272a] flex-shrink-0">
          <div className="text-sm font-bold tracking-tight text-[#fafafa]">Maxwell Cohen</div>
          <div className="text-xs text-[#52525b] mt-0.5">Network CRM</div>
        </div>

        <nav className="py-3 flex-1">
          <div className="px-3 mb-1">
            <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-widest px-3 mb-1">Workspace</div>
          </div>
          {NAV_MAIN.map(item => (
            <button key={item.view} onClick={() => setView(item.view)}
              className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors text-left ${
                view === item.view
                  ? "bg-[#3b82f6]/10 text-[#3b82f6] border-r-2 border-[#3b82f6]"
                  : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50"
              }`}>
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <div className="px-3 mt-4 mb-1">
            <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-widest px-3 mb-1">Sales Lists</div>
          </div>
          {SMART_LISTS.map(sl => {
            const count = contacts.filter(sl.filter).length;
            return (
              <button key={sl.id} onClick={() => setView(sl.id)}
                className={`w-full flex items-center gap-3 px-6 py-2 text-sm transition-colors text-left ${
                  view === sl.id
                    ? "bg-[#3b82f6]/10 text-[#3b82f6] border-r-2 border-[#3b82f6]"
                    : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50"
                }`}>
                <span className="text-sm">{sl.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{sl.label}</div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${sl.color}20`, color: sl.color }}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#27272a] flex-shrink-0">
          <div className="text-[10px] text-[#3f3f46]">Data: Jan 2026 · Pipeline saved locally</div>
          <div className="flex gap-3 mt-2">
            <a href="https://x.com/Trace_Cohen" target="_blank" rel="noreferrer" className="text-[10px] text-[#3f3f46] hover:text-[#3b82f6]">Twitter</a>
            <a href="mailto:t@nyvp.com" className="text-[10px] text-[#3f3f46] hover:text-[#3b82f6]">Email</a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 min-h-screen">
        <header className="sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur border-b border-[#27272a] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#fafafa]">{viewTitle}</h1>
              {activeSmartList && (
                <p className="text-xs text-[#52525b] mt-0.5">{activeSmartList.sub}</p>
              )}
            </div>
            <div className="text-xs text-[#3f3f46]">{data.stats.total_connections.toLocaleString()} connections</div>
          </div>
        </header>

        <div className="p-8">
          {view === "dashboard" && <DashboardView pipeline={pipeline} onNavigate={setView} />}
          {view === "contacts"  && <ContactsView pipeline={pipeline} onSelect={setSelected} />}
          {view === "analytics" && <AnalyticsView />}
          {activeSmartList && (
            <SmartListView list={activeSmartList} pipeline={pipeline} onSelect={setSelected} />
          )}
        </div>
      </main>

      {/* Contact detail panel */}
      {selected && (
        <ContactPanel
          contact={selected}
          onClose={() => setSelected(null)}
          stage={pipeline[selected.id] || ""}
          note={notes[selected.id] || ""}
          onStageChange={(s) => updateStage(selected.id, s)}
          onNoteChange={(n) => updateNote(selected.id, n)}
        />
      )}
    </div>
  );
}

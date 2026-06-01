"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import data from "./data.json";
import allContacts from "./contacts.json";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type View = "dashboard" | "contacts" | "analytics" | "hotlist";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Founder/CEO", "Executive", "Investor/VC", "Healthcare", "Director/VP", "Sales/BD", "Marketing", "Other"];

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
      <div className="text-xs text-[#71717a] font-medium uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-bold" style={{ color: accent || "#fafafa" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div className="text-xs text-[#52525b] mt-1">{sub}</div>}
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView() {
  const last24 = data.monthly_growth.slice(-24);
  const last24msgs = data.messages_data.slice(-24);
  const hotContacts = contacts.filter(c => c.messages > 0).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Connections" value={data.stats.total_connections} sub="as of Jan 2026" accent="#3b82f6" />
        <KpiCard label="Messages Sent" value={data.stats.messages_sent} sub={`of ${data.stats.total_messages.toLocaleString()} total`} />
        <KpiCard label="Active Relationships" value={1681} sub="have message history" accent="#10b981" />
        <KpiCard label="Invites Sent" value={data.stats.invites_outgoing} sub="88% of all invitations" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Network growth */}
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Network Growth</div>
          <div className="text-xs text-[#71717a] mb-4">Cumulative connections — last 24 months</div>
          <ResponsiveContainer width="100%" height={200}>
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
                labelStyle={{ color: "#a1a1aa" }}
                itemStyle={{ color: "#3b82f6" }}
              />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Network composition */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Network Mix</div>
          <div className="text-xs text-[#71717a] mb-3">By role category</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={data.position_categories} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                {data.position_categories.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} itemStyle={{ color: "#a1a1aa" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {data.position_categories.slice(0, 5).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-[#a1a1aa]">{cat.name}</span>
                </div>
                <span className="text-[#fafafa] font-medium">{cat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages + Hot contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Messaging Activity</div>
          <div className="text-xs text-[#71717a] mb-4">Sent vs. received — last 24 months</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last24msgs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: "#52525b" }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#52525b" }} />
              <Tooltip
                labelFormatter={(m) => fmtMonth(String(m))}
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#71717a" }} />
              <Bar dataKey="sent" stackId="a" fill="#3b82f6" name="Sent" />
              <Bar dataKey="received" stackId="a" fill="#1d4ed8" radius={[3, 3, 0, 0]} name="Received" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Most Active</div>
          <div className="text-xs text-[#71717a] mb-3">Top messaging contacts</div>
          <div className="space-y-3">
            {hotContacts.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}>
                  {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#fafafa] truncate">{c.name}</div>
                  <div className="text-[10px] text-[#52525b] truncate">{c.company || c.position}</div>
                </div>
                <div className="text-xs font-bold text-[#3b82f6]">{c.messages}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top companies */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
        <div className="text-sm font-semibold text-[#fafafa] mb-1">Top Companies in Network</div>
        <div className="text-xs text-[#71717a] mb-4">Connections by company</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {data.top_companies.slice(0, 12).map((co, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 text-xs text-[#52525b] text-right shrink-0">{i + 1}</div>
              <div className="flex-1">
                <div className="text-xs text-[#d4d4d8] font-medium truncate">{co.company}</div>
                <div className="mt-1 h-1 rounded-full bg-[#27272a] overflow-hidden">
                  <div className="h-full rounded-full bg-[#3b82f6]"
                    style={{ width: `${(co.count / data.top_companies[0].count) * 100}%` }} />
                </div>
              </div>
              <div className="text-xs font-bold text-[#fafafa] w-5 text-right">{co.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Contacts View ────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function ContactsView() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "company" | "messages" | "connectedOn">("messages");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let list = contacts;
    if (catFilter !== "All") list = list.filter(c => c.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let av: string | number = "", bv: string | number = "";
      if (sortBy === "name") { av = a.name; bv = b.name; }
      else if (sortBy === "company") { av = a.company; bv = b.company; }
      else if (sortBy === "messages") { av = a.messages; bv = b.messages; }
      else if (sortBy === "connectedOn") {
        av = a.connectedOn ? new Date(a.connectedOn.split(" ").reverse().join(" ")).getTime() : 0;
        bv = b.connectedOn ? new Date(b.connectedOn.split(" ").reverse().join(" ")).getTime() : 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [search, catFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
    setPage(0);
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <span className="ml-1 opacity-50">
      {sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search name, company, role..."
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-[#3b82f6] w-64"
        />
        <select
          value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(0); }}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#fafafa] focus:outline-none focus:border-[#3b82f6]"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="text-xs text-[#52525b]">
          {filtered.length.toLocaleString()} contacts
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#27272a] text-left">
              <th className="px-4 py-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider cursor-pointer hover:text-[#a1a1aa]"
                onClick={() => toggleSort("name")}>Name <SortIcon col="name" /></th>
              <th className="px-4 py-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider cursor-pointer hover:text-[#a1a1aa] hidden md:table-cell"
                onClick={() => toggleSort("company")}>Company <SortIcon col="company" /></th>
              <th className="px-4 py-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider hidden lg:table-cell">Role</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider hidden lg:table-cell">Category</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider cursor-pointer hover:text-[#a1a1aa]"
                onClick={() => toggleSort("messages")}>Msgs <SortIcon col="messages" /></th>
              <th className="px-4 py-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider cursor-pointer hover:text-[#a1a1aa] hidden md:table-cell"
                onClick={() => toggleSort("connectedOn")}>Connected <SortIcon col="connectedOn" /></th>
              <th className="px-4 py-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider hidden lg:table-cell">LinkedIn</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((c, i) => (
              <tr key={c.id}
                className={`border-b border-[#27272a]/50 hover:bg-[#27272a]/30 transition-colors ${i % 2 === 0 ? "" : "bg-[#18181b]/50"}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: CAT_COLORS[c.category] || "#6b7280" }}>
                      {c.firstName[0]}{c.lastName[0]}
                    </div>
                    <span className="font-medium text-[#fafafa]">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#a1a1aa] hidden md:table-cell">{c.company || "—"}</td>
                <td className="px-4 py-3 text-[#71717a] text-xs hidden lg:table-cell max-w-[180px] truncate">{c.position || "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: `${CAT_COLORS[c.category]}20`, color: CAT_COLORS[c.category] }}>
                    {c.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.messages > 0 ? (
                    <span className="text-[#3b82f6] font-semibold">{c.messages}</span>
                  ) : (
                    <span className="text-[#3f3f46]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#71717a] text-xs hidden md:table-cell">{c.connectedOn || "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {c.linkedinUrl ? (
                    <a href={c.linkedinUrl} target="_blank" rel="noreferrer"
                      className="text-[#3b82f6] hover:text-[#60a5fa] text-xs">↗</a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-[#71717a]">
        <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 rounded-lg border border-[#27272a] hover:border-[#3f3f46] disabled:opacity-30 transition-colors text-[#a1a1aa]">
            ← Prev
          </button>
          <span className="px-3 py-1.5 text-[#52525b]">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg border border-[#27272a] hover:border-[#3f3f46] disabled:opacity-30 transition-colors text-[#a1a1aa]">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────

function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Yearly */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Connections by Year</div>
          <div className="text-xs text-[#71717a] mb-4">Full history 2011–2026</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#52525b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#52525b" }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "#a1a1aa" }} labelStyle={{ color: "#a1a1aa" }} />
              <Bar dataKey="connections" fill="#3b82f6" radius={[3, 3, 0, 0]} name="New Connections" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Network composition full */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Network Composition</div>
          <div className="text-xs text-[#71717a] mb-4">All 4,888 connections by role</div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={data.position_categories} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={45}>
                  {data.position_categories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} itemStyle={{ color: "#a1a1aa" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {data.position_categories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-[#a1a1aa]">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-[#fafafa]">{cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full growth chart */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
        <div className="text-sm font-semibold text-[#fafafa] mb-1">Cumulative Network Growth</div>
        <div className="text-xs text-[#71717a] mb-4">36 months — from {data.monthly_growth.slice(-36)[0].total.toLocaleString()} to {data.monthly_growth[data.monthly_growth.length - 1].total.toLocaleString()} connections</div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.monthly_growth.slice(-36)}>
            <defs>
              <linearGradient id="gfull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: "#52525b" }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: "#52525b" }} tickFormatter={(v: number) => v.toLocaleString()} />
            <Tooltip
              formatter={(v) => [Number(v).toLocaleString(), ""]}
              labelFormatter={(m) => fmtMonth(String(m))}
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#a1a1aa" }} itemStyle={{ color: "#3b82f6" }}
            />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gfull)" name="Total" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Skills + invitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Skills by Endorsements</div>
          <div className="text-xs text-[#71717a] mb-4">191 total endorsements</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.skills_data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#52525b" }} />
              <YAxis dataKey="skill" type="category" tick={{ fontSize: 10, fill: "#a1a1aa" }} width={130} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "#a1a1aa" }} labelStyle={{ color: "#a1a1aa" }} />
              <Bar dataKey="endorsements" fill="#8b5cf6" radius={[0, 3, 3, 0]} name="Endorsements" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#fafafa] mb-1">Invitation Breakdown</div>
          <div className="text-xs text-[#71717a] mb-4">1,962 total invitations</div>
          <div className="flex items-center justify-around pt-4">
            {data.invites_data.map((inv, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-black mb-1" style={{ color: i === 0 ? "#3b82f6" : "#6b7280" }}>
                  {inv.value.toLocaleString()}
                </div>
                <div className="text-xs text-[#71717a]">{inv.name}</div>
                <div className="text-xs text-[#52525b] mt-0.5">
                  {Math.round(inv.value / (data.stats.invites_outgoing + data.stats.invites_incoming) * 100)}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <div className="text-xs text-[#71717a]">You initiated 88% of all connections — highly proactive networker</div>
            <div className="text-xs text-[#71717a]">Dec 2025 was peak month: 314 new connections</div>
            <div className="text-xs text-[#71717a]">+65% growth in 2024–2025 vs prior years</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hot List View ────────────────────────────────────────────────────────────

function HotListView() {
  const hotContacts = contacts.filter(c => c.messages > 0).slice(0, 50);
  const recentContacts = [...contacts]
    .filter(c => c.connectedOn)
    .sort((a, b) => {
      const parse = (d: string) => {
        const [day, mon, yr] = d.split(" ");
        return new Date(`${mon} ${day} ${yr}`).getTime();
      };
      return parse(b.connectedOn) - parse(a.connectedOn);
    })
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most messaged */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#27272a]">
            <div className="text-sm font-semibold text-[#fafafa]">Most Active Relationships</div>
            <div className="text-xs text-[#71717a] mt-0.5">Ranked by total messages exchanged</div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272a]">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider">Msgs</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider hidden lg:table-cell">Last Msg</th>
              </tr>
            </thead>
            <tbody>
              {hotContacts.map((c, i) => (
                <tr key={c.id} className="border-b border-[#27272a]/40 hover:bg-[#27272a]/20 transition-colors">
                  <td className="px-4 py-2.5 text-[#52525b] text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: CAT_COLORS[c.category] || "#6b7280" }}>
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#fafafa]">{c.name}</div>
                        <div className="text-[10px] text-[#52525b]">{c.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[#71717a] text-xs hidden md:table-cell truncate max-w-[120px]">{c.company || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[#3b82f6] font-bold text-sm">{c.messages}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[#52525b] text-xs hidden lg:table-cell">{c.lastMessageDate || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Most recently connected */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#27272a]">
            <div className="text-sm font-semibold text-[#fafafa]">Recently Connected</div>
            <div className="text-xs text-[#71717a] mt-0.5">Latest additions to your network</div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272a]">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#52525b] uppercase tracking-wider">Connected</th>
              </tr>
            </thead>
            <tbody>
              {recentContacts.map((c) => (
                <tr key={c.id} className="border-b border-[#27272a]/40 hover:bg-[#27272a]/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: CAT_COLORS[c.category] || "#6b7280" }}>
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#fafafa]">{c.name}</div>
                        <div className="text-[10px] text-[#52525b] truncate max-w-[120px]">{c.position || c.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[#71717a] text-xs hidden md:table-cell truncate max-w-[120px]">{c.company || "—"}</td>
                  <td className="px-4 py-2.5 text-[#3b82f6] text-xs font-medium">{c.connectedOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: { view: View; label: string; icon: string; sub?: string }[] = [
  { view: "dashboard", label: "Dashboard", icon: "⬡", sub: "Overview" },
  { view: "contacts",  label: "All Contacts", icon: "◎", sub: "4,888 people" },
  { view: "hotlist",   label: "Hot List", icon: "◈", sub: "Active relationships" },
  { view: "analytics", label: "Analytics", icon: "◰", sub: "Deep dives" },
];

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("dashboard");

  const viewTitles: Record<View, { title: string; sub: string }> = {
    dashboard: { title: "Dashboard", sub: "Your LinkedIn network at a glance" },
    contacts:  { title: "All Contacts", sub: "Search and filter 4,888 connections" },
    hotlist:   { title: "Hot List", sub: "Most active and recently connected" },
    analytics: { title: "Analytics", sub: "Network growth, composition, skills" },
  };

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-[#18181b] border-r border-[#27272a] flex flex-col z-50">
        {/* Logo */}
        <div className="p-5 border-b border-[#27272a]">
          <div className="text-sm font-bold tracking-tight text-[#fafafa]">Maxwell Cohen</div>
          <div className="text-xs text-[#52525b] mt-0.5">Network CRM</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-3 mb-2">
            <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-widest px-3 mb-1">Workspace</div>
          </div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors text-left ${
                view === item.view
                  ? "bg-[#3b82f6]/10 text-[#3b82f6] border-r-2 border-[#3b82f6]"
                  : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <div>
                <div className="font-medium text-sm">{item.label}</div>
                {item.sub && <div className="text-[10px] opacity-60 mt-0.5">{item.sub}</div>}
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a]">
          <div className="text-[10px] text-[#3f3f46]">Data: Jan 2026 export</div>
          <div className="flex gap-3 mt-2">
            <a href="https://x.com/Trace_Cohen" target="_blank" rel="noreferrer" className="text-[10px] text-[#52525b] hover:text-[#3b82f6]">Twitter</a>
            <a href="mailto:t@nyvp.com" className="text-[10px] text-[#52525b] hover:text-[#3b82f6]">Email</a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur border-b border-[#27272a] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#fafafa]">{viewTitles[view].title}</h1>
              <p className="text-xs text-[#52525b] mt-0.5">{viewTitles[view].sub}</p>
            </div>
            <div className="text-xs text-[#3f3f46]">
              {data.stats.total_connections.toLocaleString()} connections
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {view === "dashboard"  && <DashboardView />}
          {view === "contacts"   && <ContactsView />}
          {view === "hotlist"    && <HotListView />}
          {view === "analytics"  && <AnalyticsView />}
        </div>
      </main>
    </div>
  );
}

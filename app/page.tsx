"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import data from "./data.json";

const COLORS = ["#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316", "#06b6d4", "#84cc16"];
const BLUE_GRADIENT = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="text-sm text-slate-500 font-medium mb-1">{label}</div>
      <div className="text-3xl font-bold text-slate-900">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

const last36months = data.monthly_growth.slice(-36);
const last24messages = data.messages_data.slice(-24);

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(mo) - 1]} '${y.slice(2)}`;
}

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-blue-200 mb-2">LinkedIn Network Intelligence</div>
              <h1 className="text-4xl font-bold mb-2">Maxwell Cohen</h1>
              <p className="text-blue-100 text-sm max-w-lg">
                Inventor &amp; CEO of PeelAways · Shark Tank Alum · Network active since 2011
              </p>
              <div className="flex flex-wrap gap-6 mt-6">
                <div>
                  <div className="text-3xl font-black">{data.stats.total_connections.toLocaleString()}</div>
                  <div className="text-xs text-blue-200 mt-0.5">Connections</div>
                </div>
                <div className="w-px bg-blue-500" />
                <div>
                  <div className="text-3xl font-black">{data.stats.total_messages.toLocaleString()}</div>
                  <div className="text-xs text-blue-200 mt-0.5">Messages</div>
                </div>
                <div className="w-px bg-blue-500" />
                <div>
                  <div className="text-3xl font-black">{data.stats.invites_outgoing.toLocaleString()}</div>
                  <div className="text-xs text-blue-200 mt-0.5">Invitations Sent</div>
                </div>
                <div className="w-px bg-blue-500" />
                <div>
                  <div className="text-3xl font-black">{data.stats.articles_written}</div>
                  <div className="text-xs text-blue-200 mt-0.5">Articles Written</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-200 mb-1">Member Since</div>
              <div className="text-5xl font-black">2011</div>
              <div className="text-xs text-blue-200 mt-1">15 years on LinkedIn</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Connections" value={data.stats.total_connections} sub="as of Jan 2026" />
          <StatCard label="Messages Sent" value={data.stats.messages_sent} sub={`of ${data.stats.total_messages.toLocaleString()} total`} />
          <StatCard label="Messages Received" value={data.stats.messages_received} />
          <StatCard label="Skill Endorsements" value={data.stats.total_endorsements} sub="across 15 skills" />
        </div>

        {/* Network Growth */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Network Growth</h2>
          <p className="text-sm text-slate-500 mb-6">Cumulative connections — last 36 months</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={last36months}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: "#94a3b8" }} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => v.toLocaleString()} />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString(), ""]}
                labelFormatter={(m) => fmtMonth(String(m))}
                contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} fill="url(#totalGrad)" name="Total Connections" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly + Yearly */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">New Connections / Month</h2>
            <p className="text-sm text-slate-500 mb-6">Last 24 months</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={last36months.slice(-24)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: "#94a3b8" }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip labelFormatter={(m) => fmtMonth(String(m))} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="new" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Connections" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Connections by Year</h2>
            <p className="text-sm text-slate-500 mb-6">Full history since 2011</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.yearly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="connections" radius={[4, 4, 0, 0]} name="Connections">
                  {data.yearly.map((_, index) => (
                    <Cell key={index} fill={BLUE_GRADIENT[Math.min(index, BLUE_GRADIENT.length - 1)]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Composition + Top Companies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Who&apos;s in Your Network</h2>
            <p className="text-sm text-slate-500 mb-6">By role category</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={data.position_categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                    {data.position_categories.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data.position_categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 ml-2">{cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Top Companies in Network</h2>
            <p className="text-sm text-slate-500 mb-4">Excluding freelancers &amp; self-employed</p>
            <div className="space-y-2">
              {data.top_companies.map((co, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 text-xs text-slate-400 font-medium text-right">{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-700 font-medium">{co.company}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(co.count / data.top_companies[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-800 w-6 text-right">{co.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Messaging Activity</h2>
          <p className="text-sm text-slate-500 mb-6">Sent vs. received — last 24 months</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={last24messages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: "#94a3b8" }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip labelFormatter={(m) => fmtMonth(String(m))} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sent" stackId="a" fill="#2563eb" name="Sent" />
              <Bar dataKey="received" stackId="a" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Received" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Contacts + Invitations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Most Active Conversations</h2>
            <p className="text-sm text-slate-500 mb-4">People who message you most</p>
            <div className="space-y-3">
              {data.top_contacts.map((contact, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}>
                    {contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-800 font-medium">{contact.name}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(contact.messages / data.top_contacts[0].messages) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-800">{contact.messages}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Invitation Activity</h2>
            <p className="text-sm text-slate-500 mb-4">1,962 total invitations</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={data.invites_data} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                    <Cell fill="#2563eb" />
                    <Cell fill="#93c5fd" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-sm text-slate-600">You Sent</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{data.stats.invites_outgoing.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">
                    {Math.round((data.stats.invites_outgoing / (data.stats.invites_outgoing + data.stats.invites_incoming)) * 100)}% of total
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-blue-200" />
                    <span className="text-sm text-slate-600">You Received</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{data.stats.invites_incoming.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">
                    {Math.round((data.stats.invites_incoming / (data.stats.invites_outgoing + data.stats.invites_incoming)) * 100)}% of total
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Top Skills by Endorsements</h2>
          <p className="text-sm text-slate-500 mb-6">191 endorsements across 15 skills</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.skills_data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis dataKey="skill" type="category" tick={{ fontSize: 11, fill: "#64748b" }} width={140} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="endorsements" radius={[0, 4, 4, 0]} name="Endorsements">
                {data.skills_data.map((_, i) => (
                  <Cell key={i} fill={BLUE_GRADIENT[Math.min(i, BLUE_GRADIENT.length - 1)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-6 border-t border-slate-100">
          Data exported January 2026 · LinkedIn Network Dashboard ·{" "}
          <a href="https://x.com/Trace_Cohen" className="hover:text-blue-500 underline" target="_blank" rel="noreferrer">Twitter</a>
          {" · "}
          <a href="mailto:t@nyvp.com" className="hover:text-blue-500 underline">t@nyvp.com</a>
        </div>
      </div>
    </div>
  );
}

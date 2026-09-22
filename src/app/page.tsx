'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Send,
  Radio,
  Clock,
  Database,
  Terminal,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Cpu,
  Server,
  Workflow,
  Sparkles,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface LogEntry {
  id: string;
  timestamp: string;
  channel: string;
  severity: string;
  message: string;
  sessionInstanceId: string;
}

interface DispatchReceipt {
  receiptId: string;
  channel: string;
  timestamp: string;
  status: string;
  targetEndpoint: string;
  dispatcherClass: string;
  payloadDelivered: {
    priorityLevel: string;
    slaMinutes: number;
    formattedOutput: string;
    strategyUsed: string;
    actionProtocol: string;
  };
  metadata: Record<string, unknown>;
}

interface PipelineTrace {
  strategy: {
    pattern: string;
    strategyClass: string;
    priorityLevel: string;
    slaMinutes: number;
  };
  factory: {
    pattern: string;
    factoryUsed: string;
    dispatcherClass: string;
    channelName: string;
  };
  singleton: {
    pattern: string;
    instanceId: string;
    totalLoggedEvents: number;
  };
}

const TEMPLATES = [
  {
    label: '🔥 DB Pool Starvation',
    channel: 'pagerduty',
    severity: 'critical',
    message: 'PostgreSQL primary cluster connection pool reached 100% capacity. Queries in pg_stat_activity blocked.',
  },
  {
    label: '⚠️ Redis Cache High Eviction',
    channel: 'slack',
    severity: 'warning',
    message: 'Redis cluster memory pressure exceeds 82%. Eviction rate spiked to 4,200 keys/sec on cache-node-03.',
  },
  {
    label: 'ℹ️ Routine Cert Rotation',
    channel: 'email',
    severity: 'info',
    message: 'Wildcard *.api.internal TLS certificates will auto-renew in 14 days. Zero action required unless validation fails.',
  },
];

export default function IncidentDashboard() {
  const [channel, setChannel] = useState<'slack' | 'pagerduty' | 'email'>('pagerduty');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('critical');
  const [message, setMessage] = useState<string>(TEMPLATES[0].message);
  const [loading, setLoading] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<DispatchReceipt | null>(null);
  const [pipelineTrace, setPipelineTrace] = useState<PipelineTrace | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessionInstanceId, setSessionInstanceId] = useState<string>('Connecting...');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch initial state from the Singleton via GET /api/incident
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/incident');
      const data = await res.json();
      if (data.loggerSession) {
        setSessionInstanceId(data.loggerSession);
        setLogs(data.currentLogs || []);
      }
    } catch {
      setNotification({ type: 'error', text: 'Failed to communicate with API server.' });
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setNotification(null);

    try {
      const res = await fetch('/api/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, severity, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch alert');
      }

      setReceipt(data.receipt);
      setPipelineTrace(data.pipelineExecutionTrace);
      setLogs(data.currentLogs);
      setSessionInstanceId(data.loggerSession);
      setNotification({
        type: 'success',
        text: `Alert dispatched via ${data.receipt.dispatcherClass} with SLA ${data.receipt.payloadDelivered.slaMinutes}m.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setNotification({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/incident', { method: 'DELETE' });
      const data = await res.json();
      setLogs([]);
      setNotification({
        type: 'success',
        text: 'Audit log cleared. Singleton sessionInstanceId remains persistent!',
      });
      if (data.loggerSession) setSessionInstanceId(data.loggerSession);
    } catch {
      setNotification({ type: 'error', text: 'Failed to clear logs.' });
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
      case 'P1-CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-ping"></span>
            P1-CRITICAL
          </span>
        );
      case 'WARNING':
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30">
            <Info className="w-3 h-3" />
            LOW
          </span>
        );
    }
  };

  const getChannelBadge = (ch: string) => {
    const c = ch.toLowerCase();
    if (c === 'slack') {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-xs font-mono uppercase">
          #slack
        </span>
      );
    }
    if (c === 'pagerduty') {
      return (
        <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800 text-xs font-mono uppercase">
          pagerduty
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800 text-xs font-mono uppercase">
        email-tls
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 via-slate-50 to-slate-100/90 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-6 py-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Cloud Incident Dispatcher
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                  Live Patterns
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Strategy (Behavioral) • Factory (Creational) • Singleton (Creational)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Switch */}
            <ThemeToggle />

            {/* Singleton Session Badge */}
            <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 px-3.5 py-1.5 rounded-lg text-xs font-mono shadow-sm transition-colors">
              <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-slate-500 dark:text-slate-400">Singleton Instance:</span>
              <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{sessionInstanceId}</span>
            </div>

            <button
              onClick={fetchLogs}
              title="Refresh logs from Singleton"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Pattern Architecture Banner */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-6">
        <div className="bg-white/90 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Workflow className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Pattern Orchestration Pipeline in /api/incident
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-mono font-medium mb-1">
                  <span>1. Strategy Pattern</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">Behavioral</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Decouples SLA & header formatting via <code className="text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">Critical</code>, <code className="text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">Warning</code>, or <code className="text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">InfoEscalationStrategy</code>.
                </p>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                Context: EscalationContext.execute()
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-mono font-medium mb-1">
                  <span>2. Factory Pattern</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Creational</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  <code className="text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">DispatcherFactory</code> creates the proper channel client (<code className="text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">Slack</code>, <code className="text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">PagerDuty</code>, <code className="text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">Email</code>) without exposing concrete classes.
                </p>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                Interface: AlertDispatcher.dispatch()
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 font-mono font-medium mb-1">
                  <span>3. Singleton Pattern</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20">Creational</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  <code className="text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">AuditLogger.getInstance()</code> maintains a single in-memory store preserving <code className="text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">{sessionInstanceId.slice(0, 14)}...</code> across all requests.
                </p>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                Static: AuditLogger.getInstance().log()
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: 2 Columns */}
      <main className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Form & Live Dispatch Receipt (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* Notification Toast */}
          {notification && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{notification.text}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Incident Dispatch Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Dispatch New Incident
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Submits payload to <code className="text-indigo-600 dark:text-indigo-300 font-mono font-medium">/api/incident</code> route.
                </p>
              </div>

              {/* Template quick-pick */}
              <div className="flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">Presets:</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-2 mb-5">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setChannel(tmpl.channel as typeof channel);
                    setSeverity(tmpl.severity as typeof severity);
                    setMessage(tmpl.message);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Channel Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Channel <span className="text-slate-500 dark:text-slate-500">(Factory Pattern)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as typeof channel)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="pagerduty">PagerDuty (Urgent Voice/Push)</option>
                      <option value="slack">Slack (#incident-response-live)</option>
                      <option value="email">Email (Internal Relay TLS)</option>
                    </select>
                  </div>
                </div>

                {/* Severity Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Severity Level <span className="text-slate-500 dark:text-slate-500">(Strategy Pattern)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as typeof severity)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="critical">Critical (P1 - 15m SLA)</option>
                      <option value="warning">Warning (Medium - 120m SLA)</option>
                      <option value="info">Info (Low - 1440m SLA)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Incident Description & Diagnostics
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the cloud failure, affected cluster, and diagnostic indicators..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none font-mono text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>
                    Calculated SLA:{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                      {severity === 'critical' ? '15 minutes' : severity === 'warning' ? '2 hours' : '24 hours'}
                    </strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Executing Pipeline...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Execute Incident Dispatch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Receipt Preview Card */}
          {receipt ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl relative animate-in fade-in-50 duration-300 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Alert Dispatch Receipt
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Receipt ID: {receipt.receiptId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
                    {receipt.status}
                  </span>
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-slate-500 block text-[11px] mb-1">Target Endpoint</span>
                  <p className="font-mono text-slate-800 dark:text-slate-300 break-all text-[11px]">
                    {receipt.targetEndpoint}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-slate-500 block text-[11px] mb-1">Dispatcher Product Class</span>
                  <div className="flex items-center gap-2">
                    <code className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold text-[12px]">
                      {receipt.dispatcherClass}
                    </code>
                    <span className="text-[10px] text-slate-500 font-sans">(Factory output)</span>
                  </div>
                </div>
              </div>

              {/* Formatted Message by Strategy */}
              <div className="bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    Strategy-Formatted Alert Payload
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Strategy: {receipt.payloadDelivered.strategyUsed}
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/90 p-3 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed break-words">
                  {receipt.payloadDelivered.formattedOutput}
                </p>
              </div>

              {/* Action Protocol */}
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <Radio className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-300">Action Protocol: </strong>
                  <span>{receipt.payloadDelivered.actionProtocol}</span>
                </div>
              </div>

              {/* Execution Trace Badge */}
              {pipelineTrace && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Strategy: <code className="text-indigo-600 dark:text-indigo-300">{pipelineTrace.strategy.strategyClass}</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Factory: <code className="text-emerald-600 dark:text-emerald-300">{pipelineTrace.factory.dispatcherClass}</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Singleton Events: <code className="text-cyan-600 dark:text-cyan-300">{pipelineTrace.singleton.totalLoggedEvents}</code></span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 transition-colors">
              <Radio className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600 animate-pulse" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-400">Awaiting Alert Dispatch</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Submit an incident using the form above to witness the live execution receipt and pattern coordination.
              </p>
            </div>
          )}
        </section>

        {/* Right Column: Live Audit Log Feed from Singleton (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex-1 flex flex-col min-h-[500px] transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Singleton Audit Log Feed
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20">
                    {logs.length} entries
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Managed globally by <code className="text-cyan-700 dark:text-cyan-300 font-mono font-medium">AuditLogger.getInstance()</code>
                </p>
              </div>

              {logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:border-slate-700 dark:hover:border-rose-800 dark:text-slate-300 dark:hover:text-rose-300 transition-colors"
                  title="Clear in-memory audit logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Singleton Session Info Alert */}
            <div className="bg-cyan-50/70 dark:bg-slate-950/70 border border-cyan-200 dark:border-cyan-900/40 rounded-xl p-3 mb-4 text-xs flex items-start gap-2.5 transition-colors">
              <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 mt-1 shrink-0 animate-pulse"></span>
              <div className="leading-relaxed">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Persistent Singleton Instance: </span>
                <code className="text-cyan-700 dark:text-cyan-300 font-mono break-all">{sessionInstanceId}</code>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  This instance identifier stays constant across all dispatches and page refreshes, proving that subsequent requests access the same singleton instance in memory.
                </p>
              </div>
            </div>

            {/* Log Entries List */}
            <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1 flex-1">
              {logs.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                  <Database className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs">Audit log is currently empty.</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">
                    Trigger an incident to append immutable log records.
                  </p>
                </div>
              ) : (
                logs.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 rounded-xl p-3.5 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(entry.severity)}
                        {getChannelBadge(entry.channel)}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="font-mono text-[11px] text-slate-800 dark:text-slate-300 leading-relaxed break-words bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                      {entry.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-900 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>ID: {entry.id}</span>
                      <span>Session: {entry.sessionInstanceId.slice(0, 15)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Design Patterns Demo: Singleton • Strategy • Factory</span>
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-600">
            Next.js App Router • TypeScript • Tailwind CSS
          </span>
        </div>
      </footer>
    </div>
  );
}

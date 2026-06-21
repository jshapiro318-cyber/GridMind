"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { GPUS, PROVIDERS, REGIONS } from "@/lib/catalog";
import { MODES, type Mode } from "@/lib/routing";
import { LATENCY_OPTIONS, type Preferences, hasActiveConstraints } from "@/lib/preferences";
import { resetPreferences, savePreferences } from "@/lib/preferences-actions";
import { usd } from "@/lib/format";

const BUDGET_PRESETS = [250_000, 500_000, 1_000_000];
type ListKey = "allowedProviders" | "allowedRegions" | "gpuIds";

export function SettingsForm({ initial }: { initial: Preferences }) {
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [saved, setSaved] = useState<Preferences>(initial);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(prefs) !== JSON.stringify(saved);

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setJustSaved(false);
  }
  const toggle = (key: ListKey, id: string) =>
    update(key, prefs[key].includes(id) ? prefs[key].filter((x) => x !== id) : [...prefs[key], id]);

  const save = () =>
    startTransition(async () => {
      const clean = await savePreferences(prefs);
      setPrefs(clean);
      setSaved(clean);
      setJustSaved(true);
    });
  const reset = () =>
    startTransition(async () => {
      const def = await resetPreferences();
      setPrefs(def);
      setSaved(def);
      setJustSaved(true);
    });

  const constraintSummary = hasActiveConstraints(prefs)
    ? [
        prefs.allowedProviders.length ? `${prefs.allowedProviders.length} of ${PROVIDERS.length} providers` : null,
        prefs.allowedRegions.length ? `${prefs.allowedRegions.length} of ${REGIONS.length} regions` : null,
        prefs.maxLatencyMs != null ? `≤ ${prefs.maxLatencyMs} ms` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "No restrictions — every provider, region and latency allowed";

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
      {/* Action bar */}
      <div className="card card-pad flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-ink">Your routing preferences</h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            Applied across the{" "}
            <Link href="/dashboard" className="text-brand hover:underline">dashboard</Link>,{" "}
            <Link href="/routing" className="text-brand hover:underline">routing center</Link>,{" "}
            <Link href="/gridscore" className="text-brand hover:underline">GridScore</Link> and{" "}
            <Link href="/budget" className="text-brand hover:underline">budget</Link>.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {justSaved && !dirty && (
            <span className="flex items-center gap-1.5 text-xs text-leaf">
              <span className="h-1.5 w-1.5 rounded-full bg-leaf" /> Saved
            </span>
          )}
          {dirty && <span className="text-xs text-amber">Unsaved changes</span>}
          <button
            onClick={reset}
            disabled={pending}
            className="press rounded-lg border border-line px-3 py-2 text-xs text-ink-muted transition-colors hover:border-line-bright hover:text-ink disabled:opacity-50"
          >
            Reset to defaults
          </button>
          <button
            onClick={save}
            disabled={pending || !dirty}
            className="press inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-bg transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save preferences"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Budget target */}
        <Card title="Monthly budget" hint="Drives budget alerts & projections">
          <div className="flex items-baseline gap-1">
            <span className="text-lg text-ink-muted">$</span>
            <input
              type="number"
              min={0}
              step={5_000}
              value={prefs.monthlyBudget || ""}
              placeholder="Auto"
              onChange={(e) => update("monthlyBudget", Math.max(0, Number(e.target.value)))}
              className="tnum w-full bg-transparent text-2xl font-semibold text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {prefs.monthlyBudget > 0
              ? `Target ${usd(prefs.monthlyBudget)} / month.`
              : "Auto — derived from your last 30 days of spend + 10% headroom."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <SegBtn active={prefs.monthlyBudget === 0} onClick={() => update("monthlyBudget", 0)}>
              Auto
            </SegBtn>
            {BUDGET_PRESETS.map((p) => (
              <SegBtn key={p} active={prefs.monthlyBudget === p} onClick={() => update("monthlyBudget", p)}>
                {usd(p, { compact: true })}
              </SegBtn>
            ))}
          </div>
        </Card>

        {/* Default optimization mode */}
        <Card title="Default optimization" hint="The objective new routes optimize for">
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => update("mode", m.id as Mode)}
                className={`press rounded-xl border p-3 text-left transition-[box-shadow,border-color,background-color] duration-200 ease-out ${
                  prefs.mode === m.id ? "border-transparent bg-bg-hover" : "border-line bg-bg-card hover:border-line-bright"
                }`}
                style={prefs.mode === m.id ? { boxShadow: `0 0 0 1px ${m.accent}55, 0 0 24px -10px ${m.accent}` } : undefined}
              >
                <div className="text-sm font-semibold" style={{ color: prefs.mode === m.id ? m.accent : "#ece4d8" }}>
                  {m.label}
                </div>
                <div className="mt-0.5 text-[11px] leading-tight text-ink-faint">{m.blurb}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Workload profile */}
      <Card title="Workload profile" hint="Representative GPU mix — seeds the simulator & dashboard fleet">
        <div className="flex flex-wrap gap-1.5">
          {GPUS.map((g) => (
            <Chip key={g.id} active={prefs.gpuIds.includes(g.id)} onClick={() => toggle("gpuIds", g.id)}>
              {g.name.replace("NVIDIA ", "").replace("AMD ", "")}
            </Chip>
          ))}
        </div>
      </Card>

      {/* Routing constraints */}
      <Card
        title="Routing constraints"
        hint="Hard guardrails the routing engine must respect"
        right={<span className="pill text-xs">{constraintSummary}</span>}
      >
        <Group label="Allowed providers" note="None selected = all providers allowed">
          {PROVIDERS.map((p) => (
            <Chip key={p.id} active={prefs.allowedProviders.includes(p.id)} accent={p.accent} onClick={() => toggle("allowedProviders", p.id)}>
              {p.short}
            </Chip>
          ))}
        </Group>

        <Group label="Allowed regions" note="None selected = all regions (no data-residency limit)">
          {REGIONS.map((r) => (
            <Chip key={r.id} active={prefs.allowedRegions.includes(r.id)} onClick={() => toggle("allowedRegions", r.id)}>
              {r.city}
            </Chip>
          ))}
        </Group>

        <Group label="Latency ceiling" note="Exclude any placement slower than this">
          {LATENCY_OPTIONS.map((o) => (
            <SegBtn key={o.label} active={prefs.maxLatencyMs === o.value} onClick={() => update("maxLatencyMs", o.value)}>
              {o.label}
            </SegBtn>
          ))}
        </Group>
      </Card>

      <p className="flex items-center gap-2 px-1 text-xs text-ink-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-brass/70" />
        Preferences are stored in your browser — they personalize the optimization targets, not the underlying usage.
      </p>
    </div>
  );
}

function Card({ title, hint, right, children }: { title: string; hint?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card card-pad">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Group({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex items-baseline justify-between gap-2">
        <label className="stat-label">{label}</label>
        {note && <span className="text-[11px] text-ink-faint">{note}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, accent, onClick, children }: { active: boolean; accent?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
        active ? "border-transparent bg-bg-hover text-ink" : "border-line text-ink-muted hover:border-line-bright hover:text-ink"
      }`}
      style={active ? { boxShadow: `inset 0 0 0 1px ${(accent ?? "#ecb84c") + "66"}` } : undefined}
    >
      {children}
    </button>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
        active ? "border-brand/40 bg-brand/10 text-brand" : "border-line text-ink-muted hover:border-line-bright hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The gallery UI: a filterable grid of every Workvivo component, and a detail view
 * that drives each one's props live.
 *
 * Gallery classes are all `g-`-prefixed. `WorkvivoStyles.css` is imported globally so
 * the components render exactly as they do in the cut, and it already owns `.card`,
 * `.main`, `.content` and `.grid` — unprefixed names here would restyle the very
 * components the gallery exists to show.
 *
 * Rendering goes through `<Thumbnail>` from @remotion/player rather than mounting the
 * components directly, because all of them read `useCurrentFrame()` and would throw
 * outside a Remotion context. Thumbnail also does the scale-to-fit, which is why every
 * registry entry declares its composition size.
 */
import React, { useMemo, useState } from "react";
import { Thumbnail } from "@remotion/player";
import {
  ENTRIES,
  GROUPS,
  initialControlState,
  type Control,
  type Entry,
  type Group,
} from "./registry";

const FPS = 25;

/** Thumbnail wants a box to fit into; give it one that preserves the entry's aspect. */
const fitInto = (entry: Entry, boxW: number, boxH: number) => {
  const k = Math.min(boxW / entry.width, boxH / entry.height);
  return { width: Math.round(entry.width * k), height: Math.round(entry.height * k) };
};

const Preview: React.FC<{
  entry: Entry;
  boxW: number;
  boxH: number;
  frame: number;
  props: Record<string, unknown>;
}> = ({ entry, boxW, boxH, frame, props }) => {
  const size = fitInto(entry, boxW, boxH);
  return (
    <Thumbnail
      component={entry.Stage as React.FC<Record<string, unknown>>}
      compositionWidth={entry.width}
      compositionHeight={entry.height}
      durationInFrames={entry.durationInFrames}
      fps={FPS}
      frameToDisplay={Math.min(frame, entry.durationInFrames - 1)}
      inputProps={props}
      style={{ ...size, borderRadius: 6 }}
      errorFallback={({ error }) => (
        <div className="g-thumb-error" style={size}>
          {error.message}
        </div>
      )}
    />
  );
};

const ControlRow: React.FC<{
  control: Control;
  value: unknown;
  onChange: (v: unknown) => void;
}> = ({ control, value, onChange }) => {
  if (control.kind === "toggle") {
    return (
      <label className="g-ctl">
        <span className="g-ctl-label">{control.label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    );
  }
  if (control.kind === "select") {
    return (
      <label className="g-ctl">
        <span className="g-ctl-label">{control.label}</span>
        <select value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {control.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="g-ctl">
      <span className="g-ctl-label">
        {control.label}
        <em>{typeof value === "number" ? Number(value).toFixed(control.step < 1 ? 2 : 0) : ""}</em>
      </span>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
};

const Detail: React.FC<{ entry: Entry; onClose: () => void }> = ({ entry, onClose }) => {
  const [props, setProps] = useState<Record<string, unknown>>(() => initialControlState(entry));
  const [frame, setFrame] = useState(entry.poster);

  return (
    <div className="g-sheet" onClick={onClose}>
      <div className="g-sheet-inner" onClick={(e) => e.stopPropagation()}>
        <div className="g-sheet-stage">
          <Preview entry={entry} boxW={980} boxH={720} frame={frame} props={props} />
        </div>
        <aside className="g-sheet-side">
          <button className="g-sheet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <span className="g-chip">{entry.group}</span>
          <h2>{entry.name}</h2>
          <code className="g-path">{entry.file}</code>
          <p>{entry.summary}</p>

          <dl className="g-facts">
            <div>
              <dt>Size</dt>
              <dd>
                {entry.width} × {entry.height}
              </dd>
            </div>
            <div>
              <dt>Props</dt>
              <dd>{entry.controls?.length ? entry.controls.length : "none"}</dd>
            </div>
          </dl>

          {entry.durationInFrames > 30 ? (
            <ControlRow
              control={{
                key: "__frame",
                label: "Frame",
                kind: "range",
                min: 0,
                max: entry.durationInFrames - 1,
                step: 1,
                init: entry.poster,
              }}
              value={frame}
              onChange={(v) => setFrame(Number(v))}
            />
          ) : null}

          {(entry.controls ?? []).map((c) => (
            <ControlRow
              key={c.key}
              control={c}
              value={props[c.key]}
              onChange={(v) => setProps((p) => ({ ...p, [c.key]: v }))}
            />
          ))}
        </aside>
      </div>
    </div>
  );
};

/** A div rather than a button: several of the previewed components contain buttons of
 *  their own, and a button inside a button is invalid HTML. */
const Card: React.FC<{ entry: Entry; onOpen: () => void }> = ({ entry, onOpen }) => (
  <div
    className="g-card"
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen();
      }
    }}
  >
    <div className="g-card-stage">
      <Preview
        entry={entry}
        boxW={392}
        boxH={236}
        frame={entry.poster}
        props={initialControlState(entry)}
      />
    </div>
    <div className="g-card-meta">
      <div className="g-card-title">
        <span>{entry.name}</span>
        <span className="g-dims">
          {entry.width}×{entry.height}
        </span>
      </div>
      <p>{entry.summary}</p>
    </div>
  </div>
);

export const Gallery: React.FC = () => {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group | "All">("All");
  const [open, setOpen] = useState<Entry | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENTRIES.filter((e) => {
      if (group !== "All" && e.group !== group) return false;
      if (!q) return true;
      return (e.name + e.summary + e.file).toLowerCase().includes(q);
    });
  }, [query, group]);

  return (
    <div className="g-page">
      <header className="g-head">
        <div className="g-head-left">
          <h1>Workvivo component library</h1>
          <p>
            {ENTRIES.length} components from <code>src/components/workvivo/</code>, rendered
            live. Click one to drive its props.
          </p>
        </div>
        <input
          className="g-search"
          placeholder="Search components…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <nav className="g-tabs">
        {(["All", ...GROUPS] as const).map((g) => (
          <button
            key={g}
            className={g === group ? "g-tab g-on" : "g-tab"}
            onClick={() => setGroup(g as Group | "All")}
          >
            {g}
            <em>{g === "All" ? ENTRIES.length : ENTRIES.filter((e) => e.group === g).length}</em>
          </button>
        ))}
      </nav>

      <main className="g-grid">
        {shown.map((e) => (
          <Card key={e.id} entry={e} onOpen={() => setOpen(e)} />
        ))}
      </main>

      {shown.length === 0 ? <p className="g-empty">Nothing matches “{query}”.</p> : null}

      {open ? <Detail entry={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
};

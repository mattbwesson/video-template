/**
 * Where each voiceover line starts, and how much each one is sped up.
 *
 * WHY THIS IS A MODULE RATHER THAN LINES INSIDE build-japanese-vo.mjs
 *
 * Two callers need this answer and they must not be able to disagree. build-japanese-vo.mjs
 * asks it of a read that exists, to cut the audio. scripts/predict-vo-fit.mjs asks it of a
 * script that has not been recorded yet, to answer "will this draft need compression?" —
 * and that prediction is worth nothing if it is computed by a second implementation that
 * has drifted from the one that does the cutting.
 *
 * The same failure mode has come up repeatedly in this project: a value set in two places
 * is a value that will eventually be set two ways, and the version that degrades quietly
 * is the one that hurts. So there is one solver.
 */

/**
 * Isotonic regression by pool-adjacent-violators.
 *
 * This is the part that makes the placement exactly solvable rather than a heuristic.
 * Substituting z_i = s_i - sum of everything scheduled before it turns "line i must finish
 * before line i+1 starts" into "z must not decrease", and turns "put every line as near its
 * anchor as possible" into least squares. That pair is isotonic regression, which PAVA
 * solves exactly in one pass — so for any set of tempos, the best possible placement is not
 * searched for, it is computed.
 */
const pava = (b) => {
  const v = [];
  const w = [];
  const n = [];
  for (const x of b) {
    v.push(x);
    w.push(1);
    n.push(1);
    while (v.length > 1 && v[v.length - 2] > v[v.length - 1] - 1e-12) {
      const v1 = v.pop(), w1 = w.pop(), n1 = n.pop();
      const v2 = v.pop(), w2 = w.pop(), n2 = n.pop();
      v.push((v1 * w1 + v2 * w2) / (w1 + w2));
      w.push(w1 + w2);
      n.push(n1 + n2);
    }
  }
  const out = [];
  for (let i = 0; i < v.length; i++) for (let k = 0; k < n[i]; k++) out.push(v[i]);
  return out;
};

/**
 * Place `dur` seconds of speech per line so each lands as near `anchor` as it can.
 *
 * Returns `{ start, tempo }`, both arrays parallel to the inputs. Tempo is never below 1:
 * slowing a read down to fill a gap sounds worse than the silence it replaces.
 */
export const place = ({ anchor, dur, gap, tempoMax, syncVsTempo }) => {
  const N = anchor.length;

  const startsFor = (tempo) => {
    const played = dur.map((d, i) => d / tempo[i]);
    const cum = [0];
    for (let i = 0; i < N - 1; i++) cum.push(cum[i] + played[i] + gap);
    return pava(anchor.map((a, i) => a - cum[i])).map((z, i) => z + cum[i]);
  };

  const cost = (tempo) => {
    const s = startsFor(tempo);
    let c = 0;
    for (let i = 0; i < N; i++) c += (s[i] - anchor[i]) ** 2 + syncVsTempo * (tempo[i] - 1) ** 2;
    return c;
  };

  // Projected gradient descent over the tempos. The inner placement is exact, so this only
  // has to search the tempos — one number per line, each boxed into [1, tempoMax].
  let tempo = new Array(N).fill(1.05);
  let step = 0.02;
  for (let it = 0; it < 600; it++) {
    const c0 = cost(tempo);
    const h = 1e-4;
    const grad = [];
    for (let i = 0; i < N; i++) {
      const t = tempo.slice();
      t[i] = Math.min(tempoMax, t[i] + h);
      grad.push((cost(t) - c0) / h);
    }
    const norm = Math.hypot(...grad) || 1;
    const next = tempo.map((x, i) => Math.max(1, Math.min(tempoMax, x - (step * grad[i]) / norm)));
    if (cost(next) < c0) tempo = next;
    else step *= 0.7;
    if (step < 1e-4) break;
  }

  return { start: startsFor(tempo), tempo };
};

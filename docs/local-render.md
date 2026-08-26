# Rendering a customer video on your own machine

Build the video in the wizard, click **Download project file**, and paste one command into
Terminal. The only thing your machine needs is [Node.js](https://nodejs.org) — no git, no
project download, no `npm install`.

Why the extra step exists at all: the file the wizard downloads is the *decisions* — the
copy, the brand, the logo, every photo — and the render runs in real headless Chrome on
your machine, which is the same renderer the preview uses. What you approved is what gets
encoded, at full quality.

---

## One-time setup

Install **Node.js** — the LTS installer from [nodejs.org](https://nodejs.org). Then check
it worked, in Terminal:

```bash
node --version
```

You want `v20` or higher. If the command is not found, open a NEW Terminal window and try
again — installers do not update a window that was already open.

That is the whole setup. The first render also downloads the render tooling and a private
Chrome build (~150 MB, automatic, once); later renders skip straight to work.

---

## Every time you make a video

### 1. Build it in the wizard

Work through the wizard as normal. On the last screen, click **Download project file**.
Two things happen: a `workvivo-<company>.json` lands in your Downloads, and the wizard
shows the exact render command with that filename already filled in, next to a
**Copy command** button.

### 2. Paste the command into Terminal

It looks like this (yours will have the real company name):

```bash
npx -p @remotion/cli remotion render https://l2-concept.fly.dev/bundle CustomizedWorkvivo workvivo-acme.mp4 --props=$HOME/Downloads/workvivo-acme.json
```

Press Enter and let it run. The film is 5,300 frames and streams its footage from the
server, so expect a few minutes — there is a progress bar. The MP4 lands in whatever
folder your Terminal is in (your home folder, unless you changed it).

### 3. Send it

1920×1080, H.264, with audio, around 110 MB — too big for most email, so share it via
Drive, Box or Zoom.

---

## When something goes wrong

**`node: command not found` / `npx: command not found`**
Node is not installed, or the Terminal window predates the install. Open a new window; if
it still fails, redo the install from [nodejs.org](https://nodejs.org).

**"Could not read --props" or "no such file"**
The path to the JSON is wrong. Re-copy the command from the wizard — it fills in the
filename it just saved — or drag the JSON from Finder into the Terminal window to get the
path typed for you.

**A long pause near the start**
First run downloads the tooling and browser; every run decodes the reference footage
before the first frames appear. Give it two minutes before assuming it is stuck.

**The error mentions a missing browser**
Run this once, then retry:

```bash
npx -p @remotion/cli remotion browser ensure
```

**It rendered but there is no sound**
Tell whoever maintains the wizard — the soundtrack comes from the reference video on the
server, so silence is a server-side problem, not yours.

---

## For the curious

To render a slice instead of the whole film — useful for checking one scene quickly —
add `--frames` to the same command:

```bash
npx -p @remotion/cli remotion render https://l2-concept.fly.dev/bundle CustomizedWorkvivo out.mp4 --props=$HOME/Downloads/acme.json --frames=740-900
```

What the URL serves is a Remotion "serve URL": the composition bundled by
`npm run bundle:build`, published at `/bundle` by `server/prod.ts`, rebuilt on every
deploy. The renderer fetches the bundle once and streams the footage by Range request.

---

# Building and testing a video yourself

*This half is for whoever maintains the project, not the SEs. It is the loop for checking
that a change looks right before it ships.*

## Getting a project file to test with

The two export buttons are hidden on the deployed site, but **visible when you run the
wizard locally** — `SHOW_EXPORTS` in `web/Reveal.tsx` is `import.meta.env.DEV`, which Vite
replaces with a literal `false` in the production build and then tree-shakes both
components away. So:

```bash
npm run wizard
```

Click through, and **Download project file** is there on the reveal screen. That JSON is
the input to everything below.

## The fast loop: single frames

Rendering the whole film to check one card is a waste of three minutes. Render the frame:

```bash
npm run still 763
```

It lands in `out/check/f763.png` — a gitignored folder, so there is nothing to clean up.
Several at once, in parallel:

```bash
npm run still 593 763 1407 2489
```

Against a customer's copy rather than the baseline demo:

```bash
npm run still 763 -- --props=~/Downloads/workvivo-acme.json
```

Stills go through the **same headless Chromium as the final MP4**, so a frame that looks
right here looks right in the file. That is what makes this a valid check and not just a
preview.

### Finding the frame number

Every sequence in `src/WorkvivoCut.tsx` is named with the global frames it covers:

```tsx
<Sequence name="Workvivo Desktop (738 - 896)" from={738} …>
```

So the desktop screen is anywhere in 738–896; 763 is a settled moment inside it. Scrubbing
the wizard's preview works too — the footer shows the frame count.

## The full check: render and inspect

When the frames look right, render the whole thing and confirm the file itself:

```bash
npm run render:project -- ~/Downloads/workvivo-acme.json
```

Then check the container is what you expect — duration, and that the audio track survived,
which is the one thing a silent-but-correct-looking render will not tell you:

```bash
ffprobe -v error -show_entries format=duration \
  -show_entries stream=codec_type,codec_name,width,height \
  -of default=noprint_wrappers=1 out/workvivo-acme.mp4
```

You want `212.05` seconds, `h264` **and** `aac`, 1920×1080. A missing `aac` line means the
reference encode lost its audio — the film has no other sound source.

To look at a frame of the finished MP4 rather than a still:

```bash
ffmpeg -v error -ss 30.52 -i out/workvivo-acme.mp4 -frames:v 1 -y /tmp/frame.png
```

`-ss` is seconds, so it is the frame number over 25 — frame 763 is `763 / 25 = 30.52`.

## How the no-repo render works

This is what the SE half of this page runs on. `npm run bundle:build` bundles the
composition with `--public-path=/bundle/` — the prefix has to be baked in at build time,
because webpack writes it into index.html and every chunk URL, and a bundle built for `/`
serves the wizard's shell where the renderer expects JavaScript. `server/prod.ts` mounts
the result at `/bundle`, checked before the SPA-shell rewrite so `/bundle/index.html` is
not captured by it.

The bundle is built INSIDE the Docker build, on purpose: .dockerignore excludes the 310 MB
master edit, so the copy of `public/` the bundle swallows there is the trimmed one
(~100 MB). Building it locally and copying it in would silently ship the master.

Two operational notes: the bundle is part of every deploy, so composition changes reach
SEs the moment the deploy lands, with nothing to hand out; and each render streams the
45 MB reference video from Fly by Range request, so a slow connection pays that once per
render, at the start.

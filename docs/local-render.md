# Rendering a customer video on your own machine

The wizard has two export buttons and they are not equivalent.

| | **Download project file** | **Render MP4** |
|---|---|---|
| Renders with | Real headless Chromium, on your machine | A canvas renderer, in the browser tab |
| Quality | Exactly what the preview shows | Preview only — icons, some photos and glass render wrong |
| Speed | Minutes, uses your CPU | Minutes, uses your tab |
| Send to a customer? | **Yes** | No |

Use **Download project file** for anything a customer will see. The rest of this page is
the one-time setup for that, and the two commands you run afterwards.

The short version of why: `@remotion/web-renderer`, behind the in-tab button, draws to a
canvas with its own approximation of CSS. It cannot draw SVG sprite icons, CSS background
photographs, or blend modes, so parts of the film come out blank or wrong. Rendering
locally runs the same headless Chrome that produced every frame in this repo that anyone
has approved, so there is no fidelity gap to explain.

---

## One-time setup

You need this once per machine. Budget fifteen minutes.

### 1. Install Node.js 20 or newer

Download the **LTS** installer from [nodejs.org](https://nodejs.org) and run it. Then check
it worked:

```bash
node --version
```

You want `v20.x` or higher. If the command is not found, close the terminal, open a new
one, and try again — installers do not update an already-open terminal.

### 2. Get the project

If you were given a zip, unzip it somewhere you can find again, like `~/workvivo-video`.
If you were given a git URL:

```bash
git clone <the-url> ~/workvivo-video
```

### 3. Install its dependencies

```bash
cd ~/workvivo-video
npm install
```

This downloads a few hundred megabytes and takes a couple of minutes. Warnings scroll past;
that is normal. What matters is that it ends without the word `ERR!`.

### 4. Install the browser Remotion renders with

```bash
npx remotion browser ensure
```

This is a Chrome build Remotion drives itself — it is separate from the Chrome you browse
with, and it does not touch it. About 150 MB, once.

You are done. You will not repeat any of this.

---

## Every time you make a video

### 1. Build the video in the wizard

Work through it as normal. On the last screen, click **Download project file**. You get
something like `workvivo-northwind-logistics.json` in your Downloads folder.

That file contains everything — the researched copy, your edits, the brand colour, the
logo, and every photo you uploaded, embedded inside it. It is self-contained, so you can
email it to someone else and they will render exactly the same video you were previewing.

### 2. Render it

```bash
cd ~/workvivo-video
npm run render:project -- ~/Downloads/workvivo-northwind-logistics.json
```

Tip: instead of typing the path, type `npm run render:project -- ` (with the space) and
then **drag the file from Finder into the terminal window**. It fills in the path for you.

You will see the company name, then a progress bar. The film is 5,300 frames and one scene
composites 24 samples per frame for motion blur, so a few minutes is expected. A recent
laptop takes roughly three to six.

### 3. Collect the file

It lands in the `out/` folder inside the project:

```
out/workvivo-northwind-logistics.mp4
```

1920×1080, H.264, with audio. Around 110 MB for the full film — too big for most email, so
send it via Drive, Box or Zoom.

---

## When something goes wrong

**"No project file at …"**
The path is wrong. Use the drag-from-Finder trick above. Make sure there is a space after
`--` and no quotes left over.

**"… is not valid JSON."**
The download was cut short. Download it from the wizard again.

**"… does not look like a wizard project file."**
Wrong file — check you clicked *Download project file* and not something else.

**The error mentions a missing browser**
You skipped step 4, or it did not finish. Run it again:

```bash
npx remotion browser ensure
```

**`npm: command not found`**
Node did not install, or the terminal predates it. Open a new terminal; if it still fails,
redo step 1.

**It looks like it is stuck**
Frame counts under about 1,000 can sit for a while at the start — the film has a full-length
reference video underneath it that has to be decoded before anything else draws. Give it two
minutes before assuming it has hung.

---

## For the curious

To render a slice instead of the whole film — useful for checking one scene quickly —
anything after the project file is passed straight to the Remotion CLI:

```bash
npm run render:project -- ~/Downloads/acme.json --frames=740-900
```

The wrapper itself is [`scripts/render-local.mjs`](../scripts/render-local.mjs); it only
validates the file and names the output, then hands off to `remotion render`.

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

## Rendering without the repo

The Remotion CLI takes a **serve URL** in place of a project directory, so a machine with
nothing but Node can render against a hosted bundle:

```bash
npx -p @remotion/cli remotion bundle --out-dir=build/bundle   # build it
npx -p @remotion/cli remotion render <url> CustomizedWorkvivo out.mp4 --props=acme.json
```

Verified working. The full bundle is ~463 MB, but 310 MB of that is the master video the
deploy already excludes — trimmed it is ~101 MB, which the Fly app could serve alongside
the wizard. That would reduce SE setup to installing Node. Not built yet.

/**
 * Uploads become data URLs at the edge, immediately, and stay data URLs.
 *
 * The alternative — `URL.createObjectURL` — drags a revoke-on-replace / revoke-on-unmount
 * lifecycle through the whole wizard and then needs a blob-to-data conversion before any
 * render, because a `blob:` URL is scoped to the page that made it. The guide names that
 * lifecycle the single largest source of incidental complexity in the builder it grew in,
 * and says to do this instead (§5.7). A data URL renders in the `<Player>`, in a server
 * render and in an in-browser export alike, with nothing to clean up.
 *
 * The cost is memory: a 4 MB photo is ~5.5 MB of base64 held in React state. Ten to
 * twenty of those is fine; the downscale below keeps it that way.
 */

export type Upload = { id: string; url: string; name: string };

let counter = 0;
const uid = (): string => `u${++counter}`;

/** A fresh upload id, for callers that build an `Upload` from a processed file. */
export const newUploadId = uid;

/**
 * Is this a file we can use as a picture?
 *
 * The mime check alone misses `.svg` dragged from some file managers, which arrive with
 * an empty `type`. Logos are the one place that matters, so the name is checked too.
 */
export const isImageFile = (f: File): boolean =>
  f.type.startsWith("image/") || /\.svg$/i.test(f.name);

/**
 * Longest edge, in pixels, that an upload is downscaled to before it becomes a data URL.
 *
 * 1600 is comfortably above anything the cut asks of a photo — the largest position is a
 * 452px billboard on a 1920 stage, and the headquarters circles top out at 185px — while
 * keeping a phone-camera JPEG from arriving as 12 MB of base64 and stalling the preview.
 * Only PHOTOS come through here. Logos take their own path (logoProcess.ts), which does
 * not downscale at all: they are usually small, have flat edges that resampling softens,
 * and are often tall-and-thin in a way a longest-edge rule handles badly.
 */
const MAX_EDGE = 1600;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("not an image"));
    img.src = url;
  });

const downscale = async (dataUrl: string): Promise<string> => {
  let img: HTMLImageElement;
  try {
    img = await loadImage(dataUrl);
  } catch {
    // Unreadable by the browser — hand back the original rather than dropping the file,
    // so a format the canvas cannot decode still reaches the composition.
    return dataUrl;
  }
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= MAX_EDGE) return dataUrl;

  const scale = MAX_EDGE / longest;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  // JPEG, not PNG: these are photographs, and a PNG re-encode of a downscaled photo is
  // several times larger than the original file was.
  return canvas.toDataURL("image/jpeg", 0.86);
};

const readImage = async (file: File): Promise<Upload> => {
  const raw = await readAsDataUrl(file);
  return { id: uid(), name: file.name, url: await downscale(raw) };
};

/** Read every image in a FileList. Non-images are skipped, not rejected. */
export const readImages = (files: FileList | File[]): Promise<Upload[]> =>
  Promise.all(Array.from(files).filter(isImageFile).map(readImage));

export const readOneImage = async (
  files: FileList | File[],
): Promise<Upload | null> => (await readImages(files))[0] ?? null;

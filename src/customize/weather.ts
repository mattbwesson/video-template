import type { WorkvivoCopy } from "./videoCopy";

/**
 * The weather card's three numbers, in the scale the card should show.
 *
 * The model writes them in CELSIUS, always, and says only which scale the city's country
 * uses. The conversion happens here.
 *
 * It used to write them in whichever scale it had just chosen, with the guides telling it
 * to keep the two in step. That is four fields — a scale and three numbers — that have to
 * agree, with nothing enforcing it, and it drifted: Newark, Ohio came out at 18° with a
 * high of 23, which is a Celsius forecast on a Fahrenheit city. The card shows no unit
 * letter, so the only tell was that the numbers looked European.
 *
 * Splitting it this way leaves the model one question it is good at — is this city in the
 * United States — and takes away the one it is bad at, which is arithmetic it has to keep
 * consistent across three separate fields.
 *
 * A value that is not a number passes through untouched rather than becoming NaN: the
 * slots are capped at three glyphs but they are still text, and a card reading "--" is
 * better than one reading "NaN".
 */
export type WeatherCopy = WorkvivoCopy["feed"]["weather"];

const asF = (celsius: string): string => {
  const c = Number(celsius);
  if (celsius.trim() === "" || Number.isNaN(c)) return celsius;
  return String(Math.round((c * 9) / 5 + 32));
};

export const weatherInDisplayScale = (
  w: WeatherCopy,
): Pick<WeatherCopy, "temperature" | "high" | "low" | "unit"> =>
  w.unit === "F"
    ? {
        temperature: asF(w.temperature),
        high: asF(w.high),
        low: asF(w.low),
        unit: "F",
      }
    : { temperature: w.temperature, high: w.high, low: w.low, unit: "C" };

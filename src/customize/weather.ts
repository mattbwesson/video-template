import type { WorkvivoCopy } from "./videoCopy";

/**
 * The weather card's three numbers, in the scale the card should show.
 *
 * The model writes them in CELSIUS, always. Which scale to DISPLAY is worked out here,
 * from the city, and only falls back to the model's answer when the city gives nothing to
 * go on.
 *
 * Two goes at this failed before landing on that. First the model wrote the numbers in
 * whichever scale it had chosen, with the guides asking it to keep four fields in step —
 * it drifted, and Newark, Ohio came out at 18° with a high of 23. Then the numbers moved
 * to Celsius and the model kept only the scale, which is a single well-posed question —
 * and it still answered "C" for Canton, Massachusetts. A model that has to volunteer a
 * fact about a place will sometimes not, and there is no repair for a fact you did not
 * get.
 *
 * The city is the fact, and it is already on screen: "Canton, MA" says the United States
 * more reliably than a separate field claiming to. So the state code decides, and `unit`
 * is what is left when there is no code to read.
 */
export type WeatherCopy = WorkvivoCopy["feed"]["weather"];

/** The 50 states, DC, and the territories that use Fahrenheit. */
const US_STATES = new Set(
  ("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV " +
    "NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC PR VI GU AS MP")
    .split(" "),
);

/**
 * Countries whose own subdivisions use two-letter codes that collide with a US state.
 *
 * Only one actually collides — Western Australia is WA, as is Washington — but naming a
 * country is a stronger signal than a two-letter suffix either way, so any of these wins.
 */
const NON_US = [
  "australia", "canada", "united kingdom", "u.k.", "uk", "england", "scotland", "wales",
  "ireland", "new zealand", "germany", "france", "spain", "italy", "netherlands",
  "sweden", "norway", "denmark", "finland", "poland", "portugal", "switzerland",
  "austria", "belgium", "india", "japan", "china", "singapore", "brazil", "mexico",
  "south africa", "uae", "dubai",
];

/**
 * Does this city name say the United States?
 *
 * Three-valued on purpose. `null` means the name carries no signal either way — a bare
 * "Boston" could be Massachusetts or Lincolnshire — and that is the one case where the
 * model's own answer is still the best available, so it is not overridden with a guess.
 */
export const usFromCity = (city: string): boolean | null => {
  const s = city.trim().toLowerCase();
  if (!s) return null;
  // A named country beats a two-letter code: "Perth, WA, Australia" is not Washington.
  if (NON_US.some((c) => new RegExp(`(^|[\\s,(])${c}([\\s,)]|$)`).test(s))) return false;
  if (/(^|[\s,(])(usa|u\.s\.a\.|u\.s\.|united states)([\s,).]|$)/.test(s)) return true;
  // "Canton, MA" — the trailing token, which is where the model puts the state.
  const last = s.split(",").pop()?.trim().toUpperCase() ?? "";
  if (US_STATES.has(last)) return true;
  return null;
};

const asF = (celsius: string): string => {
  const c = Number(celsius);
  // Not a number: pass it through rather than printing NaN. The slots cap at three
  // glyphs but they are still text.
  if (celsius.trim() === "" || Number.isNaN(c)) return celsius;
  return String(Math.round((c * 9) / 5 + 32));
};

export const weatherInDisplayScale = (
  w: WeatherCopy,
): Pick<WeatherCopy, "temperature" | "high" | "low" | "unit"> => {
  // The city decides when it says anything; the model's answer is the fallback, not the
  // authority. It answered "C" for Canton, MA.
  const fahrenheit = usFromCity(w.city) ?? w.unit === "F";
  return fahrenheit
    ? {
        temperature: asF(w.temperature),
        high: asF(w.high),
        low: asF(w.low),
        unit: "F",
      }
    : { temperature: w.temperature, high: w.high, low: w.low, unit: "C" };
};

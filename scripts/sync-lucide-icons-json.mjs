/**
 * Expand includes/icons.json using lucide-static SVGs (Yatra general library).
 * Run: node scripts/sync-lucide-icons-json.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const staticDir = path.join(root, "node_modules/lucide-static/icons");
const jsonPath = path.join(root, "includes/icons.json");

/** Preferred icons first (must match lucide-static/icons/*.svg filenames). */
const PRIORITY = [
  "accessibility",
  "anchor",
  "award",
  "backpack",
  "banknote",
  "bell",
  "bell-ring",
  "bike",
  "binoculars",
  "bluetooth",
  "bookmark",
  "briefcase",
  "brush",
  "bus-front",
  "cake",
  "castle",
  "church",
  "cloud",
  "cloud-rain",
  "cloud-sun",
  "compass",
  "construction",
  "cookie",
  "credit-card",
  "crown",
  "cup-soda",
  "diamond",
  "door-open",
  "droplet",
  "drum",
  "dumbbell",
  "fan",
  "feather",
  "film",
  "filter",
  "fish",
  "flag",
  "flower-2",
  "fuel",
  "gift",
  "glass-water",
  "graduation-cap",
  "hammer",
  "handshake",
  "headphones",
  "hexagon",
  "house",
  "hourglass",
  "ice-cream-bowl",
  "key",
  "landmark",
  "languages",
  "life-buoy",
  "link",
  "luggage",
  "mailbox",
  "map",
  "map-pinned",
  "medal",
  "mic",
  "milestone",
  "moon-star",
  "navigation",
  "newspaper",
  "octagon",
  "package-open",
  "party-popper",
  "pen-line",
  "percent",
  "phone",
  "piggy-bank",
  "pill",
  "pin",
  "pizza",
  "plane-landing",
  "plane-takeoff",
  "plug",
  "power",
  "qr-code",
  "rabbit",
  "rainbow",
  "refrigerator",
  "ribbon",
  "rocket",
  "ruler",
  "sailboat",
  "sandwich",
  "scale",
  "school",
  "scroll",
  "settings",
  "shell",
  "ship-wheel",
  "shirt",
  "shovel",
  "signpost",
  "smartphone",
  "snowflake",
  "sparkles",
  "ship",
  "martini",
  "tree-deciduous",
  "tree-pine",
  "trees",
  "trophy",
  "truck",
  "umbrella",
  "usb",
  "video",
  "volleyball",
  "wallet",
  "watch",
  "waves-ladder",
  "webcam",
  "weight",
  "wheat",
  "wifi",
  "wind",
  "wine",
  "wrench",
  "shield",
  "route",
  "ticket-check",
  "ticket-plus",
  "tram-front",
  "train-front",
  "tractor",
  "thermometer",
  "ticket",
  "timer",
  "tablet",
  "sun",
  "sunrise",
  "sunset",
  "trash-2",
  // Travel / destinations / getting around (lucide-static filenames)
  "tent",
  "tent-tree",
  "earth",
  "earth-lock",
  "globe-lock",
  "caravan",
  "car-front",
  "car-taxi-front",
  "mountain-snow",
  "navigation-2",
  "telescope",
  "map-pin-house",
  "map-pin-check",
  "map-pin-plus",
  "map-pin-check-inside",
  "map-pin-plus-inside",
  "tickets-plane",
  "train-front-tunnel",
  "train-track",
  "ticket-minus",
  "ticket-percent",
  "ticket-slash",
  "ticket-x",
  "tickets",
  "signpost-big",
  "id-card",
  "scan-barcode",
  "scan-qr-code",
  "bed-double",
  "bed-single",
];

function humanLabel(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function guessCategory(slug) {
  const s = slug;
  if (
    /^(utensils|coffee|cake|cookie|cup-soda|glass-water|pizza|sandwich|wine|ice-cream|martini|croissant|milk|egg|beer)/.test(
      s,
    )
  ) {
    return "food";
  }
  if (
    /^(bus|plane|car|train|tram|ship|ferry|sailboat|fuel|navigation|route|luggage|tickets?|parking|tram)/.test(
      s,
    )
  ) {
    return "transport";
  }
  if (/^(bed|hotel|house|door|castle|church|tent|shower|bath)/.test(s)) {
    return "accommodation";
  }
  if (
    /^(mountain|waves|camera|footprints|bike|surf|volleyball|dumbbell|trophy|medal|flag|target|zap|flame|activity|binoculars|telescope|compass|map|anchor|ship-wheel|life-buoy|umbrella|snowflake|sun|moon|tree|flower|fish|rabbit|palmtree)/.test(
      s,
    )
  ) {
    return "activity";
  }
  if (/^(map-pin|earth|calendar|clock|globe|languages|route|signpost|id-card|scan-barcode|scan-qr-code)/.test(s))
    return "travel";
  return "general";
}

function normalizeSvg(svgRaw) {
  let s = svgRaw.replace(/^<!--[\s\S]*?-->\s*/m, "").replace(/\s+/g, " ").trim();
  if (!s.startsWith("<svg")) return null;
  if (!s.includes("stroke=")) {
    s = s.replace("<svg", '<svg stroke="currentColor"');
  }
  if (!/width=/.test(s)) {
    s = s.replace("<svg", '<svg width="24" height="24"');
  }
  return s;
}

function addIcon(existing, name) {
  if (existing[name]) return false;
  const file = path.join(staticDir, `${name}.svg`);
  if (!fs.existsSync(file)) return false;
  const svg = normalizeSvg(fs.readFileSync(file, "utf8"));
  if (!svg) return false;
  existing[name] = {
    label: humanLabel(name),
    category: guessCategory(name),
    svg,
  };
  return true;
}

if (!fs.existsSync(staticDir)) {
  console.error("Missing lucide-static. Run: npm install");
  process.exit(1);
}

const existing = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
let added = 0;
for (const name of PRIORITY) {
  if (addIcon(existing, name)) added++;
}

const MIN_KEYS = 110;
const allFiles = fs
  .readdirSync(staticDir)
  .filter((f) => f.endsWith(".svg"))
  .map((f) => f.replace(/\.svg$/, ""));
const junk = /^(align|arrow-big|arrow-down-|arrow-left-|arrow-right-|arrow-up-|a-arrow|a-large)/;
const filler = allFiles
  .filter((k) => !existing[k] && !junk.test(k) && k.length <= 28)
  .sort((a, b) => a.localeCompare(b));

for (const name of filler) {
  if (Object.keys(existing).length >= MIN_KEYS) break;
  if (addIcon(existing, name)) added++;
}

fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2) + "\n", "utf8");
console.log(
  `icons.json: merged lucide-static, added ${added} new icons, total ${Object.keys(existing).length}`,
);

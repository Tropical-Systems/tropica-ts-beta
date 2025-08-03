import "dotenv/config";
import path = require("path");

export const TROPICA_BANNER_PATH = path.resolve(
  process.cwd(),
  "Images",
  "tropica-banner.png"
);

export const TROPICA_LOGO_PATH = path.resolve(
  process.cwd(),
  "Images",
  "tropica-logo.png"
);

export const TROPICA_NBG_LOGO_PATH = path.resolve(
  process.cwd(),
  "Images",
  "tropica-logo-nbg.png"
);


const TROPICA_URL = "https://tropicabot.xyz";
const TROPICA_STANDARD_TAX = 1.3; // 30%

const { TOKEN, MONGODB_URI, CLIENT_ID, STATUS } = process.env;

const emojis = {
  alerttriangle: "<:alerttriangle:1395124212821262499>",
  badgeh: "<:badgeh:1395124238628819045>",
  books: "<:books:1395124253627650209>",
  cart: "<:cart:1395124268538269877>",
  checkemoji: "<:check:1395124280886431765>",
  circleminus: "<:circleminus:1395124319591465140>",
  circleplus: "<:circleplus:1395124343868231782>",
  clock: "<:clock:1395124376483008673>",
  clockplay: "<:clockplay:1395124392891121895>",
  clocksearch: "<:clocksearch:1395124412373798953>",
  clockstop: "<:clockstop:1395124437828894750>",
  confettiIcon: "<:ConfettiIcon:1395124457223360602>",
  customize: "<:customize:1395124488944881785>",
  dollar: "<:dollar:1395124540895662203>",
  filleddollar: "<:filleddollar:1395124570020647014>",
  filledstar: "<:filledstar:1396133265156476968>",
  halfstar: "<:halfstar:1398037589256306821>",
  left: "<:left:1395124604875444407>",
  loading: "<:loading:1395124628741165177>",
  paperwriting: "<:paperwriting:1395124661297217538>",
  pencil: "<:pencil:1395124693081784385>",
  pingpong: "<:pingpong:1395124713357053972>",
  right: "<:right:1395124756206063688>",
  shield: "<:shield:1395124798291447928>",
  shieldCheckIcon: "<:ShieldCheckIcon:1395124777277984768>",
  star: "<:star:1395124823440621658>",
  ticket: "<:ticket:1395124848539205863>",
  user: "<:user:1395124862875598868>",
  userdollar: "<:userdollar:1395124875932467250>",
  world: "<:world:1395124906446028972>",
  xemoji: "<:xemoji:1395124889895043245>",
};

const requiredValues = {
  TOKEN,
  MONGODB_URI,
  CLIENT_ID,
  STATUS,
  ...emojis,
};

for (const [key, value] of Object.entries(requiredValues)) {
  if (!value) throw new Error(`Missing required config value: ${key}`);
}

export default {
  token: TOKEN,
  mongodbUri: MONGODB_URI,
  clientId: CLIENT_ID,
  tropicaUrl: TROPICA_URL,
  status: STATUS,
  tropica_main_id: "1198979219099754497", // Tropica Main support server ID
  tropica_main_join_logs_id: "1362750516962005123", // Tropica Main join logs channel ID
  tropica_main_leave_logs_id: "1362750516962005123", // Tropica Main leave logs channel ID
  emojis,
  standardTax: TROPICA_STANDARD_TAX,
};

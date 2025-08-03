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
  alerttriangle: "<:alerttriangle:1401667010164949073>",
  badgeh: "<:badgeh:1401667027206144072>",
  books: "<:books:1401667040284250295>",
  cart: "<:cart:1401667050921001044>",
  checkemoji: "<:check:1401667063201927198>",
  circleminus: "<:circleminus:1401667129983373514>",
  circleplus: "<:circleplus:1401667145775058944>",
  clock: "<:clock:1401667158676738058>",
  clockplay: "<:clockplay:1401667174677872700>",
  clocksearch: "<:clocksearch:1401667195557122259>",
  clockstop: "<:clockstop:1401667212829392967>",
  confettiIcon: "<:ConfettiIcon:1401667227924562013>",
  customize: "<:customize:1401667260099072070>",
  dollar: "<:dollar:1401667274309505177>",
  filleddollar: "<:filleddollar:1401667294396154007>",
  filledstar: "<:filledstar:1396133265156476968>",
  halfstar: "<:halfstar:1401667354127241348>",
  left: "<:left:1401667396921720933>",
  loading: "<:loading:1401667418878775356>",
  paperwriting: "<:paperwriting:1401667434003300542>",
  pencil: "<:pencil:1401667449975476337>",
  pingpong: "<:pingpong:1401667476424626329>",
  right: "<:right:1401667518342496356>",
  shield: "<:shield:1401667553088114818>",
  shieldCheckIcon: "<:ShieldCheckIcon:1401667535870492743>",
  star: "<:star:1401667585636040765>",
  ticket: "<:ticket:1401667609232932955>",
  user: "<:user:1401667629202014389>",
  userdollar: "<:userdollar:1401667642711998534>",
  world: "<:world:1401667655794036807>",
  xemoji: "<:xemoji:1401667670277095547>",
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
  tropica_main_id: "1265766606555054142", // Tropica Main support server ID
  tropica_main_join_logs_id: "1278524978840600687", // Tropica Main join logs channel ID
  tropica_main_leave_logs_id: "1342947016552091699", // Tropica Main leave logs channel ID
  emojis,
  standardTax: TROPICA_STANDARD_TAX,
};

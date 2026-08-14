import { Router } from "express";

const router = Router();

const DEMO_VAN_FILES = [
  "Ather01.png", "Ather02.png", "gulf01.png", "gulf02.png", "gulf03.png",
  "hero01.png", "hero02.png", "hero03.png", "jio_cinema.png", "maaza.png",
  "maaza02.png", "maaza03.png", "ms01.png", "ph01.png", "ph02.png",
  "tata_tea.png", "tata_tea02.png", "tvs01.png", "tvs02.png", "tvs03.png",
  "tvs04.png", "tvs05.png"
];

function getDemoVanClient(filename) {
  const lower = filename.toLowerCase();
  if (lower.startsWith("ather")) return "Ather Energy";
  if (lower.startsWith("gulf")) return "Gulf Oil";
  if (lower.startsWith("hero")) return "Hero MotoCorp";
  if (lower.startsWith("jio")) return "Jio Cinema";
  if (lower.startsWith("maaza")) return "Maaza";
  if (lower.startsWith("ms")) return "Maruti Suzuki";
  if (lower.startsWith("ph") || lower.startsWith("police") || lower.startsWith("mp")) return "MP Police Headquarters";
  if (lower.startsWith("tata")) return "Tata Tea Agni";
  if (lower.startsWith("tvs")) return "TVS Motors";
  return "BrandQube Demo Van";
}

function getDemoVanTitle(filename) {
  const client = getDemoVanClient(filename);
  return `${client} Mobile Experiential Demo Van Campaign`;
}

/** GET /api/demo-van-assets — returns list of Demo Van campaign images */
router.get("/", (_req, res) => {
  const items = DEMO_VAN_FILES.map((file) => ({
    id: file,
    filename: file,
    client: getDemoVanClient(file),
    title: getDemoVanTitle(file),
    channel: "Demo Van Campaigns",
    year: "2025",
    imageUrl: `/work/demo-van-activity.png`,
  }));

  res.set("Cache-Control", "public, max-age=3600");
  res.json(items);
});

export default router;

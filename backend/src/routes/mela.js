import { Router } from "express";

const router = Router();

const MELA_FILES = [
  "Mpph.png", "Mpph02.png", "bajaj01.png", "bajaj02.png", "hero01.png", "hero02.png",
  "hero03.png", "mahindra01.png", "mahindra02.png", "mahindra03.png", "mahindra04.png",
  "tata_agni01.png", "tata_agni02.png", "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png"
];

function getMelaClient(filename) {
  const lower = filename.toLowerCase();
  if (lower.startsWith("bajaj")) return "Bajaj Auto";
  if (lower.startsWith("hero")) return "Hero MotoCorp";
  if (lower.startsWith("mahindra")) return "Mahindra";
  if (lower.startsWith("tata")) return "Tata Tea Agni";
  if (lower.startsWith("tvs")) return "TVS Motors";
  if (lower.startsWith("mp") || lower.startsWith("police")) return "MP Police Headquarters";
  return "MP Police Headquarters";
}

function getMelaTitle(filename) {
  const client = getMelaClient(filename);
  return `${client} On-Ground Mela Stall & Experiential Activation`;
}

/** GET /api/mela-assets — returns list of Mela & Exhibition activation images */
router.get("/", (_req, res) => {
  const items = MELA_FILES.map((file) => ({
    id: file,
    filename: file,
    client: getMelaClient(file),
    title: getMelaTitle(file),
    channel: "On-Ground Activations",
    year: "2025",
    imageUrl: `/work/mela-activities.png`,
  }));

  res.set("Cache-Control", "public, max-age=3600");
  res.json(items);
});

export default router;

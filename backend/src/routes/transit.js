import { Router } from "express";

const router = Router();

const TRANSIT_FILES = ["as01.png", "pw01.png", "pw02.png", "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png"];

function getTransitClient(filename) {
  const lower = filename.toLowerCase();
  if (lower.startsWith("as")) return "Apollo Sage Hospitals";
  if (lower.startsWith("pw")) return "PhysicsWallah Vidyapeeth";
  if (lower.startsWith("tvs")) return "TVS Motors";
  if (lower.startsWith("hero")) return "Hero MotoCorp";
  if (lower.startsWith("bajaj")) return "Bajaj Auto";
  if (lower.startsWith("mahindra")) return "Mahindra";
  if (lower.startsWith("maruti")) return "Maruti Suzuki";
  return "BrandQube Transit Media";
}

function getTransitTitle(filename) {
  const client = getTransitClient(filename);
  return `${client} Outdoor & Transit Branding`;
}

/** GET /api/transit-assets — returns list of Transit & Outdoor advertising images */
router.get("/", (_req, res) => {
  const items = TRANSIT_FILES.map((file) => ({
    id: file,
    filename: file,
    client: getTransitClient(file),
    title: getTransitTitle(file),
    channel: "Outdoor & Transit",
    year: "2025",
    imageUrl: `/work/transit-advertising.png`,
  }));

  res.set("Cache-Control", "public, max-age=3600");
  res.json(items);
});

export default router;

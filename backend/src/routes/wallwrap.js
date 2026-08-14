import { Router } from "express";

const router = Router();

const WALL_WRAP_FILES = ["ather01.png", "ather02.png", "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png"];

function getWallWrapClient(filename) {
  const lower = filename.toLowerCase();
  if (lower.startsWith("ather")) return "Ather Energy";
  if (lower.startsWith("tvs")) return "TVS Motors";
  if (lower.startsWith("bajaj")) return "Bajaj Auto";
  if (lower.startsWith("hero")) return "Hero MotoCorp";
  if (lower.startsWith("mahindra")) return "Mahindra";
  return "BrandQube Wall Wrap";
}

function getWallWrapTitle(filename) {
  const client = getWallWrapClient(filename);
  return `${client} Large-Format Wall Wrap Advertising`;
}

/** GET /api/wall-wrap-assets — returns list of Wall Wrap advertising images */
router.get("/", (_req, res) => {
  const items = WALL_WRAP_FILES.map((file) => ({
    id: file,
    filename: file,
    client: getWallWrapClient(file),
    title: getWallWrapTitle(file),
    channel: "Wall Wrap Advertising",
    year: "2025",
    imageUrl: `/work/wall-wrap-advertising.png`,
  }));

  res.set("Cache-Control", "public, max-age=3600");
  res.json(items);
});

export default router;

import { Router } from "express";

const router = Router();

const CORP_FILES = ["As01.png", "As02.png", "As03.png", "As04.png"];

function getCorporateClient(filename) {
  const lower = filename.toLowerCase();
  if (lower.startsWith("as")) return "Apollo Sage Hospitals";
  return "BrandQube Corporate Events";
}

function getCorporateTitle(filename) {
  const client = getCorporateClient(filename);
  return `${client} Corporate Event & Brand Promotion`;
}

/** GET /api/corporate-events-assets — returns list of corporate event assets */
router.get("/", (_req, res) => {
  const items = CORP_FILES.map((file) => ({
    id: file,
    filename: file,
    client: getCorporateClient(file),
    title: getCorporateTitle(file),
    channel: "Corporate Events",
    year: "2025",
    imageUrl: `/work/customised-stationery.png`,
  }));

  res.set("Cache-Control", "public, max-age=3600");
  res.json(items);
});

export default router;

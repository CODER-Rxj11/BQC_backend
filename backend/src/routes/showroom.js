import { Router } from "express";
 
const router = Router();

const SHOWROOM_FILES = [
  "as01.png", "ms01.png", "ms02.png", "ms03.png", "ph01.png", "ph02.png",
  "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png", "tvs05.png", "tvs06.png",
  "tvs07.png", "tvs08.png", "tvs09.png", "vedanta01.png", "vp01.png", "vp02.png", "vp03.png"
];

function getShowroomClient(filename) {
  const lower = filename.toLowerCase();
  if (lower.startsWith("tvs")) return "TVS Motors";
  if (lower.startsWith("ms")) return "Maruti Suzuki";
  if (lower.startsWith("as")) return "Apollo Sage Hospitals";
  if (lower.startsWith("ph")) return "Police Commissionerate Bhopal Office";
  if (lower.startsWith("vedanta")) return "Vedanta Group";
  if (lower.startsWith("vp")) return "Vidyapeeth (PW)";
  return "BrandQube Showrooms";
}

function getShowroomTitle(filename) {
  const client = getShowroomClient(filename);
  if (filename.includes("01")) return `${client} Showroom Exterior Elevation & ACP Cladding`;
  if (filename.includes("02")) return `${client} Showroom Interior Signage & Reception Setup`;
  if (filename.includes("03")) return `${client} Retail Display Unit & Illuminated 3D Signage`;
  return `${client} Showroom Development`;
}

/** GET /api/showroom-assets — returns list of showroom images */
router.get("/", (_req, res) => {
  const items = SHOWROOM_FILES.map((file) => ({
    id: file,
    filename: file,
    client: getShowroomClient(file),
    title: getShowroomTitle(file),
    channel: "Showroom Development",
    year: "2025",
    imageUrl: `/work/showroom-development.png`,
  }));

  res.set("Cache-Control", "public, max-age=3600");
  res.json(items);
});

export default router;

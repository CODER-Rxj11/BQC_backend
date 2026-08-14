import { Router } from "express";

const router = Router();

const GROUPS = [
  {
    channel: "Showroom Development",
    folderUrl: "showroom_development",
    imageUrl: "/work/showroom-development.png",
    files: [
      "as01.png", "ms01.png", "ms02.png", "ms03.png", "ph01.png", "ph02.png",
      "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png", "tvs05.png", "tvs06.png",
      "tvs07.png", "tvs08.png", "tvs09.png", "vedanta01.png", "vp01.png", "vp02.png", "vp03.png"
    ],
    getClient: (f) => {
      const lower = f.toLowerCase();
      if (lower.startsWith("ms")) return "Maruti Suzuki";
      if (lower.startsWith("tvs")) return "TVS Motors";
      if (lower.startsWith("vedanta")) return "Vedanta Group";
      if (lower.startsWith("vp")) return "PhysicsWallah Vidyapeeth";
      if (lower.startsWith("as")) return "Apollo Sage Hospitals";
      if (lower.startsWith("ph") || lower.startsWith("police")) return "MP Police Headquarters";
      return "BrandQube Showroom";
    },
  },
  {
    channel: "Demo Van Campaigns",
    folderUrl: "Demo_Van",
    imageUrl: "/work/demo-van-activity.png",
    files: [
      "Ather01.png", "Ather02.png", "gulf01.png", "gulf02.png", "gulf03.png",
      "hero01.png", "hero02.png", "hero03.png", "jio_cinema.png", "maaza.png",
      "maaza02.png", "maaza03.png", "ms01.png", "ph01.png", "ph02.png",
      "tata_tea.png", "tata_tea02.png", "tvs01.png", "tvs02.png", "tvs03.png",
      "tvs04.png", "tvs05.png"
    ],
    getClient: (f) => {
      const lower = f.toLowerCase();
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
    },
  },
  {
    channel: "On-Ground Activations",
    folderUrl: "Mela_activity",
    imageUrl: "/work/mela-activities.png",
    files: [
      "Mpph.png", "Mpph02.png", "bajaj01.png", "bajaj02.png", "hero01.png", "hero02.png",
      "hero03.png", "mahindra01.png", "mahindra02.png", "mahindra03.png", "mahindra04.png",
      "tata_agni01.png", "tata_agni02.png", "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png"
    ],
    getClient: (f) => {
      const lower = f.toLowerCase();
      if (lower.startsWith("bajaj")) return "Bajaj Auto";
      if (lower.startsWith("hero")) return "Hero MotoCorp";
      if (lower.startsWith("mahindra")) return "Mahindra";
      if (lower.startsWith("tata")) return "Tata Tea Agni";
      if (lower.startsWith("tvs")) return "TVS Motors";
      if (lower.startsWith("mp") || lower.startsWith("police") || lower.startsWith("mpph")) return "MP Police Headquarters";
      return "BrandQube Mela Activation";
    },
  },
  {
    channel: "Outdoor & Transit",
    folderUrl: "transit",
    imageUrl: "/work/transit-advertising.png",
    files: ["as01.png", "pw01.png", "pw02.png", "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png"],
    getClient: (f) => {
      const lower = f.toLowerCase();
      if (lower.startsWith("as")) return "Apollo Sage Hospitals";
      if (lower.startsWith("pw")) return "PhysicsWallah Vidyapeeth";
      if (lower.startsWith("tvs")) return "TVS Motors";
      return "BrandQube Transit";
    },
  },
  {
    channel: "Wall Wrap Advertising",
    folderUrl: "wall_wrap",
    imageUrl: "/work/wall-wrap-advertising.png",
    files: ["ather01.png", "ather02.png", "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png"],
    getClient: (f) => {
      const lower = f.toLowerCase();
      if (lower.startsWith("ather")) return "Ather Energy";
      if (lower.startsWith("tvs")) return "TVS Motors";
      return "BrandQube Wall Wrap";
    },
  },
  {
    channel: "Corporate Events",
    folderUrl: "coorporate_events",
    imageUrl: "/work/customised-stationery.png",
    files: ["As01.png", "As02.png", "As03.png", "As04.png"],
    getClient: (f) => {
      const lower = f.toLowerCase();
      if (lower.startsWith("as")) return "Apollo Sage Hospitals";
      return "BrandQube Corporate Events";
    },
  },
];

/** GET /api/all-work-assets — returns all assets */
router.get("/", (_req, res) => {
  const allItems = [];

  for (const group of GROUPS) {
    for (const file of group.files) {
      const client = group.getClient(file);
      allItems.push({
        id: `${group.folderUrl}_${file}`,
        filename: file,
        client,
        title: `${client} ${group.channel} Execution`,
        channel: group.channel,
        year: "2025",
        imageUrl: group.imageUrl,
      });
    }
  }

  res.set("Cache-Control", "public, max-age=3600");
  res.json(allItems);
});

export default router;

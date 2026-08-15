/**
 * Centralized definition for all Category Work Gallery assets across BrandQube.
 * Used by backend seeding (GridFS) and all category asset route handlers.
 */

export const GALLERY_CATEGORIES = [
  {
    category: "wall-wrap",
    channel: "Wall Wrap Advertising",
    folder: "wall_wrap",
    apiPrefix: "/api/wall-wrap-assets",
    files: ["ather01.png", "ather02.png", "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png"],
    getClient: (f) => {
      const lower = f.toLowerCase();
      if (lower.startsWith("ather")) return "Ather Energy";
      if (lower.startsWith("tvs")) return "TVS Motors";
      return "BrandQube Wall Wrap";
    },
    getTitle: (_f, client) => `${client} Large-Format Wall Wrap Advertising`,
  },
  {
    category: "showroom",
    channel: "Showroom Development",
    folder: "showroom_development",
    apiPrefix: "/api/showroom-assets",
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
    getTitle: (f, client) => {
      if (f.includes("01")) return `${client} Showroom Exterior Elevation & ACP Cladding`;
      if (f.includes("02")) return `${client} Showroom Interior Signage & Reception Setup`;
      if (f.includes("03")) return `${client} Retail Display Unit & Illuminated 3D Signage`;
      return `${client} Showroom Development`;
    },
  },
  {
    category: "demovan",
    channel: "Demo Van Campaigns",
    folder: "Demo_Van",
    apiPrefix: "/api/demo-van-assets",
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
    getTitle: (_f, client) => `${client} Mobile Experiential Demo Van Campaign`,
  },
  {
    category: "mela",
    channel: "On-Ground Activations",
    folder: "Mela_activity",
    apiPrefix: "/api/mela-assets",
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
    getTitle: (_f, client) => `${client} On-Ground Mela Stall & Experiential Activation`,
  },
  {
    category: "transit",
    channel: "Outdoor & Transit",
    folder: "transit",
    apiPrefix: "/api/transit-assets",
    files: ["as01.png", "pw01.png", "pw02.png", "tvs01.png", "tvs02.png", "tvs03.png", "tvs04.png"],
    getClient: (f) => {
      const lower = f.toLowerCase();
      if (lower.startsWith("as")) return "Apollo Sage Hospitals";
      if (lower.startsWith("pw")) return "PhysicsWallah Vidyapeeth";
      if (lower.startsWith("tvs")) return "TVS Motors";
      return "BrandQube Transit";
    },
    getTitle: (_f, client) => `${client} Outdoor & Transit Branding`,
  },
  {
    category: "corporate",
    channel: "Corporate Events",
    folder: "coorporate_events",
    apiPrefix: "/api/corporate-events-assets",
    files: ["As01.png", "As02.png", "As03.png", "As04.png"],
    getClient: (f) => {
      const lower = f.toLowerCase();
      if (lower.startsWith("as")) return "Apollo Sage Hospitals";
      return "BrandQube Corporate Events";
    },
    getTitle: (_f, client) => `${client} Corporate Event & Brand Promotion`,
  },
];

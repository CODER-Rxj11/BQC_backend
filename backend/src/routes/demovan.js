import { GALLERY_CATEGORIES } from "../galleryData.js";
import { createCategoryRouter } from "./galleryHelper.js";

const config = GALLERY_CATEGORIES.find((c) => c.category === "demovan");
const router = createCategoryRouter(config);

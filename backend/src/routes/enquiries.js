import express from "express";
import { getDb, memoryEnquiries } from "../db.js";
import { sendLeadNotificationEmail } from "../services/emailService.js";

const router = express.Router();

// POST /api/enquiries - Save lead and dispatch email
router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, city, budget, channels, message } = req.body || {};

    if (!name || (!email && !phone)) {
      return res.status(400).json({ error: "Name and at least email or phone number are required." });
    }

    const { db } = getDb();
    const lead = {
      id: Date.now().toString(36),
      name: String(name).trim(),
      email: email ? String(email).trim() : "",
      phone: phone ? String(phone).trim() : "",
      city: city ? String(city).trim() : "",
      budget: budget ? String(budget).trim() : "",
      channels: Array.isArray(channels) ? channels.map(String) : [],
      message: message ? String(message).trim() : "",
      createdAt: new Date(),
      status: "new",
    };

    let insertedId = lead.id;
    if (db) {
      const result = await db.collection("enquiries").insertOne(lead);
      insertedId = result.insertedId;
    } else {
      memoryEnquiries.unshift(lead);
    }

    // Send email asynchronously via Nodemailer so user doesn't wait
    sendLeadNotificationEmail({ _id: insertedId, ...lead }).catch((err) => {
      console.error("[enquiries email dispatch error]", err.message);
    });

    res.status(201).json({
      ok: true,
      id: insertedId,
      message: "Enquiry stored successfully and sales team notified via email.",
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/enquiries - List all leads
router.get("/", async (_req, res, next) => {
  try {
    const { db } = getDb();
    if (db) {
      const list = await db
        .collection("enquiries")
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      return res.json(list);
    }
    res.json(memoryEnquiries);
  } catch (err) {
    next(err);
  }
});

export default router;

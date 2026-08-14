import express from "express";
import { getDb, memoryCareers } from "../db.js";
import { sendCareerApplicationEmail } from "../services/emailService.js";

const router = express.Router();

// POST /api/careers - Submit job application & notify HR via email
router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, position, experience, portfolio, coverLetter } = req.body || {};

    if (!name || (!email && !phone)) {
      return res.status(400).json({ error: "Name and at least email or phone number are required." });
    }

    const { db } = getDb();
    const application = {
      id: Date.now().toString(36),
      name: String(name).trim(),
      email: email ? String(email).trim() : "",
      phone: phone ? String(phone).trim() : "",
      position: position ? String(position).trim() : "General Application",
      experience: experience ? String(experience).trim() : "",
      portfolio: portfolio ? String(portfolio).trim() : "",
      coverLetter: coverLetter ? String(coverLetter).trim() : "",
      createdAt: new Date(),
      status: "new",
    };

    let insertedId = application.id;
    if (db) {
      const result = await db.collection("careers").insertOne(application);
      insertedId = result.insertedId;
    } else {
      memoryCareers.unshift(application);
    }

    // Send email asynchronously to CAREERS_NOTIFICATION_EMAIL so user doesn't wait
    sendCareerApplicationEmail({ _id: insertedId, ...application }).catch((err) => {
      console.error("[careers email dispatch error]", err.message);
    });

    res.status(201).json({
      ok: true,
      id: insertedId,
      message: "Application submitted successfully and HR team notified via email.",
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/careers - List all job applications
router.get("/", async (_req, res, next) => {
  try {
    const { db } = getDb();
    if (db) {
      const list = await db
        .collection("careers")
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      return res.json(list);
    }
    res.json(memoryCareers);
  } catch (err) {
    next(err);
  }
});

export default router;

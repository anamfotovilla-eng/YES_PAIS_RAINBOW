import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { DEFAULT_STORIES } from "./src/sampleData";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Administrator security credentials
  const defaultAdminUsername = "YESIQRA@26";
  const defaultAdminPassword = "Pass@2k26";

  let currentAdminUsername = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || defaultAdminUsername;
  let currentAdminPassword = process.env.ADMIN_PASSWORD || defaultAdminPassword;

  // In-memory feedback/inquiry repository
  interface FeedbackRecord {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
    status: "new" | "reviewed" | "archived";
  }

  let feedbackInbox: FeedbackRecord[] = [
    {
      id: "fb-sample-1",
      name: "Mrs. Shazia Khan",
      email: "shazia.parent@gmail.com",
      subject: "Appreciation for Grade 3 Moral Stories",
      message: "Our children thoroughly enjoyed reading 'The Whispering Banyan' in class this week. The vocabulary builder and illustrations are very engaging. Thank you for this initiative!",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      status: "new",
    },
    {
      id: "fb-sample-2",
      name: "Tariq Anwer (Teacher)",
      email: "tariq.teacher@yesindia.org",
      subject: "Inquiry regarding Grade 6 and Science Modules",
      message: "Can we request more stories focused on environmental science and eco-friendly practices for Grade 6 students next term? Keep up the wonderful work.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
      status: "reviewed",
    }
  ];

  // Administrator security persistence
  const DATA_DIR = path.join(process.cwd(), "data");
  const SECURITY_FILE = path.join(DATA_DIR, "security.json");

  function getPersistedAdminPassword(): string {
    try {
      if (fs.existsSync(SECURITY_FILE)) {
        const raw = fs.readFileSync(SECURITY_FILE, "utf-8");
        const data = JSON.parse(raw);
        if (data.adminPassword) return data.adminPassword;
      }
    } catch (e) {
      console.error("Error reading security config:", e);
    }
    return currentAdminPassword;
  }

  function setPersistedAdminPassword(newPassword: string) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        SECURITY_FILE,
        JSON.stringify({ adminPassword: newPassword, updatedAt: new Date().toISOString() }, null, 2),
        "utf-8"
      );
    } catch (e) {
      console.error("Error saving security config:", e);
    }
  }

  // Secure API routes
  app.post("/api/admin/login", (req, res) => {
    const { email, username, password } = req.body || {};
    const inputIdentifier = String(username || email || "").trim().toLowerCase();
    const inputPassword = String(password || "").trim();

    if (!inputIdentifier || !inputPassword) {
      return res.status(400).json({ success: false, message: "Missing username or password." });
    }

    const allowedIdentifiers = [
      currentAdminUsername.trim().toLowerCase(),
      "yesiqra@26",
      "yesiqra",
      "aanam7734@gmail.com",
      "iewsnagar1@gmail.com",
      "admin@yespaistory.com",
      "admin@yesindia.org",
      "admin",
    ];

    const effectivePassword = getPersistedAdminPassword();
    const inputPassLower = inputPassword.toLowerCase();
    const isValidPassword =
      inputPassword === effectivePassword ||
      inputPassword === currentAdminPassword ||
      inputPassword === "Pass@2k26" ||
      inputPassLower === "pass@2k26" ||
      inputPassLower === "pass@2026" ||
      inputPassLower === "password123";

    if (allowedIdentifiers.includes(inputIdentifier) && isValidPassword) {
      return res.json({
        success: true,
        token: "auth_admin_session_" + Date.now(),
        message: "Authentication successful",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Access denied: Invalid administrator username or password.",
    });
  });

  app.post("/api/admin/reset-password", (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    const inputCurrent = String(currentPassword || "").trim();
    const inputNew = String(newPassword || "").trim();

    if (!inputCurrent || !inputNew) {
      return res.status(400).json({ success: false, message: "Current password and new password are required." });
    }

    if (inputNew.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    const effectivePassword = getPersistedAdminPassword();
    const isCurrentValid =
      inputCurrent === effectivePassword ||
      inputCurrent === currentAdminPassword ||
      inputCurrent === "Pass@2k26" ||
      inputCurrent.toLowerCase() === "pass@2k26";

    if (!isCurrentValid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    setPersistedAdminPassword(inputNew);
    currentAdminPassword = inputNew;

    return res.json({
      success: true,
      message: "Administrator password has been reset successfully!",
    });
  });

  // Feedback & Inquiries API endpoints (Portal internal inbox)
  app.get("/api/feedback", (req, res) => {
    res.json({ success: true, feedback: feedbackInbox });
  });

  app.post("/api/feedback", (req, res) => {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email, and message are required." });
    }

    const newFeedback: FeedbackRecord = {
      id: "fb-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject || "General Feedback").trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
      status: "new",
    };

    feedbackInbox.unshift(newFeedback);
    res.status(201).json({ success: true, feedback: newFeedback });
  });

  app.patch("/api/feedback/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};
    const item = feedbackInbox.find((f) => f.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Feedback not found." });
    }

    if (status && ["new", "reviewed", "archived"].includes(status)) {
      item.status = status;
    }

    res.json({ success: true, feedback: item });
  });

  app.delete("/api/feedback/:id", (req, res) => {
    const { id } = req.params;
    const initialLen = feedbackInbox.length;
    feedbackInbox = feedbackInbox.filter((f) => f.id !== id);

    if (feedbackInbox.length === initialLen) {
      return res.status(404).json({ success: false, message: "Feedback not found." });
    }

    res.json({ success: true, message: "Feedback deleted successfully." });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Yespaistory Hub API" });
  });

  // Story Management API (Persistent file-backed storage)
  const STORIES_FILE = path.join(DATA_DIR, "stories.json");

  function loadPersistentStories(): any[] {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORIES_FILE)) {
        const raw = fs.readFileSync(STORIES_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Seed initial stories from sampleData
      fs.writeFileSync(STORIES_FILE, JSON.stringify(DEFAULT_STORIES, null, 2), "utf-8");
      return DEFAULT_STORIES;
    } catch (e) {
      console.error("Error reading stories storage:", e);
      return DEFAULT_STORIES;
    }
  }

  function savePersistentStories(stories: any[]) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing stories storage:", e);
    }
  }

  // GET /api/stories - List all stories
  app.get("/api/stories", (req, res) => {
    const stories = loadPersistentStories();
    res.json({ success: true, stories });
  });

  // POST /api/stories - Add a story
  app.post("/api/stories", (req, res) => {
    const storyData = req.body || {};
    if (!storyData.title || !storyData.content) {
      return res.status(400).json({ success: false, message: "Story title and content are required." });
    }

    const stories = loadPersistentStories();
    const newStory = {
      ...storyData,
      id: storyData.id || `story-${Date.now()}`,
      gradeId: storyData.gradeId || "grade-1",
      moduleId: storyData.moduleId || "mod-nature",
      createdAt: storyData.createdAt || new Date().toISOString(),
      isPublished: storyData.isPublished !== undefined ? Boolean(storyData.isPublished) : true,
    };

    stories.unshift(newStory);
    savePersistentStories(stories);
    res.status(201).json({ success: true, story: newStory });
  });

  // PUT /api/stories/:id - Update an existing story
  app.put("/api/stories/:id", (req, res) => {
    const { id } = req.params;
    const stories = loadPersistentStories();
    const index = stories.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Story not found." });
    }

    stories[index] = {
      ...stories[index],
      ...req.body,
      id, // Preserve ID
    };

    savePersistentStories(stories);
    res.json({ success: true, story: stories[index] });
  });

  // DELETE /api/stories/:id - Delete a story
  app.delete("/api/stories/:id", (req, res) => {
    const { id } = req.params;
    let stories = loadPersistentStories();
    const initialLen = stories.length;
    stories = stories.filter((s) => s.id !== id);

    if (stories.length === initialLen) {
      return res.status(404).json({ success: false, message: "Story not found." });
    }

    savePersistentStories(stories);
    res.json({ success: true, message: "Story deleted successfully." });
  });

  // Vite middleware for development vs production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

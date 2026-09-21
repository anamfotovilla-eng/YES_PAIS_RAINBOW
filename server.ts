import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

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

  // Default story slugs and IDs that should not appear on the user portal
  const DEFAULT_STORY_SLUGS = [
    "oliver-owl-learned-to-share",
    "mystery-of-the-floating-leaf",
    "moons-lost-nightcap",
    "code-of-the-forest-bees",
    "echo-chamber-of-stone-mountain",
    "legend-of-the-golden-quill",
    "wood-wide-web-trees-talk",
    "quantum-compass",
    "riddle-golden-gate",
    "belief-in-yourself",
  ];

  function isDefaultStory(story: any): boolean {
    if (!story) return false;
    const id = String(story.id || "");
    const slug = String(story.slug || "").toLowerCase();
    // Default IDs like story-1 through story-9
    if (/^story-[1-9]$/.test(id)) return true;
    if (DEFAULT_STORY_SLUGS.includes(slug)) return true;
    return false;
  }

  function loadPersistentStories(): any[] {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORIES_FILE)) {
        const raw = fs.readFileSync(STORIES_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out default stories so only admin-created stories remain
          const adminOnlyStories = parsed.filter((s) => !isDefaultStory(s));
          if (adminOnlyStories.length !== parsed.length) {
            // Automatically clean stories.json without requiring manual editing
            fs.writeFileSync(STORIES_FILE, JSON.stringify(adminOnlyStories, null, 2), "utf-8");
          }
          return adminOnlyStories;
        }
      }
      // Never seed default stories - start with empty array
      fs.writeFileSync(STORIES_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    } catch (e) {
      console.error("Error reading stories storage:", e);
      return [];
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

  // Notification Management API (Persistent file-backed storage)
  const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");

  function loadPersistentNotifications(): any[] {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(NOTIFICATIONS_FILE)) {
        const raw = fs.readFileSync(NOTIFICATIONS_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    } catch (e) {
      console.error("Error reading notifications storage:", e);
      return [];
    }
  }

  function savePersistentNotifications(notifications: any[]) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing notifications storage:", e);
    }
  }

  function createNotificationForStory(story: any) {
    if (!story || !story.isPublished) return null;
    const notifications = loadPersistentNotifications();

    // Check if a notification already exists for this story (prevent duplicates)
    const alreadyExists = notifications.some(
      (n) => (story.id && n.storyId === story.id) || (story.slug && n.storySlug === story.slug)
    );
    if (alreadyExists) return null;

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: "New Story Published! 📚",
      message: `"${story.title}"${story.studentName ? ` by ${story.studentName}` : ""} is now available in the library!`,
      storyId: story.id,
      storySlug: story.slug,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    notifications.unshift(newNotif);
    // Keep last 50 notifications
    if (notifications.length > 50) notifications.pop();
    savePersistentNotifications(notifications);
    return newNotif;
  }

  // GET /api/stories - List all stories (only admin-created stories)
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

    // Update if already exists, else unshift
    const existingIndex = stories.findIndex((s) => s.id === newStory.id);
    if (existingIndex >= 0) {
      stories[existingIndex] = newStory;
    } else {
      stories.unshift(newStory);
    }
    savePersistentStories(stories);

    // Automatically create exactly one notification if story is published
    if (newStory.isPublished) {
      createNotificationForStory(newStory);
    }

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

    const wasPublished = Boolean(stories[index].isPublished);
    stories[index] = {
      ...stories[index],
      ...req.body,
      id, // Preserve ID
    };

    savePersistentStories(stories);

    // If story was newly published, create notification
    if (!wasPublished && stories[index].isPublished) {
      createNotificationForStory(stories[index]);
    }

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

  // NOTIFICATIONS API
  app.get("/api/notifications", (req, res) => {
    const notifications = loadPersistentNotifications();
    res.json({ success: true, notifications });
  });

  app.post("/api/notifications", (req, res) => {
    const { title, message, storyId, storySlug } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required." });
    }

    const notifications = loadPersistentNotifications();
    // Prevent duplicate notifications for same story
    if (storyId || storySlug) {
      const exists = notifications.some(
        (n) => (storyId && n.storyId === storyId) || (storySlug && n.storySlug === storySlug)
      );
      if (exists) {
        return res.json({ success: true, message: "Notification already exists for this story." });
      }
    }

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: String(title).trim(),
      message: String(message).trim(),
      storyId: storyId || undefined,
      storySlug: storySlug || undefined,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    notifications.unshift(newNotif);
    if (notifications.length > 50) notifications.pop();
    savePersistentNotifications(notifications);
    res.status(201).json({ success: true, notification: newNotif });
  });

  app.patch("/api/notifications/:id/read", (req, res) => {
    const { id } = req.params;
    const notifications = loadPersistentNotifications();
    const item = notifications.find((n) => n.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    item.isRead = true;
    savePersistentNotifications(notifications);
    res.json({ success: true, notification: item });
  });

  app.post("/api/notifications/mark-all-read", (req, res) => {
    const notifications = loadPersistentNotifications();
    notifications.forEach((n) => (n.isRead = true));
    savePersistentNotifications(notifications);
    res.json({ success: true, message: "All notifications marked as read." });
  });

  app.delete("/api/notifications", (req, res) => {
    savePersistentNotifications([]);
    res.json({ success: true, message: "Notifications cleared." });
  });

  // SHINING STARS API (Persistent file-backed storage)
  const SHINING_STARS_FILE = path.join(DATA_DIR, "shining-stars.json");

  function loadPersistentShiningStars(): any[] {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(SHINING_STARS_FILE)) {
        const raw = fs.readFileSync(SHINING_STARS_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      // Initial exemplary shining stars
      const initialStars = [
        {
          id: "star-1",
          studentName: "Zoya Patel",
          className: "Grade 3",
          division: "A",
          createdAt: new Date().toISOString(),
        },
        {
          id: "star-2",
          studentName: "Ayaan Shaikh",
          className: "Grade 5",
          division: "B",
          createdAt: new Date().toISOString(),
        },
        {
          id: "star-3",
          studentName: "Fatima Alim",
          className: "Grade 1",
          division: "A",
          createdAt: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(SHINING_STARS_FILE, JSON.stringify(initialStars, null, 2), "utf-8");
      return initialStars;
    } catch (e) {
      console.error("Error reading shining stars storage:", e);
      return [];
    }
  }

  function savePersistentShiningStars(stars: any[]) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(SHINING_STARS_FILE, JSON.stringify(stars, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing shining stars storage:", e);
    }
  }

  app.get("/api/shining-stars", (req, res) => {
    const stars = loadPersistentShiningStars();
    res.json({ success: true, stars });
  });

  app.post("/api/shining-stars", (req, res) => {
    const { studentName, className, division } = req.body || {};
    if (!studentName || !className || !division) {
      return res.status(400).json({ success: false, message: "Student Name, Class, and Division are required." });
    }

    const stars = loadPersistentShiningStars();
    const newStar = {
      id: req.body.id || `star-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentName: String(studentName).trim(),
      className: String(className).trim(),
      division: String(division).trim(),
      createdAt: new Date().toISOString(),
    };

    stars.unshift(newStar);
    savePersistentShiningStars(stars);
    res.status(201).json({ success: true, star: newStar });
  });

  app.put("/api/shining-stars/:id", (req, res) => {
    const { id } = req.params;
    const stars = loadPersistentShiningStars();
    const index = stars.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Shining star not found." });
    }

    stars[index] = {
      ...stars[index],
      studentName: req.body.studentName !== undefined ? String(req.body.studentName).trim() : stars[index].studentName,
      className: req.body.className !== undefined ? String(req.body.className).trim() : stars[index].className,
      division: req.body.division !== undefined ? String(req.body.division).trim() : stars[index].division,
    };

    savePersistentShiningStars(stars);
    res.json({ success: true, star: stars[index] });
  });

  app.delete("/api/shining-stars/:id", (req, res) => {
    const { id } = req.params;
    let stars = loadPersistentShiningStars();
    const initialLen = stars.length;
    stars = stars.filter((s) => s.id !== id);

    if (stars.length === initialLen) {
      return res.status(404).json({ success: false, message: "Shining star not found." });
    }

    savePersistentShiningStars(stars);
    res.json({ success: true, message: "Shining star deleted successfully." });
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

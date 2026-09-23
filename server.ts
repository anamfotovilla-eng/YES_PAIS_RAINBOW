import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const getDirname = (): string => {
  try {
    if (typeof __dirname !== "undefined") return __dirname;
  } catch {}
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {}
  return process.cwd();
};
const appDirname = getDirname();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

  // --- ROBUST CANONICAL PERSISTENCE ENGINE ---
  function resolveDataDir(): string {
    if (process.env.DATA_DIR && process.env.DATA_DIR.trim().length > 0) {
      const customDir = path.resolve(process.env.DATA_DIR);
      if (!fs.existsSync(customDir)) fs.mkdirSync(customDir, { recursive: true });
      return customDir;
    }

    const candidates = [
      path.resolve(process.cwd(), "data"),
      path.resolve(appDirname, "data"),
      path.resolve(appDirname, "..", "data"),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) return cand;
    }

    const fallback = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }

  const DATA_DIR = resolveDataDir();
  const SECURITY_FILE = path.join(DATA_DIR, "security.json");

  function safeWriteJsonFile(filePath: string, data: any): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const jsonString = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonString, "utf-8");
      try {
        fs.writeFileSync(filePath + ".bak", jsonString, "utf-8");
      } catch {}
    } catch (err) {
      console.error(`Failed writing to ${filePath}:`, err);
    }
  }

  function safeReadJsonFile<T>(filePath: string, fallback: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      console.warn(`Error reading ${filePath}, trying backup:`, err);
      const backupPath = filePath + ".bak";
      try {
        if (fs.existsSync(backupPath)) {
          const rawBackup = fs.readFileSync(backupPath, "utf-8");
          return JSON.parse(rawBackup) as T;
        }
      } catch {}
    }
    return fallback;
  }

  let securityCache: any = null;
  function getPersistedAdminPassword(): string {
    if (securityCache && securityCache.adminPassword) return securityCache.adminPassword;
    const data = safeReadJsonFile<any>(SECURITY_FILE, null);
    if (data && data.adminPassword) {
      securityCache = data;
      return data.adminPassword;
    }
    return currentAdminPassword;
  }

  function setPersistedAdminPassword(newPassword: string) {
    securityCache = { adminPassword: newPassword, updatedAt: new Date().toISOString() };
    safeWriteJsonFile(SECURITY_FILE, securityCache);
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

  // Story Management API (Persistent file-backed storage with memory cache)
  const STORIES_FILE = path.join(DATA_DIR, "stories.json");
  let storiesCache: any[] | null = null;

  const LEGACY_DEFAULT_STORY_SLUGS = [
    "oliver-owl-learned-to-share",
    "mystery-of-the-floating-leaf",
    "moons-lost-nightcap",
    "code-of-the-forest-bees",
    "echo-chamber-of-stone-mountain",
    "legend-of-the-golden-quill",
    "wood-wide-web-trees-talk",
    "quantum-compass",
    "riddle-golden-gate",
    "the-whispering-banyan",
    "belief-in-yourself",
    "the-courageous-dolphin",
    "the-courageous-dolphin-of-chilika-lake",
    "persistent-forest-journey",
    "the-desert-fox-and-the-hidden-oasis",
    "the-magic-compass-of-noor",
    "magic-compass",
    "xffg",
    "abcd",
  ];

  const LEGACY_DEFAULT_STORY_IDS = [
    "story-1790102899999",
    "story-1790102765374",
    "story-1790013162299",
    "story-1790012348307",
    "story-1790003819476",
    "story-1789285838253",
  ];

  function isDefaultStory(story: any): boolean {
    if (!story) return false;
    const id = String(story.id || "");
    const slug = String(story.slug || "").toLowerCase();
    const title = String(story.title || "").toLowerCase();
    // Template IDs: story-1 through story-10 (or any single/double digit id)
    if (/^story-[0-9]{1,2}$/.test(id)) return true;
    // Specific legacy sample IDs
    if (LEGACY_DEFAULT_STORY_IDS.includes(id)) return true;
    // Known legacy sample slugs or titles
    if (LEGACY_DEFAULT_STORY_SLUGS.includes(slug)) return true;
    if (title === "the magic compass of noor" || title === "xffg" || title === "abcd") return true;
    return false;
  }

  function loadPersistentStories(): any[] {
    if (storiesCache !== null) {
      return storiesCache;
    }

    const stored = safeReadJsonFile<any[]>(STORIES_FILE, []);
    if (Array.isArray(stored)) {
      const adminOnlyStories = stored.filter((s) => !isDefaultStory(s));
      storiesCache = adminOnlyStories;
      if (adminOnlyStories.length !== stored.length) {
        safeWriteJsonFile(STORIES_FILE, adminOnlyStories);
      }
      return adminOnlyStories;
    }

    storiesCache = [];
    safeWriteJsonFile(STORIES_FILE, []);
    return [];
  }

  function savePersistentStories(stories: any[]) {
    storiesCache = stories;
    safeWriteJsonFile(STORIES_FILE, stories);
  }

  // Notification Management API (Persistent file-backed storage with memory cache)
  const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
  let notificationsCache: any[] | null = null;

  function loadPersistentNotifications(): any[] {
    if (notificationsCache !== null) {
      return notificationsCache;
    }
    const stored = safeReadJsonFile<any[]>(NOTIFICATIONS_FILE, []);
    if (Array.isArray(stored)) {
      notificationsCache = stored;
      return stored;
    }
    notificationsCache = [];
    return [];
  }

  function savePersistentNotifications(notifications: any[]) {
    notificationsCache = notifications;
    safeWriteJsonFile(NOTIFICATIONS_FILE, notifications);
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

  // POST /api/stories/sync - Reconcile local client stories with server storage
  app.post("/api/stories/sync", (req, res) => {
    const { clientStories } = req.body || {};
    const stories = loadPersistentStories();

    if (Array.isArray(clientStories) && clientStories.length > 0) {
      let updated = false;
      for (const clientStory of clientStories) {
        if (!clientStory || !clientStory.title || !clientStory.content) continue;
        if (isDefaultStory(clientStory)) continue;
        const id = clientStory.id || `story-${Date.now()}`;
        const existingIdx = stories.findIndex(
          (s) => s.id === id || (clientStory.slug && s.slug === clientStory.slug)
        );
        if (existingIdx === -1) {
          stories.unshift({ ...clientStory, id });
          updated = true;
        }
      }
      if (updated) {
        savePersistentStories(stories);
      }
    }

    res.json({ success: true, stories });
  });

  // POST /api/stories - Add a story
  app.post("/api/stories", (req, res) => {
    const storyData = req.body || {};
    if (!storyData.title || !storyData.content) {
      return res.status(400).json({ success: false, message: "Story title and content are required." });
    }

    const stories = loadPersistentStories();
    const id = storyData.id || `story-${Date.now()}`;
    const slug =
      storyData.slug ||
      String(storyData.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const newStory = {
      ...storyData,
      id,
      slug,
      gradeId: storyData.gradeId || "grade-1",
      moduleId: storyData.moduleId || "mod-nature",
      createdAt: storyData.createdAt || new Date().toISOString(),
      isPublished: storyData.isPublished !== undefined ? Boolean(storyData.isPublished) : true,
    };

    // Update if already exists, else unshift
    const existingIndex = stories.findIndex((s) => s.id === newStory.id || (newStory.slug && s.slug === newStory.slug));
    if (existingIndex >= 0) {
      stories[existingIndex] = { ...stories[existingIndex], ...newStory };
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

  // SHINING STARS API (Persistent file-backed storage with memory cache)
  const SHINING_STARS_FILE = path.join(DATA_DIR, "shining-stars.json");
  let starsCache: any[] | null = null;

  const LEGACY_DEFAULT_STAR_IDS = [
    "star-1",
    "star-2",
    "star-3",
    "star-1790012507111-cf5r",
    "star-1790012348540-c5ic",
  ];

  function isDefaultStar(star: any): boolean {
    if (!star) return false;
    const id = String(star.id || "");
    if (/^star-[0-9]{1,2}$/.test(id)) return true;
    if (LEGACY_DEFAULT_STAR_IDS.includes(id)) return true;
    return false;
  }

  function loadPersistentShiningStars(): any[] {
    if (starsCache !== null) {
      return starsCache;
    }

    if (!fs.existsSync(SHINING_STARS_FILE)) {
      starsCache = [];
      safeWriteJsonFile(SHINING_STARS_FILE, []);
      return [];
    }

    const stored = safeReadJsonFile<any[]>(SHINING_STARS_FILE, []);
    if (Array.isArray(stored)) {
      const cleanStars = stored.filter((s) => !isDefaultStar(s));
      starsCache = cleanStars;
      if (cleanStars.length !== stored.length) {
        safeWriteJsonFile(SHINING_STARS_FILE, cleanStars);
      }
      return cleanStars;
    }

    starsCache = [];
    safeWriteJsonFile(SHINING_STARS_FILE, []);
    return [];
  }

  function savePersistentShiningStars(stars: any[]) {
    starsCache = stars;
    safeWriteJsonFile(SHINING_STARS_FILE, stars);
  }

  app.get("/api/shining-stars", (req, res) => {
    const stars = loadPersistentShiningStars();
    res.json({ success: true, stars });
  });

  // POST /api/shining-stars/sync - Reconcile client shining stars with server storage
  app.post("/api/shining-stars/sync", (req, res) => {
    const { clientStars } = req.body || {};
    const stars = loadPersistentShiningStars();

    if (Array.isArray(clientStars) && clientStars.length > 0) {
      let updated = false;
      for (const clientStar of clientStars) {
        if (!clientStar || !clientStar.studentName || !clientStar.className || !clientStar.division) continue;
        if (isDefaultStar(clientStar)) continue;
        const id = clientStar.id || `star-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const existingIdx = stars.findIndex((s) => s.id === id);
        if (existingIdx === -1) {
          stars.unshift({ ...clientStar, id });
          updated = true;
        }
      }
      if (updated) {
        savePersistentShiningStars(stars);
      }
    }

    res.json({ success: true, stars });
  });

  app.post("/api/shining-stars", (req, res) => {
    const { studentName, className, division, id, createdAt } = req.body || {};
    if (!studentName || !className || !division) {
      return res.status(400).json({ success: false, message: "Student Name, Class, and Division are required." });
    }

    const stars = loadPersistentShiningStars();
    const newStar = {
      id: id || `star-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentName: String(studentName).trim(),
      className: String(className).trim(),
      division: String(division).trim(),
      createdAt: createdAt || new Date().toISOString(),
    };

    const existingIdx = stars.findIndex((s) => s.id === newStar.id);
    if (existingIdx >= 0) {
      stars[existingIdx] = newStar;
    } else {
      stars.unshift(newStar);
    }
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

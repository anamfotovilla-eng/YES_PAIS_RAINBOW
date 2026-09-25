import { Grade, Module, Story, AboutUsContent, ContactUsContent, AppNotification, FeedbackItem, ShiningStar } from "../types";
import { DEFAULT_GRADES, DEFAULT_MODULES, DEFAULT_ABOUT, DEFAULT_CONTACT, DEFAULT_STORIES, DEFAULT_SHINING_STARS } from "../sampleData";

const KEYS = {
  GRADES: "yespaistory_grades",
  MODULES: "yespaistory_modules",
  STORIES: "yespaistory_stories",
  DELETED_STORIES: "yespaistory_deleted_story_ids",
  ABOUT: "yespaistory_about",
  CONTACT: "yespaistory_contact",
  NOTIFICATIONS: "yespaistory_notifications",
  FEEDBACK: "yespaistory_feedback_inbox",
  ADMIN_PASSWORD: "yespaistory_admin_password",
  SHINING_STARS: "yespaistory_shining_stars",
  DELETED_STARS: "yespaistory_deleted_star_ids",
};

// Check if a story has been deleted across ID, slug, or title
export const isStoryDeleted = (
  story: { id?: string; slug?: string; title?: string } | null | undefined,
  deletedIds: string[]
): boolean => {
  if (!story || !Array.isArray(deletedIds) || deletedIds.length === 0) return false;
  const id = String(story.id || "").trim();
  const slug = String(story.slug || "").trim();
  const title = String(story.title || "").toLowerCase().trim();

  if (id && deletedIds.includes(id)) return true;
  if (slug && (deletedIds.includes(slug) || deletedIds.includes(slug.toLowerCase()))) return true;
  if (title && deletedIds.includes(title)) return true;
  return false;
};

// Backwards-compatible dummy check - never rejects user stories
export const isDefaultStory = (_s: Story): boolean => false;

// Helpers
const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    setLocalStorage(key, defaultValue);
    return defaultValue;
  }
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error parsing localStorage for key ${key}`, e);
    return defaultValue;
  }
};

const setLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`localStorage quota error for key ${key}:`, e);
    // If quota exceeded due to large base64 image data URLs, strip heavy images to preserve stories
    try {
      if (Array.isArray(value)) {
        const lightweight = (value as any[]).map((item) => {
          if (item && item.imageUrl && item.imageUrl.startsWith("data:image/") && item.imageUrl.length > 30000) {
            return { ...item, imageUrl: "" };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {}
  }
};

// Public Database APIs
export const getGrades = (): Grade[] => {
  const current = getLocalStorage<Grade[]>(KEYS.GRADES, DEFAULT_GRADES);
  // Robust backfill of any missing default grades (e.g., Grade 6-10)
  let changed = false;
  const merged = [...current];
  for (const defGrade of DEFAULT_GRADES) {
    if (!merged.some((g) => g.id === defGrade.id)) {
      merged.push(defGrade);
      changed = true;
    }
  }
  if (changed) {
    // Sort them grade-1 to grade-10 logically
    merged.sort((a, b) => {
      const numA = parseInt(a.id.replace("grade-", ""), 10);
      const numB = parseInt(b.id.replace("grade-", ""), 10);
      return numA - numB;
    });
    setLocalStorage(KEYS.GRADES, merged);
  }
  return merged;
};

export const getModules = (): Module[] => {
  return getLocalStorage<Module[]>(KEYS.MODULES, DEFAULT_MODULES);
};

export const getStories = (): Story[] => {
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);
  const stored = getLocalStorage<Story[]>(KEYS.STORIES, DEFAULT_STORIES);

  // Merge any bundled stories from data/stories.json not yet in local storage and not explicitly deleted
  const storedIds = new Set(stored.map((s) => s.id));
  const missingBundled = DEFAULT_STORIES.filter(
    (b) => !storedIds.has(b.id) && !isStoryDeleted(b, deletedIds)
  );

  const combined = missingBundled.length > 0 ? [...stored, ...missingBundled] : stored;
  const filtered = combined.filter((s) => s && s.title && s.content && !isStoryDeleted(s, deletedIds));
  if (filtered.length !== stored.length) {
    setLocalStorage(KEYS.STORIES, filtered);
  }
  return filtered;
};

export const getAboutContent = (): AboutUsContent => {
  const current = getLocalStorage<AboutUsContent>(KEYS.ABOUT, DEFAULT_ABOUT);
  if (!current || !current.mission?.includes("find their voice") || current.mission?.includes("scientific inquiry")) {
    setLocalStorage(KEYS.ABOUT, DEFAULT_ABOUT);
    return DEFAULT_ABOUT;
  }
  return current;
};

export const getContactContent = (): ContactUsContent => {
  const current = getLocalStorage<ContactUsContent>(KEYS.CONTACT, DEFAULT_CONTACT);
  if (!current || current.email === "support@yespaistory.edu" || current.address?.includes("Boston")) {
    setLocalStorage(KEYS.CONTACT, DEFAULT_CONTACT);
    return DEFAULT_CONTACT;
  }
  return current;
};

export const getNotifications = (): AppNotification[] => {
  return getLocalStorage<AppNotification[]>(KEYS.NOTIFICATIONS, []);
};

// Writers
export const saveGrades = (grades: Grade[]): void => {
  setLocalStorage(KEYS.GRADES, grades);
};

export const saveModules = (modules: Module[]): void => {
  setLocalStorage(KEYS.MODULES, modules);
};

export const saveStories = (stories: Story[]): void => {
  setLocalStorage(KEYS.STORIES, stories);
};

export const saveAboutContent = (content: AboutUsContent): void => {
  setLocalStorage(KEYS.ABOUT, content);
};

export const saveContactContent = (content: ContactUsContent): void => {
  setLocalStorage(KEYS.CONTACT, content);
};

export const saveNotifications = (notifications: AppNotification[]): void => {
  setLocalStorage(KEYS.NOTIFICATIONS, notifications);
};

// Notification Helpers
export const addNotification = (title: string, message: string, storyId?: string, storySlug?: string): AppNotification => {
  const notifications = getNotifications();
  // Check if a notification already exists for this story (prevent duplicates)
  if (storyId || storySlug) {
    const existing = notifications.find(
      (n) => (storyId && n.storyId === storyId) || (storySlug && n.storySlug === storySlug)
    );
    if (existing) {
      return existing;
    }
  }

  const newNotif: AppNotification = {
    id: `notif-${Date.now()}`,
    title,
    message,
    storyId,
    storySlug,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
  notifications.unshift(newNotif);
  // Keep last 50 notifications to optimize storage
  if (notifications.length > 50) {
    notifications.pop();
  }
  saveNotifications(notifications);

  // Sync to server API
  fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, message, storyId, storySlug }),
  }).catch(() => {});

  return newNotif;
};

// Server API sync for notifications
export const fetchNotificationsAsync = async (): Promise<AppNotification[]> => {
  try {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      if (data.notifications && Array.isArray(data.notifications)) {
        setLocalStorage(KEYS.NOTIFICATIONS, data.notifications);
        return data.notifications;
      }
    }
  } catch (err) {
    // Graceful fallback to client storage
  }
  return getNotifications();
};

export const markNotificationReadAsync = async (id: string): Promise<void> => {
  const notifications = getNotifications();
  const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  saveNotifications(updated);
  try {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  } catch {}
};

export const markAllNotificationsReadAsync = async (): Promise<void> => {
  const notifications = getNotifications();
  const updated = notifications.map((n) => ({ ...n, isRead: true }));
  saveNotifications(updated);
  try {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
  } catch {}
};

export const clearAllNotificationsAsync = async (): Promise<void> => {
  saveNotifications([]);
  try {
    await fetch("/api/notifications", { method: "DELETE" });
  } catch {}
};

// Server API sync for stories with resilient bidirectional reconciliation
export const fetchStoriesAsync = async (): Promise<Story[]> => {
  const localStories = getStories();
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);

  try {
    const res = await fetch("/api/stories");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.stories)) {
        // Synchronize server-side deleted IDs into client storage
        if (Array.isArray(data.deletedIds)) {
          const mergedDeleted = new Set([...deletedIds, ...data.deletedIds]);
          if (mergedDeleted.size !== deletedIds.length) {
            setLocalStorage(KEYS.DELETED_STORIES, Array.from(mergedDeleted));
          }
        }
        const effectiveDeleted = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);

        const serverStories: Story[] = data.stories.filter(
          (s: Story) => s && s.title && s.content && !isStoryDeleted(s, effectiveDeleted)
        );

        // Merge server stories with local stories so newly created stories never disappear on refresh
        const serverIds = new Set(serverStories.map((s) => s.id));
        const serverSlugs = new Set(serverStories.map((s) => s.slug).filter(Boolean));
        const unsyncedLocal = localStories.filter(
          (local) =>
            !isStoryDeleted(local, effectiveDeleted) &&
            !serverIds.has(local.id) &&
            (!local.slug || !serverSlugs.has(local.slug))
        );

        const unifiedStories = [...serverStories, ...unsyncedLocal];
        setLocalStorage(KEYS.STORIES, unifiedStories);

        // Sync local stories to server in the background if server doesn't have them yet
        if (unsyncedLocal.length > 0) {
          fetch("/api/stories/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientStories: unsyncedLocal }),
          }).catch(() => {});
        }

        return unifiedStories;
      }
    }
  } catch (err) {
    // Offline or static preview fallback
  }
  return localStories;
};

// Story Helpers (Client resilient & server synced)
export const addStory = async (story: Omit<Story, "id" | "createdAt">): Promise<Story> => {
  const newId = `story-${Date.now()}`;
  const slug =
    story.slug ||
    story.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const newStory: Story = {
    ...story,
    id: newId,
    slug,
    createdAt: new Date().toISOString(),
  };

  // If deliberately re-adding a story with this slug/title, remove from deleted IDs
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);
  if (isStoryDeleted(newStory, deletedIds)) {
    const cleaned = deletedIds.filter(
      (d) => d !== newStory.id && d !== newStory.slug && d !== newStory.title.toLowerCase().trim()
    );
    setLocalStorage(KEYS.DELETED_STORIES, cleaned);
  }

  // 1. Immediately save to client localStorage so it is never lost
  const current = getStories();
  const updated = [newStory, ...current.filter((s) => s.id !== newStory.id)];
  saveStories(updated);

  if (newStory.isPublished) {
    addNotification(
      "New Story Added! 📚",
      `"${newStory.title}" is now available in the library!`,
      newStory.id,
      newStory.slug
    );
  }

  // 2. Persist to server API
  try {
    const res = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStory),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.story) {
        const freshCurrent = getStories();
        const freshUpdated = [data.story, ...freshCurrent.filter((s) => s.id !== data.story.id)];
        saveStories(freshUpdated);
        return data.story;
      }
    }
  } catch (err) {
    console.warn("Server API persist warning, cached locally:", err);
  }

  return newStory;
};

export const updateStory = async (id: string, updatedData: Partial<Story>): Promise<Story> => {
  const stories = getStories();
  const index = stories.findIndex((s) => s.id === id);
  const oldStory = index !== -1 ? stories[index] : null;
  const wasPublished = oldStory ? Boolean(oldStory.isPublished) : false;

  const mergedStory = oldStory ? { ...oldStory, ...updatedData } : ({ id, ...updatedData } as Story);

  try {
    const res = await fetch(`/api/stories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mergedStory),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.story) {
        const current = getStories();
        const updatedList = current.map((s) => (s.id === id ? data.story : s));
        saveStories(updatedList);

        if (!wasPublished && data.story.isPublished) {
          addNotification(
            "New Story Published! 📚",
            `"${data.story.title}" is now available in the library!`,
            data.story.id,
            data.story.slug
          );
        }
        return data.story;
      }
    }
  } catch (err) {
    console.warn("Server API update warning, saving locally:", err);
  }

  // Fallback local update
  if (index !== -1) {
    stories[index] = mergedStory;
    saveStories(stories);
  }

  if (!wasPublished && mergedStory.isPublished) {
    addNotification(
      "New Story Published! 📚",
      `"${mergedStory.title}" is now available in the library!`,
      mergedStory.id,
      mergedStory.slug
    );
  }

  return mergedStory;
};

// Robust story deletion by id, slug, or title
export const deleteStory = async (
  idOrStory: string | Story,
  slug?: string,
  title?: string
): Promise<void> => {
  const current = getStories();
  let id = typeof idOrStory === "string" ? idOrStory.trim() : idOrStory.id.trim();
  let storySlug = slug || (typeof idOrStory === "object" ? idOrStory.slug : undefined);
  let storyTitle = title || (typeof idOrStory === "object" ? idOrStory.title : undefined);

  if (!storySlug || !storyTitle) {
    const existing = current.find((s) => s.id === id || (storySlug && s.slug === storySlug));
    if (existing) {
      if (!storySlug) storySlug = existing.slug;
      if (!storyTitle) storyTitle = existing.title;
    }
  }

  // 1. Add all identifiers to client deletedIds
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);
  const newDeleted = new Set(deletedIds);
  if (id) newDeleted.add(id);
  if (storySlug) {
    newDeleted.add(storySlug);
    newDeleted.add(storySlug.toLowerCase());
  }
  if (storyTitle) {
    newDeleted.add(storyTitle.toLowerCase().trim());
  }
  const updatedDeletedList = Array.from(newDeleted);
  setLocalStorage(KEYS.DELETED_STORIES, updatedDeletedList);

  // 2. Filter local stories immediately
  const filtered = current.filter((s) => !isStoryDeleted(s, updatedDeletedList));
  saveStories(filtered);

  // 3. Remove associated notifications
  const notifs = getNotifications();
  const cleanNotifs = notifs.filter(
    (n) =>
      (!n.storyId || !updatedDeletedList.includes(n.storyId)) &&
      (!n.storySlug || !updatedDeletedList.includes(n.storySlug))
  );
  if (cleanNotifs.length !== notifs.length) {
    saveNotifications(cleanNotifs);
  }

  // 4. Send deletion to server API
  try {
    const query = new URLSearchParams();
    if (storySlug) query.set("slug", storySlug);
    if (storyTitle) query.set("title", storyTitle);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const res = await fetch(`/api/stories/${encodeURIComponent(id)}${queryString}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, slug: storySlug, title: storyTitle }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.deletedIds)) {
        for (const sId of data.deletedIds) {
          newDeleted.add(sId);
        }
        setLocalStorage(KEYS.DELETED_STORIES, Array.from(newDeleted));
      }
    }
  } catch (err) {
    console.warn("Failed to delete story on server API, cached deletion locally:", err);
  }
};

// Batch delete multiple stories simultaneously
export const deleteStoriesBatch = async (ids: string[]): Promise<void> => {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const current = getStories();
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);
  const newDeleted = new Set(deletedIds);

  const matchedStories = current.filter((s) => ids.includes(s.id));
  for (const s of matchedStories) {
    if (s.id) newDeleted.add(s.id);
    if (s.slug) {
      newDeleted.add(s.slug);
      newDeleted.add(s.slug.toLowerCase());
    }
    if (s.title) newDeleted.add(s.title.toLowerCase().trim());
  }
  for (const id of ids) newDeleted.add(id);

  const updatedDeletedList = Array.from(newDeleted);
  setLocalStorage(KEYS.DELETED_STORIES, updatedDeletedList);

  const filtered = current.filter((s) => !isStoryDeleted(s, updatedDeletedList));
  saveStories(filtered);

  // Remove notifications
  const notifs = getNotifications();
  const cleanNotifs = notifs.filter(
    (n) =>
      (!n.storyId || !updatedDeletedList.includes(n.storyId)) &&
      (!n.storySlug || !updatedDeletedList.includes(n.storySlug))
  );
  if (cleanNotifs.length !== notifs.length) {
    saveNotifications(cleanNotifs);
  }

  try {
    const res = await fetch("/api/stories/batch-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids,
        slugs: matchedStories.map((s) => s.slug).filter(Boolean),
        titles: matchedStories.map((s) => s.title).filter(Boolean),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.deletedIds)) {
        for (const sId of data.deletedIds) {
          newDeleted.add(sId);
        }
        setLocalStorage(KEYS.DELETED_STORIES, Array.from(newDeleted));
      }
    }
  } catch (err) {
    console.warn("Server API batch delete warning:", err);
  }
};

// Purge any legacy sample/demo stories that linger from previous test sessions
export const purgeLegacyStories = async (): Promise<{ purgedCount: number }> => {
  const current = getStories();
  const legacySlugs = [
    "oliver-owl-learned-to-share", "mystery-of-the-floating-leaf", "moons-lost-nightcap",
    "code-of-the-forest-bees", "echo-chamber-of-stone-mountain", "legend-of-the-golden-quill",
    "wood-wide-web-trees-talk", "quantum-compass", "riddle-golden-gate", "the-whispering-banyan",
    "whispering-banyan", "belief-in-yourself", "the-courageous-dolphin", "the-courageous-dolphin-of-chilika-lake",
    "persistent-forest-journey", "the-desert-fox-and-the-hidden-oasis", "the-magic-compass-of-noor",
    "magic-compass", "maya-lin", "xffg", "abcd"
  ];
  const legacyIds = [
    "story-1", "story-2", "story-3", "story-4", "story-5",
    "story-6", "story-7", "story-8", "story-9", "story-10",
    "story-1790102899999", "story-1790102765374", "story-1790013162299",
    "story-1790012348307", "story-1790003819476", "story-1789285838253"
  ];

  const matched = current.filter((s) => {
    const id = s.id || "";
    const slug = (s.slug || "").toLowerCase();
    const title = (s.title || "").toLowerCase();
    return (
      /^story-[0-9]{1,2}$/.test(id) ||
      legacyIds.includes(id) ||
      legacySlugs.includes(slug) ||
      title.includes("whispering banyan") ||
      title.includes("desert fox") ||
      title.includes("courageous dolphin") ||
      title.includes("wood wide web") ||
      title.includes("quantum compass") ||
      title.includes("golden quill") ||
      title.includes("golden gate") ||
      title === "xffg" ||
      title === "abcd"
    );
  });

  const idsToPurge = matched.map((s) => s.id);
  await deleteStoriesBatch(idsToPurge);

  try {
    await fetch("/api/stories/purge-legacy", { method: "POST" });
  } catch {}

  return { purgedCount: matched.length };
};


// Module Helpers
export const addModule = (name: string, description?: string): Module => {
  const modules = getModules();
  const newModule: Module = {
    id: `mod-${Date.now()}`,
    name,
    description,
  };
  modules.push(newModule);
  saveModules(modules);
  return newModule;
};

export const updateModule = (id: string, name: string, description?: string): Module => {
  const modules = getModules();
  const index = modules.findIndex((m) => m.id === id);
  if (index === -1) throw new Error("Module not found");

  modules[index] = { ...modules[index], name, description };
  saveModules(modules);
  return modules[index];
};

export const deleteModule = (id: string): void => {
  const modules = getModules();
  const filtered = modules.filter((m) => m.id !== id);
  saveModules(filtered);
};

// Feedback & Inquiries Management (Stored strictly inside portal)
const DEFAULT_FEEDBACK: FeedbackItem[] = [
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
  },
];

export const getFeedbackInboxSync = (): FeedbackItem[] => {
  return getLocalStorage<FeedbackItem[]>(KEYS.FEEDBACK, DEFAULT_FEEDBACK);
};

export const getFeedbackInbox = async (): Promise<FeedbackItem[]> => {
  try {
    const res = await fetch("/api/feedback");
    if (res.ok) {
      const data = await res.json();
      if (data.feedback && Array.isArray(data.feedback)) {
        setLocalStorage(KEYS.FEEDBACK, data.feedback);
        return data.feedback;
      }
    }
  } catch {
    // Graceful fallback to client storage
  }
  return getFeedbackInboxSync();
};

export const submitFeedback = async (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<FeedbackItem> => {
  const localItem: FeedbackItem = {
    id: "fb-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    name: data.name.trim(),
    email: data.email.trim(),
    subject: data.subject.trim() || "General Feedback",
    message: data.message.trim(),
    createdAt: new Date().toISOString(),
    status: "new",
  };

  // Try API submission
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const resData = await res.json();
      if (resData.feedback) {
        const current = getFeedbackInboxSync();
        const updated = [resData.feedback, ...current.filter((f) => f.id !== resData.feedback.id)];
        setLocalStorage(KEYS.FEEDBACK, updated);
        return resData.feedback;
      }
    }
  } catch {
    // Offline or container fallback
  }

  const current = getFeedbackInboxSync();
  const updated = [localItem, ...current];
  setLocalStorage(KEYS.FEEDBACK, updated);
  return localItem;
};

export const updateFeedbackStatus = async (
  id: string,
  status: "new" | "reviewed" | "archived"
): Promise<void> => {
  const current = getFeedbackInboxSync();
  const index = current.findIndex((f) => f.id === id);
  if (index !== -1) {
    current[index].status = status;
    setLocalStorage(KEYS.FEEDBACK, [...current]);
  }

  try {
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch {
    // Ignore offline error
  }
};

export const deleteFeedbackItem = async (id: string): Promise<void> => {
  const current = getFeedbackInboxSync();
  const filtered = current.filter((f) => f.id !== id);
  setLocalStorage(KEYS.FEEDBACK, filtered);

  try {
    await fetch(`/api/feedback/${id}`, {
      method: "DELETE",
    });
  } catch {
    // Ignore offline error
  }
};

// Administrator Authentication - Verified via server API with client-side fallback for static/preview links
export const verifyAdminLoginAsync = async (emailOrUsername: string, pass: string): Promise<boolean> => {
  const cleanIdentifier = emailOrUsername.trim().toLowerCase();
  const cleanPass = pass.trim();
  const cleanPassLower = cleanPass.toLowerCase();
  
  // Authorized credentials
  const authorizedIdentifiers = [
    "yesiqra@26",
    "yesiqra",
    "iewsnagar1@gmail.com",
    "admin@yespaistory.com",
    "admin@yesindia.org",
    "aanam7734@gmail.com",
    "admin",
  ];

  const customPassword = localStorage.getItem(KEYS.ADMIN_PASSWORD);
  const isPassValid =
    (customPassword && cleanPass === customPassword) ||
    cleanPass === "Pass@2k26" ||
    cleanPassLower === "pass@2k26" ||
    cleanPassLower === "pass@2026" ||
    cleanPassLower === "password123";

  const isLocallyValid =
    authorizedIdentifiers.includes(cleanIdentifier) && isPassValid;

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanIdentifier, username: cleanIdentifier, password: cleanPass }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return true;
      }
    }
  } catch (err) {
    console.warn("Server admin auth check unreachable, checking authorized credentials:", err);
  }

  // Fallback ensures login functions on shared links and static previews
  return isLocallyValid;
};

// Administrator Password Reset - Syncs to server API and client storage
export const resetAdminPasswordAsync = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  const customPassword = localStorage.getItem(KEYS.ADMIN_PASSWORD) || "Pass@2k26";
  const isCurrentMatch =
    currentPassword === customPassword ||
    currentPassword === "Pass@2k26" ||
    currentPassword.toLowerCase() === "pass@2k26";

  if (!isCurrentMatch) {
    // Try server verification before rejecting
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem(KEYS.ADMIN_PASSWORD, newPassword);
        return { success: true, message: data.message || "Password updated successfully!" };
      }
      return { success: false, message: data.message || "Current password is incorrect." };
    } catch (err) {
      return { success: false, message: "Current password does not match our records." };
    }
  }

  if (newPassword.length < 6) {
    return { success: false, message: "New password must be at least 6 characters." };
  }

  // Save to client storage
  localStorage.setItem(KEYS.ADMIN_PASSWORD, newPassword);

  // Sync to backend server API
  try {
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || "Password updated successfully!" };
    }
  } catch (err) {
    // Client fallback succeeds
  }

  return { success: true, message: "Administrator password has been reset successfully!" };
};

// Shining Stars Management (Showcases top student authors added manually by admin or bundled in JSON)
export const isDefaultStar = (_s: ShiningStar): boolean => false;

export const getShiningStars = (): ShiningStar[] => {
  const stored = getLocalStorage<ShiningStar[]>(KEYS.SHINING_STARS, DEFAULT_SHINING_STARS);

  const storedIds = new Set(stored.map((s) => s.id));
  const missingBundled = DEFAULT_SHINING_STARS.filter((b) => !storedIds.has(b.id));

  const combined = missingBundled.length > 0 ? [...stored, ...missingBundled] : stored;
  const filtered = combined.filter((s) => s && s.studentName && s.className && s.division);
  if (filtered.length !== stored.length) {
    setLocalStorage(KEYS.SHINING_STARS, filtered);
  }
  return filtered;
};

export const saveShiningStars = (stars: ShiningStar[]): void => {
  setLocalStorage(KEYS.SHINING_STARS, stars);
};

// Server API sync for Shining Stars with resilient bidirectional reconciliation
export const fetchShiningStarsAsync = async (): Promise<ShiningStar[]> => {
  const localStars = getShiningStars();
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STARS, []);

  try {
    const res = await fetch("/api/shining-stars");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.stars)) {
        if (Array.isArray(data.deletedIds)) {
          const mergedDeleted = new Set([...deletedIds, ...data.deletedIds]);
          if (mergedDeleted.size !== deletedIds.length) {
            setLocalStorage(KEYS.DELETED_STARS, Array.from(mergedDeleted));
          }
        }
        const effectiveDeleted = getLocalStorage<string[]>(KEYS.DELETED_STARS, []);

        const serverStars: ShiningStar[] = data.stories ? [] : data.stars.filter(
          (s: ShiningStar) => s && s.studentName && s.className && s.division && !effectiveDeleted.includes(s.id)
        );

        const serverIds = new Set(serverStars.map((s) => s.id));
        const unsyncedLocal = localStars.filter((local) => !serverIds.has(local.id) && !effectiveDeleted.includes(local.id));

        const unifiedStars = [...serverStars, ...unsyncedLocal];
        setLocalStorage(KEYS.SHINING_STARS, unifiedStars);

        if (unsyncedLocal.length > 0) {
          fetch("/api/shining-stars/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientStars: unsyncedLocal }),
          }).catch(() => {});
        }

        return unifiedStars;
      }
    }
  } catch (err) {
    // Offline or static fallback
  }
  return localStars;
};

export const addShiningStar = async (star: Omit<ShiningStar, "id" | "createdAt">): Promise<ShiningStar> => {
  const newStar: ShiningStar = {
    ...star,
    id: `star-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await fetch("/api/shining-stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStar),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.star) {
        const current = getShiningStars();
        const updated = [data.star, ...current.filter((s) => s.id !== data.star.id)];
        saveShiningStars(updated);
        return data.star;
      }
    }
  } catch (err) {
    console.warn("Failed to persist shining star to server API:", err);
  }

  const current = getShiningStars();
  const updated = [newStar, ...current.filter((s) => s.id !== newStar.id)];
  saveShiningStars(updated);
  return newStar;
};

export const updateShiningStar = async (id: string, updatedData: Partial<ShiningStar>): Promise<ShiningStar> => {
  const current = getShiningStars();
  const index = current.findIndex((s) => s.id === id);
  const updated: ShiningStar = index !== -1
    ? { ...current[index], ...updatedData }
    : ({ id, studentName: "", className: "", division: "", createdAt: new Date().toISOString(), ...updatedData } as ShiningStar);

  try {
    const res = await fetch(`/api/shining-stars/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.star) {
        const fresh = current.map((s) => (s.id === id ? data.star : s));
        saveShiningStars(fresh);
        return data.star;
      }
    }
  } catch (err) {
    console.warn("Failed to sync shining star update to server API:", err);
  }

  if (index !== -1) {
    current[index] = updated;
    saveShiningStars(current);
  }
  return updated;
};

export const deleteShiningStar = async (id: string): Promise<void> => {
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STARS, []);
  if (!deletedIds.includes(id)) {
    setLocalStorage(KEYS.DELETED_STARS, [...deletedIds, id]);
  }

  const current = getShiningStars();
  const filtered = current.filter((s) => s.id !== id);
  saveShiningStars(filtered);

  try {
    await fetch(`/api/shining-stars/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("Failed to sync shining star deletion to server API:", err);
  }
};


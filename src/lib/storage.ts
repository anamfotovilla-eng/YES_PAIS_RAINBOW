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
  USER_READ_NOTIFICATIONS: "yespaistory_user_read_notifications",
  USER_DISMISSED_NOTIFICATIONS: "yespaistory_user_dismissed_notifications",
  USER_CLEARED_NOTIFICATIONS_AT: "yespaistory_user_cleared_notifications_at",
  FEEDBACK: "yespaistory_feedback_inbox",
  ADMIN_PASSWORD: "yespaistory_admin_password",
  SHINING_STARS: "yespaistory_shining_stars",
  DELETED_STARS: "yespaistory_deleted_star_ids",
};

// Check if a story has been deleted across exact ID
export const isStoryDeleted = (
  story: { id?: string; slug?: string; title?: string } | null | undefined,
  deletedIds: string[]
): boolean => {
  if (!story || !story.id || !Array.isArray(deletedIds) || deletedIds.length === 0) return false;
  const id = String(story.id).toLowerCase().trim();
  return deletedIds.some((del) => String(del || "").toLowerCase().trim() === id);
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
  const stored = getLocalStorage<Story[]>(KEYS.STORIES, DEFAULT_STORIES);
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);

  const storyList: Story[] = [];
  const seenKeys = new Set<string>();

  const getStoryKey = (s: Story): string => {
    const slug = (s.slug || "").trim().toLowerCase();
    const title = (s.title || "").trim().toLowerCase();
    return slug || title || s.id;
  };

  // Bundled DEFAULT_STORIES (from data/stories.json) are authoritative
  if (Array.isArray(DEFAULT_STORIES)) {
    for (const s of DEFAULT_STORIES) {
      if (s && s.id && s.title && s.content) {
        const key = getStoryKey(s);
        if (!seenKeys.has(key) && !seenKeys.has(s.id)) {
          seenKeys.add(key);
          seenKeys.add(s.id);
          storyList.push(s);
        }
      }
    }
  }

  // Merge any dynamically created local stories (avoiding duplicates)
  if (Array.isArray(stored)) {
    for (const s of stored) {
      if (s && s.id && s.title && s.content) {
        const key = getStoryKey(s);
        if (!seenKeys.has(key) && !seenKeys.has(s.id)) {
          seenKeys.add(key);
          seenKeys.add(s.id);
          storyList.push(s);
        }
      }
    }
  }

  // Stories currently in data/stories.json (DEFAULT_STORIES) are explicitly kept active and never auto-deleted
  const filtered = storyList.filter((s) => {
    if (DEFAULT_STORIES.some((def) => def.id === s.id || (def.slug && def.slug === s.slug))) {
      return true;
    }
    return !isStoryDeleted(s, deletedIds);
  });

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

// User-Specific Independent Notification Helpers
export const getUserReadNotificationIds = (): string[] => {
  return getLocalStorage<string[]>(KEYS.USER_READ_NOTIFICATIONS, []);
};

export const getUserDismissedNotificationIds = (): string[] => {
  return getLocalStorage<string[]>(KEYS.USER_DISMISSED_NOTIFICATIONS, []);
};

export const getUserClearedNotificationsAt = (): number => {
  return getLocalStorage<number>(KEYS.USER_CLEARED_NOTIFICATIONS_AT, 0);
};

// Raw broadcast notification feed (global shared announcements)
export const getRawNotifications = (): AppNotification[] => {
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);
  const lowerDeletedSet = new Set(deletedIds.map((d) => String(d || "").toLowerCase().trim()));
  const stored = getLocalStorage<AppNotification[]>(KEYS.NOTIFICATIONS, []);

  // Filter out notifications referencing deleted stories
  return stored.filter((n) => {
    if (!n || !n.id) return false;
    const sId = String(n.storyId || "").toLowerCase().trim();
    const sSlug = String(n.storySlug || "").toLowerCase().trim();
    if (sId && (lowerDeletedSet.has(sId) || deletedIds.includes(n.storyId || ""))) return false;
    if (sSlug && (lowerDeletedSet.has(sSlug) || deletedIds.includes(n.storySlug || ""))) return false;
    return true;
  });
};

// Returns notifications tailored strictly to the current user with their own independent read/dismissed state
export const getNotifications = (): AppNotification[] => {
  const raw = getRawNotifications();
  const readIds = new Set(getUserReadNotificationIds());
  const dismissedIds = new Set(getUserDismissedNotificationIds());
  const clearedAt = getUserClearedNotificationsAt();

  return raw
    .filter((n) => {
      if (!n || !n.id) return false;
      if (dismissedIds.has(n.id)) return false;
      if (clearedAt && new Date(n.createdAt).getTime() <= clearedAt) return false;
      return true;
    })
    .map((n) => ({
      ...n,
      // Read status is private to THIS user only
      isRead: readIds.has(n.id),
    }));
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
  const rawFeed = getRawNotifications();
  // Check if a notification already exists for this story (prevent duplicates)
  if (storyId || storySlug) {
    const existing = rawFeed.find(
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
  rawFeed.unshift(newNotif);
  // Keep last 50 notifications to optimize storage
  if (rawFeed.length > 50) {
    rawFeed.pop();
  }
  saveNotifications(rawFeed);

  // Sync to server API
  fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, message, storyId, storySlug }),
  }).catch(() => {});

  return newNotif;
};

// Server API sync for notifications:
// Fetches the global broadcast feed from server, updates local feed, and returns THIS user's personalized notifications
export const fetchNotificationsAsync = async (): Promise<AppNotification[]> => {
  try {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      if (data.notifications && Array.isArray(data.notifications)) {
        setLocalStorage(KEYS.NOTIFICATIONS, data.notifications);
      }
    }
  } catch (err) {
    // Graceful fallback to client storage
  }
  return getNotifications();
};

// Marks a notification as read ONLY for this particular user
export const markNotificationReadAsync = async (id: string): Promise<void> => {
  if (!id) return;
  const readIds = getUserReadNotificationIds();
  if (!readIds.includes(id)) {
    readIds.push(id);
    setLocalStorage(KEYS.USER_READ_NOTIFICATIONS, readIds);
  }
  try {
    window.dispatchEvent(new Event("yespaistory_user_notifications_changed"));
  } catch {}
  try {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  } catch {}
};

// Marks all notifications as read ONLY for this particular user
export const markAllNotificationsReadAsync = async (): Promise<void> => {
  const current = getNotifications();
  const readIds = new Set(getUserReadNotificationIds());
  for (const n of current) {
    if (n && n.id) {
      readIds.add(n.id);
    }
  }
  setLocalStorage(KEYS.USER_READ_NOTIFICATIONS, Array.from(readIds));
  try {
    window.dispatchEvent(new Event("yespaistory_user_notifications_changed"));
  } catch {}
  try {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
  } catch {}
};

// Clears notifications ONLY for this particular user without affecting other users
export const clearAllNotificationsAsync = async (): Promise<void> => {
  const current = getNotifications();
  const dismissedIds = new Set(getUserDismissedNotificationIds());
  for (const n of current) {
    if (n && n.id) {
      dismissedIds.add(n.id);
    }
  }
  setLocalStorage(KEYS.USER_DISMISSED_NOTIFICATIONS, Array.from(dismissedIds));
  setLocalStorage(KEYS.USER_CLEARED_NOTIFICATIONS_AT, Date.now());
  try {
    window.dispatchEvent(new Event("yespaistory_user_notifications_changed"));
  } catch {}
  try {
    await fetch("/api/notifications", { method: "DELETE" });
  } catch {}
};

// Server API sync for stories - server is authoritative source of truth with bidirectional resilience
export const fetchStoriesAsync = async (): Promise<Story[]> => {
  const localStories = getStories();
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);
  const deletedSet = new Set(deletedIds.map((d) => String(d).toLowerCase().trim()));

  try {
    const res = await fetch("/api/stories");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.stories)) {
        if (Array.isArray(data.deletedIds)) {
          for (const d of data.deletedIds) {
            deletedSet.add(String(d).toLowerCase().trim());
          }
        }

        // Un-blacklist any active stories explicitly returned by the server
        for (const s of data.stories) {
          if (s) {
            if (s.id) deletedSet.delete(String(s.id).toLowerCase().trim());
            if (s.slug) deletedSet.delete(String(s.slug).toLowerCase().trim());
            if (s.title) deletedSet.delete(String(s.title).toLowerCase().trim());
          }
        }
        setLocalStorage(KEYS.DELETED_STORIES, Array.from(deletedSet));

        const serverStories: Story[] = data.stories.filter(
          (s: Story) => s && s.title && s.content
        );

        const isAdmin = typeof window !== "undefined" && (
          sessionStorage.getItem("yespaistory_admin_logged") === "true" ||
          localStorage.getItem("yespaistory_admin_logged") === "true"
        );

        // For regular users, the server is the single source of truth
        if (!isAdmin) {
          setLocalStorage(KEYS.STORIES, serverStories);
          return serverStories;
        }

        // For authenticated admin, reconcile any offline-created stories
        const storyMap = new Map<string, Story>();
        const storyKey = (s: Story): string => (s.slug || "").trim().toLowerCase() || (s.title || "").trim().toLowerCase() || s.id;

        for (const s of serverStories) {
          storyMap.set(storyKey(s), s);
        }

        const unSyncedStories: Story[] = [];
        for (const local of localStories) {
          if (!local || !local.title || !local.content) continue;
          if (
            deletedSet.has(String(local.id).toLowerCase().trim()) ||
            deletedSet.has(String(local.slug || "").toLowerCase().trim())
          ) {
            continue;
          }
          const k = storyKey(local);
          if (!storyMap.has(k)) {
            storyMap.set(k, local);
            unSyncedStories.push(local);
          }
        }

        const mergedStories = Array.from(storyMap.values());
        setLocalStorage(KEYS.STORIES, mergedStories);

        if (unSyncedStories.length > 0) {
          fetch("/api/stories/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientStories: unSyncedStories }),
          }).catch(() => {});
        }

        return mergedStories;
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

  // 3. Remove associated notifications from raw feed
  const notifs = getRawNotifications();
  saveNotifications(notifs);

  // Cross-tab/window notification
  try {
    window.dispatchEvent(new Event("storage"));
  } catch {}

  // 4. Send deletion to server API
  try {
    const query = new URLSearchParams();
    if (storySlug) query.set("slug", storySlug);
    if (storyTitle) query.set("title", storyTitle);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    let res = await fetch(`/api/stories/${encodeURIComponent(id)}${queryString}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, slug: storySlug, title: storyTitle }),
    });

    if (!res.ok) {
      res = await fetch(`/api/stories/${encodeURIComponent(id)}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, slug: storySlug, title: storyTitle }),
      });
    }

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

  // Remove notifications from raw feed
  const notifs = getRawNotifications();
  saveNotifications(notifs);

  // Cross-tab/window notification
  try {
    window.dispatchEvent(new Event("storage"));
  } catch {}

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
    "story-1790012348307", "story-1790003819476", "story-1789285838253",
    "story-1790329819860"
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
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STARS, []);
  const deletedSet = new Set(deletedIds.map((d) => String(d).toLowerCase().trim()));

  const starMap = new Map<string, ShiningStar>();
  const starKey = (s: ShiningStar) =>
    `${(s.studentName || "").toLowerCase().trim()}|${(s.className || "").toLowerCase().trim()}|${(s.division || "").toLowerCase().trim()}`;

  // 1. Add bundled DEFAULT_SHINING_STARS first
  if (Array.isArray(DEFAULT_SHINING_STARS)) {
    for (const s of DEFAULT_SHINING_STARS) {
      if (s && s.id && s.studentName && s.className && s.division) {
        if (!deletedSet.has(String(s.id).toLowerCase().trim()) && !deletedSet.has(starKey(s))) {
          starMap.set(starKey(s), s);
        }
      }
    }
  }

  // 2. Merge stored stars from localStorage
  if (Array.isArray(stored)) {
    for (const s of stored) {
      if (s && s.id && s.studentName && s.className && s.division) {
        if (!deletedSet.has(String(s.id).toLowerCase().trim()) && !deletedSet.has(starKey(s))) {
          starMap.set(starKey(s), s);
        }
      }
    }
  }

  const result = Array.from(starMap.values());
  if (result.length !== stored.length) {
    setLocalStorage(KEYS.SHINING_STARS, result);
  }
  return result;
};

export const saveShiningStars = (stars: ShiningStar[]): void => {
  setLocalStorage(KEYS.SHINING_STARS, stars);
};

// Server API sync for Shining Stars - bidirectional auto-persistence
export const fetchShiningStarsAsync = async (): Promise<ShiningStar[]> => {
  const localStars = getShiningStars();
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STARS, []);
  const deletedSet = new Set(deletedIds.map((d) => String(d).toLowerCase().trim()));

  try {
    const res = await fetch("/api/shining-stars");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.stars)) {
        if (Array.isArray(data.deletedIds)) {
          for (const d of data.deletedIds) {
            deletedSet.add(String(d).toLowerCase().trim());
          }
        }

        const starKey = (s: ShiningStar) =>
          `${(s.studentName || "").toLowerCase().trim()}|${(s.className || "").toLowerCase().trim()}|${(s.division || "").toLowerCase().trim()}`;

        // CRITICAL: Un-blacklist any active stars explicitly returned by the server
        for (const s of data.stars) {
          if (s) {
            if (s.id) deletedSet.delete(String(s.id).toLowerCase().trim());
            deletedSet.delete(starKey(s));
          }
        }
        setLocalStorage(KEYS.DELETED_STARS, Array.from(deletedSet));

        // All valid stars returned by the server are active
        const serverStars: ShiningStar[] = data.stars.filter(
          (s: ShiningStar) => s && s.studentName && s.className && s.division
        );

        const isAdmin = typeof window !== "undefined" && (
          sessionStorage.getItem("yespaistory_admin_logged") === "true" ||
          localStorage.getItem("yespaistory_admin_logged") === "true"
        );

        // For regular users, the server is the single source of truth
        if (!isAdmin) {
          setLocalStorage(KEYS.SHINING_STARS, serverStars);
          return serverStars;
        }

        // For authenticated admin, reconcile any offline-created stars
        const starMap = new Map<string, ShiningStar>();
        for (const s of serverStars) {
          starMap.set(starKey(s), s);
        }

        const unSyncedStars: ShiningStar[] = [];
        for (const local of localStars) {
          if (!local || !local.studentName || deletedSet.has(String(local.id).toLowerCase().trim()) || deletedSet.has(starKey(local))) {
            continue;
          }
          const k = starKey(local);
          if (!starMap.has(k)) {
            starMap.set(k, local);
            unSyncedStars.push(local);
          }
        }

        const mergedStars = Array.from(starMap.values());
        setLocalStorage(KEYS.SHINING_STARS, mergedStars);

        if (unSyncedStars.length > 0) {
          fetch("/api/shining-stars/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientStars: unSyncedStars }),
          }).catch(() => {});
        }

        return mergedStars;
      }
    }
  } catch (err) {
    // Offline or static fallback
  }

  const starKey = (s: ShiningStar) =>
    `${(s.studentName || "").toLowerCase().trim()}|${(s.className || "").toLowerCase().trim()}|${(s.division || "").toLowerCase().trim()}`;
  return localStars.filter((s) => !deletedSet.has(String(s.id).toLowerCase().trim()) && !deletedSet.has(starKey(s)));
};

export const addShiningStar = async (star: Omit<ShiningStar, "id" | "createdAt">): Promise<ShiningStar> => {
  const newStar: ShiningStar = {
    ...star,
    id: `star-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  // If deliberately re-adding a student that was previously deleted, remove from deleted IDs
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STARS, []);
  const starSig = `${newStar.studentName.toLowerCase().trim()}|${newStar.className.toLowerCase().trim()}|${newStar.division.toLowerCase().trim()}`;
  const cleanedDeleted = deletedIds.filter((d) => d !== newStar.id && d.toLowerCase() !== starSig);
  if (cleanedDeleted.length !== deletedIds.length) {
    setLocalStorage(KEYS.DELETED_STARS, cleanedDeleted);
  }

  // 1. Save to local storage immediately so it is never lost
  const current = getShiningStars();
  const updated = [newStar, ...current.filter((s) => s.id !== newStar.id && starSig !== `${s.studentName.toLowerCase().trim()}|${s.className.toLowerCase().trim()}|${s.division.toLowerCase().trim()}`)];
  saveShiningStars(updated);

  try {
    window.dispatchEvent(new Event("storage"));
  } catch {}

  // 2. Persist to server API
  try {
    const res = await fetch("/api/shining-stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStar),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.star) {
        const fresh = getShiningStars();
        const freshUpdated = [data.star, ...fresh.filter((s) => s.id !== data.star.id && s.id !== newStar.id)];
        saveShiningStars(freshUpdated);
        return data.star;
      }
    }
  } catch (err) {
    console.warn("Failed to persist shining star to server API, cached locally:", err);
  }

  return newStar;
};

export const updateShiningStar = async (id: string, updatedData: Partial<ShiningStar>): Promise<ShiningStar> => {
  const current = getShiningStars();
  const index = current.findIndex((s) => s.id === id);
  const updated: ShiningStar = index !== -1
    ? { ...current[index], ...updatedData }
    : ({ id, studentName: "", className: "", division: "", createdAt: new Date().toISOString(), ...updatedData } as ShiningStar);

  // Update localStorage immediately
  const fresh = current.map((s) => (s.id === id ? updated : s));
  saveShiningStars(fresh);

  try {
    window.dispatchEvent(new Event("storage"));
  } catch {}

  try {
    const res = await fetch(`/api/shining-stars/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.star) {
        const serverFresh = getShiningStars().map((s) => (s.id === id ? data.star : s));
        saveShiningStars(serverFresh);
        return data.star;
      }
    }
  } catch (err) {
    console.warn("Failed to sync shining star update to server API:", err);
  }

  return updated;
};

export const deleteShiningStar = async (id: string): Promise<void> => {
  const current = getShiningStars();
  const targetStar = current.find((s) => s.id === id);

  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STARS, []);
  const toAdd = [id];
  if (targetStar) {
    toAdd.push(`${targetStar.studentName.toLowerCase().trim()}|${targetStar.className.toLowerCase().trim()}|${targetStar.division.toLowerCase().trim()}`);
  }
  const mergedDeleted = Array.from(new Set([...deletedIds, ...toAdd]));
  setLocalStorage(KEYS.DELETED_STARS, mergedDeleted);

  const filtered = current.filter((s) => s.id !== id);
  saveShiningStars(filtered);

  try {
    window.dispatchEvent(new Event("storage"));
  } catch {}

  try {
    let res = await fetch(`/api/shining-stars/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      await fetch(`/api/shining-stars/${encodeURIComponent(id)}/delete`, {
        method: "POST",
      });
    }
  } catch (err) {
    console.warn("Failed to sync shining star deletion to server API:", err);
  }
};


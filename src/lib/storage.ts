import { Grade, Module, Story, AboutUsContent, ContactUsContent, AppNotification, FeedbackItem } from "../types";
import { DEFAULT_GRADES, DEFAULT_MODULES, DEFAULT_STORIES, DEFAULT_ABOUT, DEFAULT_CONTACT } from "../sampleData";

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
};

// Helpers
const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
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
  localStorage.setItem(key, JSON.stringify(value));
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
  const current = getLocalStorage<Story[]>(KEYS.STORIES, DEFAULT_STORIES);
  const filtered = current.filter((s) => !deletedIds.includes(s.id));
  if (filtered.length !== current.length) {
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
  return newNotif;
};

// Server API sync for stories
export const fetchStoriesAsync = async (): Promise<Story[]> => {
  try {
    const res = await fetch("/api/stories");
    if (res.ok) {
      const data = await res.json();
      if (data.stories && Array.isArray(data.stories)) {
        setLocalStorage(KEYS.STORIES, data.stories);
        return data.stories;
      }
    }
  } catch (err) {
    // Graceful fallback to client storage
  }
  return getStories();
};

// Story Helpers
export const addStory = (story: Omit<Story, "id" | "createdAt">): Story => {
  const stories = getStories();
  const newStory: Story = {
    ...story,
    id: `story-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  stories.unshift(newStory);
  saveStories(stories);

  // Automatically sync to backend server disk
  fetch("/api/stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newStory),
  }).catch((err) => console.warn("Failed to persist new story to server API:", err));

  // Automatically create notification for the newly added story
  if (newStory.isPublished) {
    addNotification(
      "New Story Added! 📚",
      `"${newStory.title}" is now available in the library!`,
      newStory.id,
      newStory.slug
    );
  }

  return newStory;
};

export const updateStory = (id: string, updatedData: Partial<Story>): Story => {
  const stories = getStories();
  const index = stories.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Story not found");
  
  const oldStory = stories[index];
  const updatedStory = { ...oldStory, ...updatedData };
  stories[index] = updatedStory;
  saveStories(stories);

  // Automatically sync update to backend server disk
  fetch(`/api/stories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedStory),
  }).catch((err) => console.warn("Failed to persist updated story to server API:", err));

  // If story was NOT published but is NOW published, trigger notification
  if (!oldStory.isPublished && updatedStory.isPublished) {
    addNotification(
      "New Story Published! 📚",
      `"${updatedStory.title}" is now available in the library!`,
      updatedStory.id,
      updatedStory.slug
    );
  }

  return updatedStory;
};

export const deleteStory = (id: string): void => {
  const deletedIds = getLocalStorage<string[]>(KEYS.DELETED_STORIES, []);
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
    setLocalStorage(KEYS.DELETED_STORIES, deletedIds);
  }
  const current = getLocalStorage<Story[]>(KEYS.STORIES, DEFAULT_STORIES);
  const filtered = current.filter((s) => s.id !== id && !deletedIds.includes(s.id));
  saveStories(filtered);

  // Automatically sync deletion to backend server disk
  fetch(`/api/stories/${id}`, {
    method: "DELETE",
  }).catch((err) => console.warn("Failed to sync deletion to server API:", err));
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


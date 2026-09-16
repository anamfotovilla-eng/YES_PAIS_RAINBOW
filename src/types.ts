export interface Grade {
  id: string;
  name: string;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
}

export interface Story {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  gradeId: string; // e.g., "grade-1"
  moduleId: string; // e.g., "nature-and-wildlife"
  imageUrl: string;
  keywords: string[];
  isPublished: boolean;
  createdAt: string;
  studentName?: string;
}

export interface AboutUsContent {
  title: string;
  content: string;
  mission: string;
  vision: string;
}

export interface ContactUsContent {
  title: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  storyId?: string;
  storySlug?: string;
  createdAt: string;
  isRead: boolean;
}

export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "new" | "reviewed" | "archived";
}


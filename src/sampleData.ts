import { Grade, Module, Story, AboutUsContent, ContactUsContent } from "./types";

export const DEFAULT_GRADES: Grade[] = [
  { id: "grade-1", name: "Grade 1" },
  { id: "grade-2", name: "Grade 2" },
  { id: "grade-3", name: "Grade 3" },
  { id: "grade-4", name: "Grade 4" },
  { id: "grade-5", name: "Grade 5" },
  { id: "grade-6", name: "Grade 6" },
  { id: "grade-7", name: "Grade 7" },
  { id: "grade-8", name: "Grade 8" },
  { id: "grade-9", name: "Grade 9" },
  { id: "grade-10", name: "Grade 10" },
];

export const DEFAULT_MODULES: Module[] = [
  { id: "mod-nature", name: "Nature & Wildlife", description: "Discover the wonders of the forest, oceans, and animal kingdom." },
  { id: "mod-morals", name: "Moral & Values", description: "Heartwarming stories teaching kindness, honesty, and friendship." },
  { id: "mod-science", name: "Science & Space", description: "Tales that spark curiosity about stars, physics, and the universe." },
  { id: "mod-adventure", name: "Adventure & Legends", description: "Epic journeys and clever heroes solving grand mysteries." },
];

// Clean initial state: only stories created manually via Admin Portal are displayed
export const DEFAULT_STORIES: Story[] = [];

export const DEFAULT_ABOUT: AboutUsContent = {
  title: "About Yespaistory Hub",
  content: "Welcome to Yespaistory Hub, a welcoming educational digital library created to celebrate the stories written by our students from Grade 1 to Grade 10. Our platform bridges the gap between imagination and learning by providing a vibrant space where young authors can proudly share their ideas, creativity, and unique voices with the world.",
  mission: "Our mission is to create a welcoming space where students can turn their imagination into stories and their ideas into something they can proudly share with the world.\n\nThrough Story Hub, we aim to encourage creativity, build confidence in young writers, celebrate every unique voice, and inspire students to read, write, and dream bigger.\n\nWe don’t just collect stories — we help young storytellers find their voice.",
  vision: "We envision a space where every young mind has the freedom to imagine, create, and be heard.\n\nStory Hub is created to celebrate the stories written by our students — giving their ideas, creativity, and unique voices a place to shine. Through storytelling, we hope to nurture confident young writers, curious thinkers, and imaginative creators who know that their stories are worth telling."
};

export const DEFAULT_CONTACT: ContactUsContent = {
  title: "Get in Touch with Us",
  description: "Have questions about our stories, curriculum inquiries, or want to contribute? We'd love to connect with students, educators, and parents.",
  email: "iewsnagar1@gmail.com",
  phone: "9130185901, 0241-2357136",
  address: "Iqra campus, Govindpura, Ahmednagar-Maharashtra",
  hours: "Monday - Saturday: 8:00 AM - 5:00 PM IST"
};

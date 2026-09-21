import React, { useState, useEffect } from "react";
import { Story, Grade, Module, AboutUsContent, ContactUsContent, FeedbackItem, ShiningStar } from "../types";
import {
  getStories,
  fetchStoriesAsync,
  getGrades,
  getModules,
  getAboutContent,
  getContactContent,
  saveStories,
  saveModules,
  saveAboutContent,
  saveContactContent,
  addStory,
  updateStory,
  deleteStory,
  addModule,
  updateModule,
  deleteModule,
  getFeedbackInbox,
  updateFeedbackStatus,
  deleteFeedbackItem,
  resetAdminPasswordAsync,
  getShiningStars,
  fetchShiningStarsAsync,
  addShiningStar,
  updateShiningStar,
  deleteShiningStar,
} from "../lib/storage";
import {
  BookOpen,
  FolderOpen,
  Layers,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  Globe,
  LogOut,
  Sparkles,
  Info,
  Check,
  Search,
  Lock,
  ShieldCheck,
  Inbox,
  MessageSquare,
  Clock,
  Mail,
  UserCheck,
  Archive,
  Eye,
  EyeOff,
  RefreshCw,
  UploadCloud,
  Image as ImageIcon,
  KeyRound,
  Star,
  Award,
  UserPlus,
} from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

const DEFAULT_STORY_IMAGE = "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop";

export default function AdminDashboard({ onLogout, onNavigateHome }: AdminDashboardProps) {
  // State from storage
  const [stories, setStories] = useState<Story[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [about, setAbout] = useState<AboutUsContent | null>(null);
  const [contact, setContact] = useState<ContactUsContent | null>(null);
  const [shiningStars, setShiningStars] = useState<ShiningStar[]>([]);

  // Active Admin View Tab
  const [activeTab, setActiveTab] = useState<"stories" | "modules" | "pages" | "feedback" | "stars">("stories");

  // Shining Stars Management State
  const [editingStar, setEditingStar] = useState<ShiningStar | null>(null);
  const [isCreatingStar, setIsCreatingStar] = useState(false);
  const [starToDelete, setStarToDelete] = useState<ShiningStar | null>(null);
  const [starSearch, setStarSearch] = useState("");
  const [starForm, setStarForm] = useState({
    studentName: "",
    className: "Grade 1",
    division: "A",
  });

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Search and Class filter inside admin panel
  const [adminSearch, setAdminSearch] = useState("");
  const [selectedAdminGradeId, setSelectedAdminGradeId] = useState<string>("all");

  // Feedback State
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "new" | "reviewed" | "archived">("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Create/Edit Story Form State
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [storyForm, setStoryForm] = useState({
    title: "",
    studentName: "",
    description: "",
    content: "",
    gradeId: "grade-1",
    moduleId: "mod-nature",
    imageUrl: "",
    keywordsRaw: "",
    isPublished: true,
  });

  // Image Upload State (Drag & Drop, Native Picker, Preview)
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Create/Edit Module Form State
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    name: "",
    description: "",
  });

  // Reset Password Modal State
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPasswordError("");

    const currentPass = currentPasswordInput.trim();
    const newPass = newPasswordInput.trim();
    const confirmPass = confirmPasswordInput.trim();

    if (!currentPass || !newPass) {
      setResetPasswordError("Please enter both your current and new password.");
      return;
    }

    if (newPass.length < 6) {
      setResetPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPass !== confirmPass) {
      setResetPasswordError("New password and confirmation password do not match.");
      return;
    }

    setResetPasswordLoading(true);
    try {
      const result = await resetAdminPasswordAsync(currentPass, newPass);
      if (result.success) {
        triggerToast("Administrator password reset successfully!");
        setShowResetPasswordModal(false);
        setCurrentPasswordInput("");
        setNewPasswordInput("");
        setConfirmPasswordInput("");
      } else {
        setResetPasswordError(result.message || "Failed to reset password.");
      }
    } catch {
      setResetPasswordError("An error occurred while resetting password.");
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Load database on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStories(getStories());
    setGrades(getGrades());
    setModules(getModules());
    setAbout(getAboutContent());
    setContact(getContactContent());
    setShiningStars(getShiningStars());
    loadFeedback();
    fetchStoriesAsync().then((fresh) => {
      if (fresh) setStories(fresh);
    });
    fetchShiningStarsAsync().then((fresh) => {
      if (fresh) setShiningStars(fresh);
    });
  };

  // --- SHINING STARS ACTIONS ---
  const handleOpenCreateStar = () => {
    setIsCreatingStar(true);
    setEditingStar(null);
    setStarForm({
      studentName: "",
      className: grades[0]?.name || "Grade 1",
      division: "A",
    });
  };

  const handleOpenEditStar = (star: ShiningStar) => {
    setEditingStar(star);
    setIsCreatingStar(false);
    setStarForm({
      studentName: star.studentName,
      className: star.className,
      division: star.division,
    });
  };

  const handleSaveStar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!starForm.studentName.trim() || !starForm.className.trim() || !starForm.division.trim()) {
      triggerToast("Student Name, Class, and Division are required.", "error");
      return;
    }

    try {
      if (editingStar) {
        await updateShiningStar(editingStar.id, {
          studentName: starForm.studentName.trim(),
          className: starForm.className.trim(),
          division: starForm.division.trim(),
        });
        triggerToast("Shining Star updated successfully!");
      } else {
        await addShiningStar({
          studentName: starForm.studentName.trim(),
          className: starForm.className.trim(),
          division: starForm.division.trim(),
        });
        triggerToast("Shining Star added successfully!");
      }
      setIsCreatingStar(false);
      setEditingStar(null);
      refreshData();
    } catch {
      triggerToast("Failed to save Shining Star.", "error");
    }
  };

  const handleDeleteStar = (id: string) => {
    const target = shiningStars.find((s) => s.id === id);
    if (target) {
      setStarToDelete(target);
    }
  };

  const handleConfirmDeleteStar = async () => {
    if (!starToDelete) return;
    const targetName = starToDelete.studentName;
    await deleteShiningStar(starToDelete.id);
    setStarToDelete(null);
    triggerToast(`"${targetName}" removed from Shining Stars.`);
    refreshData();
  };

  const handleCancelDeleteStar = () => {
    setStarToDelete(null);
  };


  const loadFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const items = await getFeedbackInbox();
      setFeedbackList(items);
    } catch {
      // Fallback
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleStatusChange = async (id: string, status: "new" | "reviewed" | "archived") => {
    await updateFeedbackStatus(id, status);
    setFeedbackList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    if (selectedFeedback && selectedFeedback.id === id) {
      setSelectedFeedback((prev) => (prev ? { ...prev, status } : null));
    }
    triggerToast(`Feedback marked as ${status}`);
  };

  const handleDeleteFeedback = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this feedback item?")) {
      await deleteFeedbackItem(id);
      setFeedbackList((prev) => prev.filter((item) => item.id !== id));
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null);
      }
      triggerToast("Feedback item removed from portal inbox.");
    }
  };

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- IMAGE UPLOAD HELPERS (Drag & Drop, Native Picker from Laptop/Phone, Preview) ---
  const processImageFile = (file: File) => {
    // Validate common formats: JPG, PNG, WEBP
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const isSupportedExtension = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!validMimes.includes(file.type.toLowerCase()) && !isSupportedExtension) {
      triggerToast("Unsupported format. Please upload a JPG, PNG, or WEBP image.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // Optimize image dimensions with canvas to ensure crisp rendering without overwhelming local storage
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_DIM = 1200;
          let { width, height } = img;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            let optimizedUrl = "";
            try {
              optimizedUrl = canvas.toDataURL("image/webp", 0.88);
            } catch {
              optimizedUrl = canvas.toDataURL("image/jpeg", 0.88);
            }
            setStoryForm((prev) => ({ ...prev, imageUrl: optimizedUrl }));
            setUploadedFileName(file.name);
            triggerToast("Image selected! Preview updated.");
            return;
          }
        } catch {
          // Fallback if canvas has any issue
        }

        setStoryForm((prev) => ({ ...prev, imageUrl: rawDataUrl }));
        setUploadedFileName(file.name);
        triggerToast("Image selected! Preview updated.");
      };
      img.onerror = () => {
        setStoryForm((prev) => ({ ...prev, imageUrl: rawDataUrl }));
        setUploadedFileName(file.name);
        triggerToast("Image selected! Preview updated.");
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      triggerToast("Could not read image file. Please try another.", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    setStoryForm((prev) => ({ ...prev, imageUrl: "" }));
    setUploadedFileName(null);
  };

  // --- STORY ACTIONS ---
  const handleOpenEditStory = (story: Story) => {
    setEditingStory(story);
    setIsCreatingStory(false);
    setUploadedFileName(null);
    setStoryForm({
      title: story.title,
      studentName: story.studentName || "",
      description: story.description,
      content: story.content,
      gradeId: story.gradeId,
      moduleId: story.moduleId,
      imageUrl: story.imageUrl || "",
      keywordsRaw: story.keywords ? story.keywords.join(", ") : "",
      isPublished: story.isPublished,
    });
  };

  const handleOpenCreateStory = (targetGradeId?: string) => {
    setIsCreatingStory(true);
    setEditingStory(null);
    setUploadedFileName(null);
    const defaultGrade =
      targetGradeId && targetGradeId !== "all"
        ? targetGradeId
        : selectedAdminGradeId !== "all"
        ? selectedAdminGradeId
        : grades[0]?.id || "grade-1";
    setStoryForm({
      title: "",
      studentName: "",
      description: "",
      content: "",
      gradeId: defaultGrade,
      moduleId: modules[0]?.id || "mod-nature",
      imageUrl: "",
      keywordsRaw: "",
      isPublished: true,
    });
  };

  const handleSaveStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyForm.title.trim() || !storyForm.content.trim()) {
      triggerToast("Story Title and Full Content are required", "error");
      return;
    }

    const keywords = storyForm.keywordsRaw
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    const slug = storyForm.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const finalImageUrl = storyForm.imageUrl.trim() || DEFAULT_STORY_IMAGE;

    const storyPayload = {
      title: storyForm.title,
      studentName: storyForm.studentName,
      slug,
      description: storyForm.description,
      content: storyForm.content,
      gradeId: storyForm.gradeId,
      moduleId: storyForm.moduleId,
      imageUrl: finalImageUrl,
      keywords,
      isPublished: storyForm.isPublished,
    };

    try {
      if (editingStory) {
        updateStory(editingStory.id, storyPayload);
        triggerToast("Story updated successfully!");
      } else {
        addStory(storyPayload);
        triggerToast("Story created successfully!");
      }
      setIsCreatingStory(false);
      setEditingStory(null);
      refreshData();
    } catch (err) {
      triggerToast("Failed to save story.", "error");
    }
  };

  const handleDeleteStory = (id: string) => {
    const target = stories.find((s) => s.id === id);
    if (target) {
      setStoryToDelete(target);
    } else {
      deleteStory(id);
      triggerToast("Story deleted.");
      refreshData();
    }
  };

  const handleConfirmDeleteStory = () => {
    if (!storyToDelete) return;
    const targetId = storyToDelete.id;
    const targetTitle = storyToDelete.title;

    deleteStory(targetId);

    if (editingStory && editingStory.id === targetId) {
      setEditingStory(null);
      setIsCreatingStory(false);
    }

    setStoryToDelete(null);
    triggerToast(`"${targetTitle}" deleted successfully.`);
    refreshData();
  };

  const handleCancelDeleteStory = () => {
    setStoryToDelete(null);
  };

  const handleTogglePublish = (story: Story) => {
    updateStory(story.id, { isPublished: !story.isPublished });
    triggerToast(story.isPublished ? "Story unpublished" : "Story published!");
    refreshData();
  };

  // --- MODULE ACTIONS ---
  const handleOpenEditModule = (mod: Module) => {
    setEditingModule(mod);
    setIsCreatingModule(false);
    setModuleForm({
      name: mod.name,
      description: mod.description || "",
    });
  };

  const handleOpenCreateModule = () => {
    setIsCreatingModule(true);
    setEditingModule(null);
    setModuleForm({
      name: "",
      description: "",
    });
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.name.trim()) {
      triggerToast("Module Name is required", "error");
      return;
    }

    try {
      if (editingModule) {
        updateModule(editingModule.id, moduleForm.name, moduleForm.description);
        triggerToast("Module updated!");
      } else {
        addModule(moduleForm.name, moduleForm.description);
        triggerToast("Module created!");
      }
      setIsCreatingModule(false);
      setEditingModule(null);
      refreshData();
    } catch (err) {
      triggerToast("Failed to save module.", "error");
    }
  };

  const handleDeleteModule = (id: string) => {
    // Check if any stories use this module
    const associated = stories.filter((s) => s.moduleId === id);
    if (associated.length > 0) {
      triggerToast(
        `Cannot delete. ${associated.length} story/stories belong to this module. Reassign them first!`,
        "error"
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this module?")) {
      deleteModule(id);
      triggerToast("Module deleted.");
      refreshData();
    }
  };

  // --- PAGES ACTIONS (ABOUT & CONTACT) ---
  const handleSaveAbout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!about) return;
    saveAboutContent(about);
    triggerToast("About Us content saved successfully!");
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    saveContactContent(contact);
    triggerToast("Contact Us content saved successfully!");
  };

  // Filtered stories in list based on class and search
  const filteredStories = stories.filter((s) => {
    if (selectedAdminGradeId !== "all" && s.gradeId !== selectedAdminGradeId) {
      return false;
    }
    const query = adminSearch.toLowerCase().trim();
    if (!query) return true;
    const titleMatch = s.title.toLowerCase().includes(query);
    const descMatch = s.description.toLowerCase().includes(query);
    const studentMatch = (s.studentName || "").toLowerCase().includes(query);
    return titleMatch || descMatch || studentMatch;
  });

  return (
    <div id="admin-dashboard" className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn text-natural-text">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 ${
            toast.type === "success"
              ? "bg-natural-light border-natural-border text-natural-heading"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-natural-primary" /> : <XCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-natural-border pb-6 mb-8 gap-4">
        <div>
          <span className="bg-natural-light border border-natural-border text-natural-primary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Control Panel
          </span>
          <h1 className="text-3xl font-bold font-serif text-natural-heading mt-2 tracking-tight flex items-center gap-2">
            Administrator Dashboard
          </h1>
          <p className="text-natural-muted text-sm mt-1">
            Create modules, manage educational stories, assign grades, and update portal pages.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setShowResetPasswordModal(true);
              setResetPasswordError("");
              setCurrentPasswordInput("");
              setNewPasswordInput("");
              setConfirmPasswordInput("");
            }}
            id="admin-reset-password-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            title="Reset administrator password"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>Reset Password</span>
          </button>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 bg-white hover:bg-natural-light text-natural-heading border border-natural-border font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Go To Portal
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-natural-primary hover:bg-natural-heading text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-sans uppercase tracking-wider text-natural-sand font-bold">Total Stories</p>
            <h3 className="text-3xl font-bold font-serif text-natural-primary mt-1">{stories.length}</h3>
            <p className="text-[10px] text-natural-muted mt-1">
              {stories.filter((s) => s.isPublished).length} published • {stories.filter((s) => !s.isPublished).length}{" "}
              drafts
            </p>
          </div>
          <div className="p-4 bg-natural-light rounded-2xl text-natural-primary">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-sans uppercase tracking-wider text-natural-sand font-bold">Learning Modules</p>
            <h3 className="text-3xl font-bold font-serif text-natural-primary mt-1">{modules.length}</h3>
            <p className="text-[10px] text-natural-muted mt-1">Focus categories built</p>
          </div>
          <div className="p-4 bg-natural-light rounded-2xl text-natural-primary">
            <FolderOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-sans uppercase tracking-wider text-natural-sand font-bold">Active Grades</p>
            <h3 className="text-3xl font-bold font-serif text-natural-primary mt-1">{grades.length}</h3>
            <p className="text-[10px] text-natural-muted mt-1">Grade 1 to Grade 10 navigation</p>
          </div>
          <div className="p-4 bg-natural-light rounded-2xl text-natural-primary">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm flex items-center justify-between bg-gradient-to-br from-amber-50/50 to-white">
          <div>
            <p className="text-xs font-sans uppercase tracking-wider text-amber-800 font-bold">Shining Stars ⭐</p>
            <h3 className="text-3xl font-bold font-serif text-amber-600 mt-1">{shiningStars.length}</h3>
            <p className="text-[10px] text-natural-muted mt-1">Top student storytellers</p>
          </div>
          <div className="p-4 bg-amber-100/80 rounded-2xl text-amber-600">
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
        </div>

        <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-sans uppercase tracking-wider text-natural-sand font-bold">Feedback Inbox</p>
            <h3 className="text-3xl font-bold font-serif text-natural-primary mt-1">{feedbackList.length}</h3>
            <p className="text-[10px] text-natural-muted mt-1">
              {feedbackList.filter((f) => f.status === "new").length} new • {feedbackList.filter((f) => f.status === "reviewed").length} reviewed
            </p>
          </div>
          <div className="p-4 bg-natural-light rounded-2xl text-natural-primary">
            <Inbox className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-natural-border/80 mb-8 overflow-x-auto gap-1">
        <button
          onClick={() => {
            setActiveTab("stories");
            setIsCreatingStory(false);
            setEditingStory(null);
          }}
          className={`px-5 py-3 font-sans font-bold text-sm tracking-tight border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "stories"
              ? "border-natural-primary text-natural-primary font-bold"
              : "border-transparent text-natural-sand hover:text-natural-heading"
          }`}
        >
          Manage Stories
        </button>
        <button
          onClick={() => {
            setActiveTab("stars");
            setIsCreatingStar(false);
            setEditingStar(null);
          }}
          className={`flex items-center gap-2 px-5 py-3 font-sans font-bold text-sm tracking-tight border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "stars"
              ? "border-amber-500 text-amber-700 font-bold"
              : "border-transparent text-natural-sand hover:text-natural-heading"
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Manage Shining Stars ⭐</span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {shiningStars.length}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab("modules");
            setIsCreatingModule(false);
            setEditingModule(null);
          }}
          className={`px-5 py-3 font-sans font-bold text-sm tracking-tight border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "modules"
              ? "border-natural-primary text-natural-primary font-bold"
              : "border-transparent text-natural-sand hover:text-natural-heading"
          }`}
        >
          Manage Modules
        </button>
        <button
          onClick={() => {
            setActiveTab("pages");
          }}
          className={`px-5 py-3 font-sans font-bold text-sm tracking-tight border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "pages"
              ? "border-natural-primary text-natural-primary font-bold"
              : "border-transparent text-natural-sand hover:text-natural-heading"
          }`}
        >
          Manage Portal Pages
        </button>
        <button
          onClick={() => {
            setActiveTab("feedback");
            loadFeedback();
          }}
          className={`flex items-center gap-2 px-5 py-3 font-sans font-bold text-sm tracking-tight border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "feedback"
              ? "border-natural-primary text-natural-primary font-bold"
              : "border-transparent text-natural-sand hover:text-natural-heading"
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Enquiry &amp; Feedback Inbox</span>
          {feedbackList.filter((f) => f.status === "new").length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {feedbackList.filter((f) => f.status === "new").length} New
            </span>
          )}
        </button>
      </div>

      {/* --- TAB 1: STORIES --- */}
      {activeTab === "stories" && (
        <div className="space-y-6">
          {!isCreatingStory && !editingStory ? (
            <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm">
              {/* Class / Grade Filter Bar */}
              <div className="mb-6 pb-6 border-b border-natural-border/70">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-natural-heading flex items-center gap-2 font-sans">
                      <Layers className="w-4 h-4 text-natural-primary" />
                      Manage Stories by Class / Grade Level
                    </h3>
                    <p className="text-xs text-natural-muted mt-0.5">
                      Select a class to manage its stories, or click "Add to Class" to quickly add reading material.
                    </p>
                  </div>
                  {selectedAdminGradeId !== "all" && (
                    <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      Showing: {grades.find((g) => g.id === selectedAdminGradeId)?.name || selectedAdminGradeId}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedAdminGradeId("all")}
                    className={`px-3.5 py-1.5 rounded-xl font-sans font-bold text-xs whitespace-nowrap transition-all border cursor-pointer ${
                      selectedAdminGradeId === "all"
                        ? "bg-[#24285b] text-white border-[#24285b] shadow-xs"
                        : "bg-natural-bg/70 hover:bg-natural-light text-natural-text border-natural-border"
                    }`}
                  >
                    All Classes ({stories.length})
                  </button>
                  {grades.map((grade) => {
                    const gradeStoryCount = stories.filter((s) => s.gradeId === grade.id).length;
                    const isSelected = selectedAdminGradeId === grade.id;
                    return (
                      <button
                        key={grade.id}
                        type="button"
                        onClick={() => setSelectedAdminGradeId(grade.id)}
                        className={`px-3.5 py-1.5 rounded-xl font-sans font-bold text-xs whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#24285b] text-white border-[#24285b] shadow-xs"
                            : "bg-white hover:bg-natural-light text-natural-text border-natural-border"
                        }`}
                      >
                        <span>{grade.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? "bg-white/25 text-white" : "bg-natural-light text-natural-sand"
                          }`}
                        >
                          {gradeStoryCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                {/* Internal table search bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-natural-sand" />
                  <input
                    type="text"
                    placeholder="Search stories by title, student author, snippet..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary text-natural-heading placeholder-natural-sand"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {selectedAdminGradeId !== "all" && (
                    <button
                      onClick={() => handleOpenCreateStory(selectedAdminGradeId)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-sans font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                      title={`Add a new story directly to ${grades.find((g) => g.id === selectedAdminGradeId)?.name}`}
                    >
                      <Plus className="w-4 h-4" />
                      Add to {grades.find((g) => g.id === selectedAdminGradeId)?.name || "Class"}
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenCreateStory()}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-natural-primary hover:bg-natural-heading text-white font-sans font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Story
                  </button>
                </div>
              </div>

              {/* Story list table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-natural-text border-collapse">
                  <thead>
                    <tr className="border-b border-natural-border/80 bg-natural-light/50 text-natural-muted text-xs font-sans font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Story Title &amp; Student</th>
                      <th className="py-3 px-4">Grade / Class</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-natural-border/40">
                    {filteredStories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-natural-sand">
                          {selectedAdminGradeId !== "all" ? (
                            <div>
                              <p className="font-semibold text-natural-heading">
                                No stories found for {grades.find((g) => g.id === selectedAdminGradeId)?.name || "this class"}.
                              </p>
                              <button
                                onClick={() => handleOpenCreateStory(selectedAdminGradeId)}
                                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add First Story for {grades.find((g) => g.id === selectedAdminGradeId)?.name}
                              </button>
                            </div>
                          ) : (
                            "No stories found matching your filter."
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredStories.map((story) => {
                        const storyGrade = grades.find((g) => g.id === story.gradeId);
                        const storyMod = modules.find((m) => m.id === story.moduleId);

                        return (
                          <tr key={story.id} className="hover:bg-natural-light/30 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={story.imageUrl}
                                  alt=""
                                  className="w-12 h-8 object-cover rounded-md border border-natural-border shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <span className="font-sans font-bold text-natural-heading block line-clamp-1">
                                    {story.title}
                                  </span>
                                  {story.studentName && (
                                    <span className="text-[11px] font-medium text-indigo-700 block">
                                      Student: {story.studentName}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-natural-sand line-clamp-1">
                                    {story.description}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 bg-natural-light text-natural-heading text-[11px] font-bold rounded-full border border-natural-border">
                                {storyGrade ? storyGrade.name : story.gradeId}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 bg-natural-bg text-natural-primary text-[11px] font-bold rounded-full border border-natural-border">
                                {storyMod ? storyMod.name : story.moduleId}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleTogglePublish(story)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full cursor-pointer transition-colors border ${
                                  story.isPublished
                                    ? "bg-natural-light text-natural-heading border-natural-border hover:bg-natural-border"
                                    : "bg-[#FCFAF7] text-natural-sand border-natural-border hover:bg-natural-light"
                                }`}
                              >
                                {story.isPublished ? "Published" : "Draft"}
                              </button>
                            </td>
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditStory(story)}
                                  className="p-1.5 bg-natural-bg hover:bg-natural-light text-natural-text hover:text-natural-heading rounded-lg border border-natural-border transition-colors cursor-pointer"
                                  title="Edit Story"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStory(story.id)}
                                  className="p-1.5 bg-[#FCFAF7] hover:bg-rose-50 text-natural-sand hover:text-rose-600 rounded-lg border border-natural-border transition-colors cursor-pointer"
                                  title="Delete Story"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Story Editor Form Panel */
            <div className="bg-white border border-natural-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-6">
                {editingStory ? `Edit Story: "${editingStory.title}"` : "Create A New Story"}
              </h2>

              <form onSubmit={handleSaveStory} className="space-y-6">
                {/* Two columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title & Description */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="story-title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Story Title
                      </label>
                      <input
                        id="story-title"
                        type="text"
                        required
                        value={storyForm.title}
                        onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                        placeholder="e.g. Oliver's Pinecone Collection"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="story-studentName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Student Author Name
                      </label>
                      <input
                        id="story-studentName"
                        type="text"
                        value={storyForm.studentName}
                        onChange={(e) => setStoryForm({ ...storyForm, studentName: e.target.value })}
                        placeholder="e.g. Lucas Thompson"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="story-desc" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Short Snippet Description
                      </label>
                      <textarea
                        id="story-desc"
                        rows={2}
                        value={storyForm.description}
                        onChange={(e) => setStoryForm({ ...storyForm, description: e.target.value })}
                        placeholder="Brief summary shown on story cards to entice child readers..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="story-grade" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Assign Class / Grade Level
                        </label>
                        <select
                          id="story-grade"
                          value={storyForm.gradeId}
                          onChange={(e) => setStoryForm({ ...storyForm, gradeId: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                        >
                          {grades.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} (Class {g.id.replace("grade-", "")})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="story-module" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Assign Module
                        </label>
                        <select
                          id="story-module"
                          value={storyForm.moduleId}
                          onChange={(e) => setStoryForm({ ...storyForm, moduleId: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          {modules.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="story-keywords" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Keywords (Comma separated tags)
                      </label>
                      <input
                        id="story-keywords"
                        type="text"
                        value={storyForm.keywordsRaw}
                        onChange={(e) => setStoryForm({ ...storyForm, keywordsRaw: e.target.value })}
                        placeholder="e.g. sharing, science, bunny, forest"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Thumbnail / Image Selector */}
                  <div className="space-y-4">
                    {/* Image Upload: Drag & Drop, Device File Selection & Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label htmlFor="admin-story-image-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Story Cover Image
                        </label>
                        <span className="text-[11px] font-semibold text-slate-400">
                          JPG, PNG, WEBP
                        </span>
                      </div>

                      {/* Hidden Native File Input (supports desktop file browser & mobile camera/photo library) */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="admin-story-image-input"
                      />

                      {storyForm.imageUrl ? (
                        /* Image Preview Container */
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`relative rounded-2xl border-2 overflow-hidden bg-slate-50 transition-all ${
                            isDraggingImage
                              ? "border-natural-primary ring-4 ring-natural-primary/10"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="relative aspect-video w-full bg-slate-900/5 flex items-center justify-center overflow-hidden">
                            <img
                              src={storyForm.imageUrl}
                              alt="Story cover preview"
                              className="w-full h-full object-cover"
                            />
                            {isDraggingImage && (
                              <div className="absolute inset-0 bg-natural-primary/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                                <UploadCloud className="w-10 h-10 mb-2 animate-bounce" />
                                <p className="font-bold text-sm">Drop new image to replace</p>
                              </div>
                            )}
                          </div>

                          <div className="p-3.5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                Preview Ready
                              </span>
                              {uploadedFileName && (
                                <span className="text-xs text-slate-500 truncate max-w-[140px] sm:max-w-[200px]" title={uploadedFileName}>
                                  {uploadedFileName}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 min-h-[36px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                Change Image
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="px-3 py-1.5 min-h-[36px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Remove Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Drag & Drop or Click to Choose Upload Zone */
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`group relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all ${
                            isDraggingImage
                              ? "border-natural-primary bg-natural-primary/5 ring-4 ring-natural-primary/10"
                              : "border-slate-300 hover:border-natural-primary bg-slate-50/70 hover:bg-white"
                          }`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              fileInputRef.current?.click();
                            }
                          }}
                        >
                          <div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-natural-primary group-hover:scale-105 group-hover:border-natural-primary/30 transition-transform mb-3">
                            <UploadCloud className="w-7 h-7 stroke-[2]" />
                          </div>

                          <h3 className="font-bold text-slate-800 text-sm mb-1">
                            <span className="text-natural-primary hover:underline">Choose an image</span> or drag & drop here
                          </h3>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                            Upload directly from your laptop or phone (photo library, camera, or files)
                          </p>

                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-semibold text-slate-600 shadow-2xs">
                            <ImageIcon className="w-3.5 h-3.5 text-natural-primary" />
                            <span>Supports JPG, PNG, WEBP</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          id="publish-check"
                          type="checkbox"
                          checked={storyForm.isPublished}
                          onChange={(e) => setStoryForm({ ...storyForm, isPublished: e.target.checked })}
                          className="w-4 h-4 text-natural-primary border-natural-border rounded focus:ring-natural-primary"
                        />
                        <label htmlFor="publish-check" className="text-sm font-bold text-natural-heading cursor-pointer">
                          Publish Immediately
                        </label>
                      </div>
                      <p className="text-[11px] text-natural-sand mt-1">
                        If unchecked, this story will be saved as a draft and hidden from the homepage catalog.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content block */}
                <div>
                  <label htmlFor="story-content" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">
                    Full Story Text (Separated by double blank lines for paragraphs)
                  </label>
                  <textarea
                    id="story-content"
                    required
                    rows={10}
                    value={storyForm.content}
                    onChange={(e) => setStoryForm({ ...storyForm, content: e.target.value })}
                    placeholder="Once upon a time..."
                    className="w-full px-4 py-3 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm font-sans leading-relaxed focus:ring-2 focus:ring-natural-primary focus:outline-none placeholder-natural-sand"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-natural-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingStory(false);
                      setEditingStory(null);
                    }}
                    className="px-5 py-2 bg-white hover:bg-natural-light border border-natural-border text-natural-heading font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2 bg-natural-primary hover:bg-natural-heading text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Story
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: MODULES --- */}
      {activeTab === "modules" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module list column */}
          <div className="lg:col-span-2 bg-white border border-natural-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold font-serif text-natural-heading mb-6">Existing Modules</h2>
            <div className="space-y-4">
              {modules.map((mod) => (
                <div
                  key={mod.id}
                  className="p-4 border border-natural-card-border rounded-xl hover:border-natural-border hover:bg-natural-light/20 transition-all flex items-start justify-between gap-4"
                >
                  <div>
                    <span className="px-2 py-0.5 bg-natural-light text-natural-primary text-[10px] font-bold rounded-full uppercase tracking-wider block w-fit mb-1 border border-natural-border">
                      {mod.id}
                    </span>
                    <h3 className="font-bold text-natural-heading text-base">{mod.name}</h3>
                    <p className="text-natural-muted text-xs mt-1 leading-relaxed">{mod.description || "No description provided."}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModule(mod)}
                      className="p-1.5 bg-natural-bg hover:bg-natural-light text-natural-text hover:text-natural-heading rounded-lg border border-natural-border cursor-pointer"
                      title="Edit Module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1.5 bg-[#FCFAF7] hover:bg-rose-50 text-natural-sand hover:text-rose-600 rounded-lg border border-natural-border cursor-pointer"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module creator/editor column */}
          <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm h-fit">
            <h2 className="text-lg font-bold font-serif text-natural-heading mb-4">
              {editingModule ? "Edit Learning Module" : "Create Learning Module"}
            </h2>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label htmlFor="mod-name" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">
                  Module Name
                </label>
                <input
                  id="mod-name"
                  type="text"
                  required
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                  placeholder="e.g. History & Legends"
                  className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                />
              </div>

              <div>
                <label htmlFor="mod-desc" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">
                  Module Description (optional)
                </label>
                <textarea
                  id="mod-desc"
                  rows={3}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  placeholder="Describe the themes or goals of this unit..."
                  className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {editingModule && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingModule(null);
                      setModuleForm({ name: "", description: "" });
                    }}
                    className="flex-1 py-2 bg-white hover:bg-natural-light border border-natural-border text-natural-heading font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-natural-primary hover:bg-natural-heading text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  {editingModule ? "Update Module" : "Create Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 3: PAGES --- */}
      {activeTab === "pages" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* About Us Manager */}
          {about && (
            <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold font-serif text-natural-heading mb-2 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-natural-primary" />
                Manage About Us Content
              </h2>
              <p className="text-natural-sand text-xs mb-6">Update the hero title, introductory text, mission and vision.</p>

              <form onSubmit={handleSaveAbout} className="space-y-4">
                <div>
                  <label htmlFor="about-title" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Page Header Title</label>
                  <input
                    id="about-title"
                    type="text"
                    value={about.title}
                    onChange={(e) => setAbout({ ...about, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  />
                </div>

                <div>
                  <label htmlFor="about-text" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Main History / Body Content</label>
                  <textarea
                    id="about-text"
                    rows={5}
                    value={about.content}
                    onChange={(e) => setAbout({ ...about, content: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="about-mission" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Mission Statement</label>
                  <textarea
                    id="about-mission"
                    rows={2}
                    value={about.mission}
                    onChange={(e) => setAbout({ ...about, mission: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="about-vision" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Vision Statement</label>
                  <textarea
                    id="about-vision"
                    rows={2}
                    value={about.vision}
                    onChange={(e) => setAbout({ ...about, vision: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-natural-primary hover:bg-natural-heading text-white font-sans font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save About Us Page Changes
                </button>
              </form>
            </div>
          )}

          {/* Contact Us Manager */}
          {contact && (
            <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold font-serif text-natural-heading mb-2 flex items-center gap-1.5">
                <Info className="w-5 h-5 text-natural-primary" />
                Manage Contact Us Details
              </h2>
              <p className="text-natural-sand text-xs mb-6">Update contact info that displays in the sidebar blocks.</p>

              <form onSubmit={handleSaveContact} className="space-y-4">
                <div>
                  <label htmlFor="contact-title" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Page Header Title</label>
                  <input
                    id="contact-title"
                    type="text"
                    value={contact.title}
                    onChange={(e) => setContact({ ...contact, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  />
                </div>

                <div>
                  <label htmlFor="contact-desc" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Help Desk Invitation Text</label>
                  <textarea
                    id="contact-desc"
                    rows={2}
                    value={contact.description}
                    onChange={(e) => setContact({ ...contact, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  />
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    id="contact-phone"
                    type="text"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  />
                </div>

                <div>
                  <label htmlFor="contact-address" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Physical HQ Address</label>
                  <input
                    id="contact-address"
                    type="text"
                    value={contact.address}
                    onChange={(e) => setContact({ ...contact, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  />
                </div>

                <div>
                  <label htmlFor="contact-hours" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Office Support Hours</label>
                  <input
                    id="contact-hours"
                    type="text"
                    value={contact.hours}
                    onChange={(e) => setContact({ ...contact, hours: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-natural-heading text-sm focus:ring-2 focus:ring-natural-primary focus:border-transparent focus:outline-none placeholder-natural-sand"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-natural-primary hover:bg-natural-heading text-white font-sans font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save Contact Page Changes
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: ENQUIRY & FEEDBACK INBOX --- */}
      {activeTab === "feedback" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Inbox Header Card */}
          <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-natural-heading flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-natural-primary" />
                  Enquiry &amp; Feedback Inbox
                </h2>
                <p className="text-natural-sand text-xs mt-1">
                  All inquiries, messages, and feedback submitted via the public Contact Us page are captured directly within this portal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadFeedback}
                  disabled={loadingFeedback}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-natural-light hover:bg-natural-border/60 text-natural-primary text-xs font-bold rounded-xl transition-all cursor-pointer border border-natural-border"
                  title="Refresh inbox"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFeedback ? "animate-spin" : ""}`} />
                  Refresh Inbox
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="mt-6 pt-5 border-t border-natural-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(["all", "new", "reviewed", "archived"] as const).map((filter) => {
                  const count =
                    filter === "all"
                      ? feedbackList.length
                      : feedbackList.filter((f) => f.status === filter).length;
                  return (
                    <button
                      key={filter}
                      onClick={() => setFeedbackFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                        feedbackFilter === filter
                          ? "bg-natural-primary text-white shadow-xs"
                          : "bg-natural-light text-natural-muted hover:text-natural-heading"
                      }`}
                    >
                      {filter}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          feedbackFilter === filter
                            ? "bg-white/20 text-white"
                            : "bg-white text-natural-sand border border-natural-border/60"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-natural-sand" />
                <input
                  type="text"
                  placeholder="Search sender, subject, text..."
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-natural-bg/50 border border-natural-border rounded-xl text-xs text-natural-heading placeholder-natural-sand focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Feedback Messages List */}
          {(() => {
            const filteredFeedback = feedbackList.filter((item) => {
              const matchesFilter = feedbackFilter === "all" || item.status === feedbackFilter;
              const matchesSearch =
                item.name.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
                item.email.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
                item.subject.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
                item.message.toLowerCase().includes(feedbackSearch.toLowerCase());
              return matchesFilter && matchesSearch;
            });

            if (filteredFeedback.length === 0) {
              return (
                <div className="bg-white border border-natural-border rounded-2xl p-12 text-center shadow-sm">
                  <div className="w-14 h-14 bg-natural-light text-natural-primary rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-natural-heading text-lg font-serif">No Inquiries or Feedback Found</h3>
                  <p className="text-natural-muted text-xs max-w-sm mx-auto mt-1.5">
                    {feedbackSearch || feedbackFilter !== "all"
                      ? "No records match your selected filter or search query."
                      : "Any feedback submitted through the Contact Us page will be automatically stored and displayed right here in this portal."}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredFeedback.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-6 shadow-sm transition-all hover:border-natural-primary/50 ${
                      item.status === "new" ? "border-emerald-300 ring-1 ring-emerald-100" : "border-natural-border"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      {/* Left: Sender info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-natural-light text-natural-primary flex items-center justify-center font-bold text-sm uppercase">
                          {item.name.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-natural-heading text-sm">{item.name}</h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                item.status === "new"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : item.status === "reviewed"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-natural-sand mt-0.5">
                            <Mail className="w-3 h-3 text-natural-primary" />
                            <a
                              href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject)}`}
                              className="text-natural-primary hover:underline font-semibold"
                            >
                              {item.email}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Right: Date */}
                      <div className="flex items-center gap-1 text-[11px] text-natural-sand font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-natural-sand block">Subject</span>
                      <p className="font-bold text-natural-heading text-sm mt-0.5">{item.subject}</p>
                    </div>

                    {/* Message Body */}
                    <div className="bg-natural-bg/40 rounded-xl p-4 border border-natural-border/60 text-sm text-natural-text leading-relaxed whitespace-pre-wrap mb-4">
                      {item.message}
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-natural-border/60">
                      <div className="flex items-center gap-2">
                        {item.status !== "reviewed" && (
                          <button
                            onClick={() => handleStatusChange(item.id, "reviewed")}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Mark Reviewed
                          </button>
                        )}
                        {item.status !== "new" && (
                          <button
                            onClick={() => handleStatusChange(item.id, "new")}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Mark as New
                          </button>
                        )}
                        {item.status !== "archived" && (
                          <button
                            onClick={() => handleStatusChange(item.id, "archived")}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            Archive
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject)}`}
                          className="px-3 py-1.5 bg-natural-light hover:bg-natural-border/80 text-natural-heading border border-natural-border rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Reply via Mail
                        </a>
                        <button
                          onClick={() => handleDeleteFeedback(item.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* --- TAB 5: SHINING STARS --- */}
      {activeTab === "stars" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Bar: Intro, Search, and Create Button */}
          <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-sm bg-gradient-to-r from-white via-amber-50/20 to-amber-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Homepage Showcase
                </span>
                <h2 className="text-xl font-bold font-serif text-[#322f82] mt-1.5 flex items-center gap-2">
                  <span>Manage Shining Stars</span>
                  <span>⭐</span>
                </h2>
                <p className="text-xs text-natural-muted mt-0.5">
                  Showcase students who have written the best stories. These entries appear in the "Shining Stars" section on the homepage.
                </p>
              </div>

              {!isCreatingStar && !editingStar && (
                <button
                  onClick={handleOpenCreateStar}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-sans font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Shining Star</span>
                </button>
              )}
            </div>

            {/* Form for Creating / Editing Shining Star */}
            {(isCreatingStar || editingStar) && (
              <form onSubmit={handleSaveStar} className="mt-6 pt-6 border-t border-amber-200/70 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#322f82] flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{editingStar ? "Edit Shining Star Details" : "Add New Shining Star"}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingStar(false);
                      setEditingStar(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Student Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zoya Patel"
                      value={starForm.studentName}
                      onChange={(e) => setStarForm({ ...starForm, studentName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                    />
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Class *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grade 3 or Class 3"
                      value={starForm.className}
                      onChange={(e) => setStarForm({ ...starForm, className: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                    />
                  </div>

                  {/* Division */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Division *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A or Division A"
                      value={starForm.division}
                      onChange={(e) => setStarForm({ ...starForm, division: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingStar(false);
                      setEditingStar(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingStar ? "Update Star" : "Save Shining Star"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* List of Current Shining Stars */}
          <div className="bg-white border border-natural-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-natural-sand" />
                <input
                  type="text"
                  placeholder="Search shining stars by name, class, division..."
                  value={starSearch}
                  onChange={(e) => setStarSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-natural-border bg-natural-bg/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-natural-heading placeholder-natural-sand"
                />
              </div>

              <span className="text-xs font-bold text-natural-sand">
                Total: {shiningStars.length} student{shiningStars.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Stars Table */}
            {(() => {
              const filtered = shiningStars.filter((s) => {
                const q = starSearch.toLowerCase().trim();
                if (!q) return true;
                return (
                  s.studentName.toLowerCase().includes(q) ||
                  s.className.toLowerCase().includes(q) ||
                  s.division.toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-natural-sand border border-dashed border-natural-border rounded-xl">
                    <Star className="w-10 h-10 text-amber-300 mx-auto mb-2 fill-amber-100" />
                    <p className="font-semibold text-natural-heading">No Shining Stars Found</p>
                    <p className="text-xs text-natural-muted mt-1 max-w-sm mx-auto">
                      {starSearch ? "No students match your search criteria." : "Add students who have written outstanding stories to showcase them on the homepage."}
                    </p>
                    {!starSearch && (
                      <button
                        onClick={handleOpenCreateStar}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add First Shining Star
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-natural-text border-collapse">
                    <thead>
                      <tr className="border-b border-natural-border/80 bg-amber-50/40 text-natural-muted text-xs font-sans font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Division</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-natural-border/40">
                      {filtered.map((star) => (
                        <tr key={star.id} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#322f82] flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                              ⭐
                            </span>
                            <span>{star.studentName}</span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                              {star.className}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-amber-800">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100/70 text-amber-900 text-xs font-bold border border-amber-200">
                              {star.division}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditStar(star)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Shining Star"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStar(star.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove Shining Star"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Shining Star Deletion Modal */}
      {starToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          onClick={handleCancelDeleteStar}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800">
                  Remove Shining Star Confirmation
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Are you sure you want to remove <span className="font-bold text-slate-900">"{starToDelete.studentName}"</span> ({starToDelete.className}, {starToDelete.division}) from the Shining Stars section?
                </p>
                <p className="text-xs text-rose-600 font-medium mt-2 leading-relaxed">
                  They will no longer be showcased in the Shining Stars section on the homepage.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelDeleteStar}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStar}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Remove Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Deletion Confirmation Modal */}
      {storyToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-story-dialog-title"
          onClick={handleCancelDeleteStory}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="delete-story-dialog-title" className="text-base font-bold text-slate-800">
                  Delete Story Confirmation
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-slate-900">"{storyToDelete.title}"</span>?
                </p>
                <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Author:</span>
                  <span className="truncate">{storyToDelete.studentName || "Anonymous / Default"}</span>
                  <span className="mx-1">•</span>
                  <span className="font-semibold text-slate-700">Status:</span>
                  <span>{storyToDelete.isPublished ? "Published" : "Draft"}</span>
                </div>
                <p className="text-xs text-rose-600 font-medium mt-2 leading-relaxed">
                  This action cannot be undone. The story will be permanently removed from both the database and story catalog.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelDeleteStory}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStory}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-900 flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">
                    Reset Admin Password
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your administrator security credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {resetPasswordError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-5 flex gap-2.5 text-rose-700 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{resetPasswordError}</p>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordLoading}
                  className="px-5 py-2.5 bg-[#24285b] hover:bg-[#1a1e48] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {resetPasswordLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save New Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

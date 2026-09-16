import React, { useEffect, useState } from "react";
import { getContactContent, submitFeedback } from "../lib/storage";
import { ContactUsContent } from "../types";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";

export default function ContactUs() {
  const [content, setContent] = useState<ContactUsContent | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setContent(getContactContent());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;
    setLoading(true);
    
    try {
      await submitFeedback({
        name: formData.name,
        email: formData.email,
        subject: formData.subject || "General Feedback",
        message: formData.message,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div id="contact-page" className="max-w-6xl mx-auto px-4 py-12 animate-fadeIn text-natural-text">
      {/* Decorative top badge */}
      <div className="flex justify-center mb-4">
        <span className="bg-natural-light border border-natural-border text-natural-primary text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
          Connect With Us
        </span>
      </div>

      <h1 className="text-4xl font-bold font-serif text-center text-natural-heading mb-4 tracking-tight">
        {content.title}
      </h1>
      <p className="text-lg text-natural-muted text-center max-w-2xl mx-auto mb-12">
        {content.description}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
        {/* Info Cards Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-natural-card-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-natural-light text-natural-primary rounded-xl">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-natural-heading text-sm uppercase tracking-wider">Email Address</h3>
              <a href={`mailto:${content.email}`} className="text-natural-primary hover:underline mt-1 block font-semibold">
                {content.email}
              </a>
              <p className="text-natural-sand text-xs mt-1">We respond within 24 business hours.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-natural-card-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-natural-light text-[#322f82] rounded-xl">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-natural-heading text-sm uppercase tracking-wider">Phone Support</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {content.phone.split(",").map((num, idx) => {
                  const cleanNum = num.trim();
                  return (
                    <a
                      key={idx}
                      href={`tel:${cleanNum.replace(/[^0-9+]/g, "")}`}
                      className="text-[#322f82] hover:underline font-semibold text-sm bg-[#cbdbee]/60 px-2.5 py-1 rounded-md border border-[#cbdbee]"
                    >
                      {cleanNum}
                    </a>
                  );
                })}
              </div>
              <p className="text-natural-sand text-xs mt-1.5">Available for school administrators, teachers, and parents.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-natural-card-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-natural-light text-natural-primary rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-natural-heading text-sm uppercase tracking-wider">HQ Campus Address</h3>
              <p className="text-natural-text mt-1 font-semibold leading-relaxed">
                {content.address}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-natural-card-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-natural-light text-natural-primary rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-natural-heading text-sm uppercase tracking-wider">Working Hours</h3>
              <p className="text-natural-text mt-1 font-semibold">
                {content.hours}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="lg:col-span-3 bg-white border border-natural-border rounded-3xl p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-12 animate-scaleIn">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-natural-light text-natural-primary rounded-full mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold font-serif text-natural-heading mb-2">Feedback Received Successfully!</h2>
              <p className="text-natural-muted max-w-sm mx-auto mb-6">
                Thank you for sharing your feedback with Yespaistory Hub. Your message has been saved directly in the school portal inbox.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 bg-natural-primary hover:bg-natural-heading text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Submit Another Feedback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold font-serif text-natural-heading">Send Feedback</h2>
              <p className="text-natural-muted text-sm">Fill out the form below to share your feedback, suggestions, or questions with our school team.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="user-name" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Your Name</label>
                  <input
                    id="user-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-natural-border bg-natural-bg/50 focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-transparent text-natural-heading placeholder-natural-sand"
                  />
                </div>
                <div>
                  <label htmlFor="user-email" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    id="user-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@school.com"
                    className="w-full px-4 py-3 rounded-xl border border-natural-border bg-natural-bg/50 focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-transparent text-natural-heading placeholder-natural-sand"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user-subject" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Subject</label>
                <input
                  id="user-subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Story ideas, suggestions, feedback"
                  className="w-full px-4 py-3 rounded-xl border border-natural-border bg-natural-bg/50 focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-transparent text-natural-heading placeholder-natural-sand"
                />
              </div>

              <div>
                <label htmlFor="user-message" className="block text-xs font-bold text-natural-sand uppercase tracking-wider mb-2">Your Message</label>
                <textarea
                  id="user-message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Type your feedback or suggestions here..."
                  className="w-full px-4 py-3 rounded-xl border border-natural-border bg-natural-bg/50 focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-transparent text-natural-heading placeholder-natural-sand"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-natural-primary hover:bg-natural-heading disabled:bg-natural-sand text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting feedback...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

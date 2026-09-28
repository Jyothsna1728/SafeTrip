import React, { useState } from 'react';
import Modal from './Modal';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import api from '../../api/client';

export default function ContactModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const supportEmail = 'jyothsnamuvvala07@gmail.com';
  const mailtoFallback = `mailto:${supportEmail}?subject=${encodeURIComponent(subject || 'SafeTrip Support Inquiry')}&body=${encodeURIComponent(message || '')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/contact', {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Email service is temporarily unavailable. You can reach out directly via email below.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact SafeTrip Support" maxWidth="max-w-md">
      {success ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Thanks! Your message has been sent.</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Our support team will review your inquiry and respond to your email shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notice</span>
              </div>
              <p>{error}</p>
              <a
                href={mailtoFallback}
                className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:underline pt-1"
              >
                <span>Send via default Email client ({supportEmail})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Jyothsna"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Travel Inquiry / Feedback / Feature Request"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
            <textarea
              rows={4}
              required
              placeholder="Describe your inquiry or feedback..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed font-medium"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <a
              href={mailtoFallback}
              className="text-[11px] text-slate-500 hover:text-teal-600 flex items-center gap-1 font-semibold"
            >
              <Mail className="w-3 h-3" />
              <span>Direct Email</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Message</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

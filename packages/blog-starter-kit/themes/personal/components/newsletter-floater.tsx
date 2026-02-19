import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export const NewsletterFloater = () => {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('newsletterFloaterDismissed');
      if (!dismissed) {
        // show after small delay so it doesn't pop immediately
        const t = setTimeout(() => setVisible(true), 400);
        return () => clearTimeout(t);
      }
    } catch (e) {
      setVisible(true);
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem('newsletterFloaterDismissed', '1');
    } catch (e) {}
    setVisible(false);
  };

  const goToSubscribe = () => {
    if (router.pathname !== '/') {
      router.push('/#newsletter-subscribe');
      return;
    }

    const section = document.getElementById('newsletter-subscribe');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-auto">
      <div className="mx-4 mb-4 w-full max-w-6xl bg-emerald-600 text-white rounded-lg shadow-lg flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-lg">Stay Updated with Latest Algorithms & System Design Content</p>
            <p className="text-sm opacity-90">Get weekly deep dives, interview tips, and exclusive content delivered to your inbox.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToSubscribe}
            className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:opacity-95 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12v7a2 2 0 01-2 2H4a2 2 0 01-2-2v-7" />
              <path d="M16 6l-4 4-4-4" />
            </svg>
            Subscribe
          </button>

          <button
            aria-label="Close newsletter"
            onClick={close}
            className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center hover:opacity-90 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterFloater;

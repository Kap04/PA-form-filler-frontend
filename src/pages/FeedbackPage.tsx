import { useMemo, useState } from 'react';
import { ArrowLeft, MessageSquareQuote, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT ?? '';

export function FeedbackPage() {
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const remaining = useMemo(() => Math.max(0, 1000 - feedback.length), [feedback.length]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSent(false);

    if (!FORMSPREE_ENDPOINT) {
      setError('Feedback endpoint is not configured. Set VITE_FORMSPREE_ENDPOINT in frontend/.env.');
      return;
    }

    if (!feedback.trim()) {
      setError('Please write your feedback before submitting.');
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('feedback', feedback.trim());
      formData.append('_subject', 'PA App Feedback');

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Submission failed with status ${response.status}`);
      }

      setSent(true);
      setFeedback('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf8] px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to PA flow
          </Link>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <MessageSquareQuote className="h-5 w-5 text-coral" /> Feedback
          </div>
          <h1 className="mt-3 font-[Space_Grotesk] text-3xl font-bold text-slate-900">Share feedback</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Any suggestions are welcome. Tell us what to improve.</p>

          {error ? <div className="mt-4 whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {sent ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Thanks for your feedback.</div> : null}

          <form className="mt-6" onSubmit={handleSubmit}>
            <label htmlFor="feedback" className="text-sm font-semibold text-slate-800">
              Feedback
            </label>
            <textarea
              id="feedback"
              name="feedback"
              className="mt-2 min-h-52 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              placeholder="Write your feedback here..."
              value={feedback}
              maxLength={1000}
              onChange={(event) => setFeedback(event.target.value)}
              required
            />
            <div className="mt-2 text-xs text-slate-500">{remaining} characters remaining</div>

            <div className="mt-5 flex items-center gap-3">
              <Button type="submit" disabled={sending}>
                {sending ? 'Submitting...' : 'Submit feedback'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

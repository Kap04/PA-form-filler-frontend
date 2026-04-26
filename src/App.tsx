import { useEffect, useState } from 'react';
import { ChevronRight, FileDown, FilePenLine, MessageSquareHeart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE, checkBackendHealth, extractDraft, fillFinal, resolveDownloadPath, type ExtractedField } from './lib/api';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { FileDropZone } from './components/FileDropZone';
import { PdfPreview } from './components/PdfPreview';

const steps = [
  { id: 'upload', label: 'Upload' },
  { id: 'review', label: 'Review' },
  { id: 'output', label: 'Output' },
] as const;

type StepId = (typeof steps)[number]['id'];

export default function App() {
  const [step, setStep] = useState<StepId>('upload');
  const [emrFile, setEmrFile] = useState<File | null>(null);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [draftPdfUrl, setDraftPdfUrl] = useState<string>('');
  const [finalPdfUrl, setFinalPdfUrl] = useState<string>('');
  const [trackerEntry, setTrackerEntry] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>('');
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  const resetPipelineState = () => {
    setStep('upload');
    setJobId('');
    setTemplateName('');
    setDraftPdfUrl('');
    setFinalPdfUrl('');
    setTrackerEntry(null);
    setNotes([]);
    setFields([]);
  };

  const canAnalyze = Boolean(emrFile && formFile && !busy);

  useEffect(() => {
    let alive = true;
    checkBackendHealth().then((ok) => {
      if (alive) {
        setBackendReady(ok);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const handlePickEmr = (file: File) => {
    setError('');
    resetPipelineState();
    setEmrFile(file);
  };

  const handlePickForm = (file: File) => {
    setError('');
    resetPipelineState();
    setFormFile(file);
  };

  const handleExtract = async () => {
    if (!emrFile || !formFile) {
      setError('Upload both the EMR PDF and the PA form PDF.');
      return;
    }
    const backendHealthy = await checkBackendHealth();
    setBackendReady(backendHealthy);
    if (!backendHealthy) {
      setError(`Backend is not reachable at ${API_BASE}. Start FastAPI first, then try again.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await extractDraft(emrFile, formFile);
      setJobId(response.job_id);
      setTemplateName(response.template_name);
      setFields(response.extracted_fields);
      setDraftPdfUrl(resolveDownloadPath(response.draft_download_path));
      setTrackerEntry(response.tracker_entry);
      setNotes(response.notes);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract fields.');
    } finally {
      setBusy(false);
    }
  };

  const handleFieldChange = (index: number, value: string) => {
    setFields((current: ExtractedField[]) => current.map((field: ExtractedField, fieldIndex: number) => (fieldIndex === index ? { ...field, value } : field)));
  };

  const handleFinalize = async () => {
    if (!jobId) {
      setError('No active job found.');
      return;
    }
    const backendHealthy = await checkBackendHealth();
    setBackendReady(backendHealthy);
    if (!backendHealthy) {
      setError(`Backend is not reachable at ${API_BASE}. Start FastAPI first, then try again.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fillFinal(jobId, Object.fromEntries(fields.map((field: ExtractedField) => [field.name, field.value])));
      setFinalPdfUrl(resolveDownloadPath(response.download_path));
      setTrackerEntry(response.tracker_entry);
      setNotes(response.notes);
      setStep('output');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create the final PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf8] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-orange-100 bg-white px-6 py-6 shadow-sm sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="border-orange-200 bg-orange-50 text-orange-700">PA form auto-fill</Badge>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                <span>API base: {API_BASE}</span>
                <span className={[
                  'rounded-full border px-2 py-1',
                  backendReady === null ? 'border-slate-200 text-slate-500' : backendReady ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700',
                ].join(' ')}>
                  {backendReady === null ? 'Checking backend...' : backendReady ? 'Backend reachable' : 'Backend offline'}
                </span>
              </div>
              <h1 className="mt-4 font-[Space_Grotesk] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Upload EHR + PA form. Get a filled PA form.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                All users need to do is upload the patient EHR PDF and the PA form PDF, review values, and download the filled PA form.
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                No data is stored, retained, or reused. Processing is session-only and in-memory for this workflow.
              </p>
              <Link
                to="/feedback"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
              >
                <MessageSquareHeart className="h-4 w-4" /> Share feedback
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[26rem]">
              {steps.map((item, index) => {
                const active = step === item.id;
                const complete = steps.findIndex((entry) => entry.id === step) > index;
                return (
                  <div
                    key={item.id}
                    className={[
                      'rounded-2xl border px-4 py-3 text-sm transition',
                      active ? 'border-orange-300 bg-orange-50 text-orange-800' : complete ? 'border-orange-100 bg-orange-50/40 text-slate-700' : 'border-slate-200 bg-white text-slate-500',
                    ].join(' ')}
                  >
                    <div className="text-[0.7rem] uppercase tracking-[0.22em]">Step {index + 1}</div>
                    <div className="mt-1 font-semibold">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        {error ? <div className="mt-4 whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {step === 'upload' ? (
          <main className="mt-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-coral" /> Upload files
              </div>
              <h2 className="mt-3 font-[Space_Grotesk] text-2xl font-bold text-slate-900">Upload patient EHR and PA form</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Use PDF files only. After upload, the app fills the PA form for review and final download.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <FileDropZone
                  title="Patient summary PDF"
                  subtitle="Clinical notes, diagnosis history, medications, and any evidence supporting medical necessity."
                  file={emrFile}
                  accept="application/pdf"
                  onPick={handlePickEmr}
                  onError={setError}
                />
                <FileDropZone
                  title="Prior authorization form PDF"
                  subtitle="The fillable PA template supplied by the staff member or payer."
                  file={formFile}
                  accept="application/pdf"
                  onPick={handlePickForm}
                  onError={setError}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={handleExtract} disabled={!canAnalyze}>
                  {busy ? 'Analyzing...' : 'Analyze and build draft'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="text-sm text-slate-500">Your files are used only for this run and are not stored.</div>
              </div>
            </Card>
          </main>
        ) : null}

        {step === 'review' ? (
          <main className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FilePenLine className="h-4 w-4 text-coral" /> Review
                  </div>
                  <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-slate-900">Review fields before finalizing</h2>
                </div>
                <Badge className="border-orange-200 bg-orange-50 text-orange-700">{templateName || 'Detected template'}</Badge>
              </div>

              <div className="mt-6 grid gap-3">
                {fields.map((field, index) => (
                  <div key={`${field.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-semibold text-slate-800">{field.name}</label>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{Math.round(field.confidence * 100)}%</span>
                    </div>
                    <Input
                      className="mt-3"
                      value={field.value}
                      onChange={(event) => handleFieldChange(index, event.target.value)}
                      placeholder="Enter a value"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">Source: {field.source || 'extracted'}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={handleFinalize} disabled={busy}>
                  {busy ? 'Generating final PDF...' : 'Confirm and generate final PDF'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => setStep('upload')} disabled={busy}>
                  Back to upload
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-4 flex items-center justify-between px-2 pt-2">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Draft preview</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Preview</div>
                </div>
                <Badge className="border-orange-200 bg-orange-50 text-orange-700">Draft</Badge>
              </div>
              {draftPdfUrl ? <PdfPreview fileUrl={draftPdfUrl} /> : <div className="rounded-3xl border border-slate-200 bg-orange-50/30 p-8 text-sm text-slate-600">The draft preview appears after extraction.</div>}
            </Card>
          </main>
        ) : null}

        {step === 'output' ? (
          <main className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="p-6">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <FileDown className="h-4 w-4 text-coral" /> Output
              </div>
              <h2 className="mt-3 font-[Space_Grotesk] text-2xl font-bold text-slate-900">Filled PA form is ready</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Download the final editable PDF and submit it.
              </p>

              <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-orange-50/30 p-4 text-sm text-slate-700">
                <div>Job ID: {jobId}</div>
                <div>Template: {templateName || 'Detected template'}</div>
                <div>Data handling: Session-only, not stored.</div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {finalPdfUrl ? (
                  <Button asChild href={finalPdfUrl} download>
                    <>
                      Download filled PDF
                      <FileDown className="ml-2 h-4 w-4" />
                    </>
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={() => setStep('review')}>Back to review</Button>
              </div>

              <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-orange-800">Any suggestions are welcome.</div>
                    <div className="text-sm text-orange-700">Help us improve this PA workflow.</div>
                  </div>
                  <Link
                    to="/feedback"
                    className="inline-flex items-center gap-2 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                  >
                    <MessageSquareHeart className="h-4 w-4" /> Give feedback
                  </Link>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              {finalPdfUrl ? <PdfPreview fileUrl={finalPdfUrl} /> : <div className="rounded-3xl border border-slate-200 bg-orange-50/30 p-8 text-sm text-slate-600">The final PDF preview appears here after confirmation.</div>}
            </Card>
          </main>
        ) : null}

        <Link
          to="/feedback"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-coral px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-105"
          aria-label="Open feedback page"
        >
          <MessageSquareHeart className="h-4 w-4" /> Feedback
        </Link>
      </div>
    </div>
  );
}

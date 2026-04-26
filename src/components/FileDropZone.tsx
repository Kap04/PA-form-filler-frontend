import { CheckCircle2, Upload } from 'lucide-react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import { useRef } from 'react';
import { Button } from './ui/button';

type FileDropZoneProps = {
  title: string;
  subtitle: string;
  file: File | null;
  accept: string;
  onPick: (file: File) => void;
  onError?: (message: string) => void;
};

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function FileDropZone({ title, subtitle, file, accept, onPick, onError }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (picked) {
      if (!isPdfFile(picked)) {
        onError?.('Only PDF files are supported. Please upload a valid .pdf file.');
        return;
      }
      onPick(picked);
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const onClickZone = () => {
    inputRef.current?.click();
  };

  const onKeyDownZone = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${title} upload area`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onClick={onClickZone}
      onKeyDown={onKeyDownZone}
      className={[
        'group block cursor-pointer rounded-3xl border border-dashed p-5 transition',
        file
          ? 'border-orange-300 bg-orange-50/60 shadow-[0_0_0_1px_rgba(251,146,60,0.2)]'
          : 'border-slate-300 bg-white hover:border-orange-300 hover:bg-orange-50/40',
      ].join(' ')}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onInputChange} />
      <div className="flex items-start gap-4">
        <div className={[
          'rounded-2xl p-3',
          file ? 'bg-orange-200 text-coral' : 'bg-orange-100 text-coral',
        ].join(' ')}>
          {file ? <CheckCircle2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">PDF only</p>
          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant={file ? 'primary' : 'secondary'}
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
            >
              {file ? 'Change file' : 'Choose file'}
            </Button>
            <span className={[
              'truncate text-sm',
              file ? 'font-medium text-orange-700' : 'text-slate-600',
            ].join(' ')}>
              {file ? `Uploaded: ${file.name}` : 'No file selected yet'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

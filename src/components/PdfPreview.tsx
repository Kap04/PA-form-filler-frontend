import { useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

type PdfPreviewProps = {
  fileUrl: string;
};

export function PdfPreview({ fileUrl }: PdfPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(520);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    setPageNumber(1);
  }, [fileUrl]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.floor(entries[0].contentRect.width);
      // Keep a small inner gutter and a reasonable max width for readability.
      setContainerWidth(Math.max(260, Math.min(nextWidth - 20, 760)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const canGoBack = pageNumber > 1;
  const canGoNext = totalPages > 0 && pageNumber < totalPages;

  return (
    <div ref={wrapperRef} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <Document
        file={fileUrl}
        onLoadSuccess={(result) => setTotalPages(result.numPages)}
        loading={<div className="p-6 text-sm text-slate-600">Loading PDF preview...</div>}
        error={<div className="p-6 text-sm text-red-700">Failed to render PDF preview.</div>}
      >
        <Page pageNumber={pageNumber} width={containerWidth} renderAnnotationLayer={false} renderTextLayer={false} />
      </Document>
      <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-orange-50/40 px-3 py-2 text-xs text-slate-700">
        <div>
          Page {pageNumber} of {totalPages || 1}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => setPageNumber((value) => value - 1)} disabled={!canGoBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" onClick={() => setPageNumber((value) => value + 1)} disabled={!canGoNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

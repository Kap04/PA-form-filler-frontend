export type ExtractedField = {
  name: string;
  value: string;
  confidence: number;
  source: string;
};

export type ExtractResponse = {
  job_id: string;
  template_name: string;
  extracted_fields: ExtractedField[];
  draft_download_path: string;
  tracker_entry: Record<string, unknown>;
  notes: string[];
};

export type FillResponse = {
  job_id: string;
  template_name: string;
  extracted_fields: ExtractedField[];
  download_path: string;
  editable: boolean;
  tracker_entry: Record<string, unknown>;
  notes: string[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

function toAbsoluteUrl(path: string): string {
  return `${API_BASE}${path}`;
}

function formatNetworkError(url: string, cause: unknown): string {
  const root = cause instanceof Error ? cause.message : String(cause);
  return [
    `Network error: cannot reach backend at ${API_BASE}.`,
    `Request URL: ${url}`,
    'Make sure backend is running: uvicorn app.main:app --reload --port 8000',
    'If backend uses a different port, set VITE_API_BASE_URL in frontend/.env and restart Vite.',
    `Root cause: ${root}`,
  ].join('\n');
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = toAbsoluteUrl(path);
  const requestId = crypto.randomUUID();
  const headers = new Headers(init?.headers);
  headers.set('X-Request-ID', requestId);

  console.info('[api] request.start', {
    requestId,
    method: init?.method ?? 'GET',
    url,
  });

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    console.error('[api] request.network_error', {
      requestId,
      url,
      error,
    });
    throw new Error(formatNetworkError(url, error));
  }

  const serverRequestId = response.headers.get('X-Request-ID') ?? requestId;
  const responseText = await response.text();

  if (!response.ok) {
    let parsedMessage = '';
    try {
      const payload = JSON.parse(responseText) as { message?: string; detail?: string; request_id?: string };
      parsedMessage = payload.message || payload.detail || '';
      console.error('[api] request.http_error', {
        requestId: serverRequestId,
        status: response.status,
        url,
        payload,
      });
    } catch {
      console.error('[api] request.http_error', {
        requestId: serverRequestId,
        status: response.status,
        url,
        body: responseText,
      });
    }

    const message = parsedMessage || responseText || `Request failed with status ${response.status}`;
    throw new Error(`${message}\nRequest ID: ${serverRequestId}`);
  }

  if (!responseText) {
    throw new Error(`Empty response body received from ${url}. Request ID: ${serverRequestId}`);
  }

  try {
    const data = JSON.parse(responseText) as T;
    console.info('[api] request.success', {
      requestId: serverRequestId,
      status: response.status,
      url,
    });
    return data;
  } catch (error) {
    console.error('[api] request.parse_error', {
      requestId: serverRequestId,
      status: response.status,
      url,
      body: responseText,
      error,
    });
    throw new Error(`Invalid JSON response from backend. Request ID: ${serverRequestId}`);
  }
}

export async function extractDraft(emr: File, paForm: File): Promise<ExtractResponse> {
  const formData = new FormData();
  formData.append('emr_pdf', emr);
  formData.append('pa_form_pdf', paForm);
  return requestJson<ExtractResponse>('/extract', {
    method: 'POST',
    body: formData,
  });
}

export async function fillFinal(jobId: string, fieldValues: Record<string, string>): Promise<FillResponse> {
  return requestJson<FillResponse>(`/fill/${jobId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ field_values: fieldValues }),
  });
}

export function resolveDownloadPath(path: string): string {
  return toAbsoluteUrl(path);
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(toAbsoluteUrl('/health'));
    if (!response.ok) {
      return false;
    }
    const payload = (await response.json()) as { status?: string };
    return payload.status === 'ok';
  } catch {
    return false;
  }
}

export { API_BASE };

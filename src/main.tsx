import React from 'react';
import ReactDOM from 'react-dom/client';
import { pdfjs } from 'react-pdf';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import { FeedbackPage } from './pages/FeedbackPage';
import './index.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/feedback" element={<FeedbackPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);

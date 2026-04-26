import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-mint/70 focus:ring-2 focus:ring-mint/20', className)} {...props} />;
}

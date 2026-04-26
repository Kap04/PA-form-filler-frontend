import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  asChild?: false;
  children?: ReactNode;
};

type ButtonAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  asChild: true;
  children?: ReactNode;
};

export function Button(props: ButtonProps): ReactElement;
export function Button(props: ButtonAnchorProps): ReactElement;
export function Button({ className, variant = 'primary', asChild, ...props }: ButtonProps | ButtonAnchorProps) {
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-coral text-white hover:brightness-105',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-orange-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-orange-50',
  };

  const classes = cn('inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition', variants[variant], className);

  if (asChild) {
    return <a className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  }

  return <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)} />;
}

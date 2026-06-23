import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateGameCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export const CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ'];

export const CHOICE_COLORS = [
  { bg: '#EF4444', light: '#FEE2E2', text: '#FFFFFF' },
  { bg: '#3B82F6', light: '#DBEAFE', text: '#FFFFFF' },
  { bg: '#22C55E', light: '#DCFCE7', text: '#FFFFFF' },
  { bg: '#F59E0B', light: '#FEF3C7', text: '#FFFFFF' },
  { bg: '#A855F7', light: '#F3E8FF', text: '#FFFFFF' },
  { bg: '#06B6D4', light: '#CFFAFE', text: '#FFFFFF' },
];

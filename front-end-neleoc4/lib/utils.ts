import { type ClassValue, clsx } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalDateFromSting(dateString = '', pattern = 'dd.MM.yyyy') {
  return format(new Date(dateString), pattern);
}

export default function normalDateFromDate(date: Date, pattern = 'dd.MM.yyyy') {
  return format(date, pattern);
}

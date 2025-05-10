import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  
  const parts = fullName.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '';
  
  const firstNameInitial = parts[0][0] || '';
  const lastNameInitial = parts.length > 1 ? parts[1][0] : '';
  
  return (firstNameInitial + lastNameInitial).toUpperCase();
}
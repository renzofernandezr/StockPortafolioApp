import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatear montos con separador de miles y 2 decimales
export function formatMoney(num: number): string {
  return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Formatear precios de acciones con 3 decimales
export function formatPrice(num: number): string {
  return num.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

// Formatear cantidad con separador de miles y 2 decimales
export function formatQuantity(num: number): string {
  return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

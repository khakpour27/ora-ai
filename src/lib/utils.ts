import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number): string {
  return `${formatNumber(value * 100, 1)} %`;
}

export function formatGWh(value: number): string {
  return `${formatNumber(value, 1)} GWh`;
}

export function formatTonnes(value: number): string {
  return `${formatNumber(value)} tonn`;
}

export function formatMNOK(value: number): string {
  return `${formatNumber(value, 1)} MNOK`;
}

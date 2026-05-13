import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decimalPlaces(value: number) {
  const split = value.toString().split(".");
  return split[1]?.length ?? 0;
}

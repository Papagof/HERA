// wa.me requires digits only (no "+", spaces, or dashes) in international format.
export function buildWhatsAppLink(number: string, text?: string): string {
  const digits = number.replace(/[^0-9]/g, "");
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

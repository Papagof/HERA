// wa.me requires digits only (no "+", spaces, or dashes), in full
// international format with no leading 0 - phone numbers in this app are
// generally entered in local Nigerian format (e.g. "08012345678"), so a
// leading 0 is swapped for the country code; numbers already given with a
// country code are left as-is.
export function buildWhatsAppLink(number: string, text?: string): string {
  const digits = number.replace(/[^0-9]/g, "");
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${international}${query}`;
}

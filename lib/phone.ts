export function normalizePhoneNumber(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15 && !digits.startsWith("0")) {
    return `+${digits}`;
  }

  return null;
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return phone;
  return `(***) ***-${local.slice(-4)}`;
}

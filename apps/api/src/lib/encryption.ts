export function maskPan(pan: string): string {
  if (!pan || pan.length < 10) return pan;
  return `${pan.substring(0, 2)}*****${pan.substring(7)}`;
}

export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length < 12) return aadhaar;
  return `********${aadhaar.substring(8)}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 10) return phone;
  return `******${phone.substring(6)}`;
}

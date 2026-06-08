import { X509Certificate } from "node:crypto";

export function pemFromDerBase64(derB64: string): string {
  const lines = derB64.match(/.{1,64}/g) ?? [derB64];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

/** Validates each cert in x5c is issued by the next (Apple JWS chain). */
export function verifyAppleX5cChain(x5c: string[]): boolean {
  if (x5c.length < 2) return true;
  try {
    const certs = x5c.map(
      (der) => new X509Certificate(pemFromDerBase64(der)),
    );
    for (let i = 0; i < certs.length - 1; i++) {
      if (!certs[i]!.checkIssued(certs[i + 1]!)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

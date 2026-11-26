/**
 * Builds the text payloads encoded in QR codes. Keeping these pure makes the exact
 * Wi-Fi/UPI/email strings testable without a browser or a QR renderer.
 */
export type QrPayloadKind = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'upi';

const ABSOLUTE_PAYLOAD = /^(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|tel:|sms:|upi:|geo:)/i;

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return ABSOLUTE_PAYLOAD.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Escapes the characters Wi-Fi QR readers treat as field separators. */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export interface WifiInput {
  ssid: string;
  password?: string;
  encryption?: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export function wifiPayload(input: WifiInput): string {
  const encryption = input.encryption ?? (input.password ? 'WPA' : 'nopass');
  const fields = [`T:${encryption}`, `S:${escapeWifi(input.ssid)}`];
  if (encryption !== 'nopass' && input.password) fields.push(`P:${escapeWifi(input.password)}`);
  if (input.hidden) fields.push('H:true');
  return `WIFI:${fields.join(';')};;`;
}

export interface EmailInput {
  to: string;
  subject?: string;
  body?: string;
}

export function emailPayload(input: EmailInput): string {
  const query = [
    input.subject ? `subject=${encodeURIComponent(input.subject)}` : '',
    input.body ? `body=${encodeURIComponent(input.body)}` : '',
  ]
    .filter(Boolean)
    .join('&');
  return `mailto:${input.to.trim()}${query ? `?${query}` : ''}`;
}

export function phonePayload(number: string): string {
  return `tel:${number.trim().replace(/[\s().-]/g, '')}`;
}

export interface SmsInput {
  number: string;
  message?: string;
}

export function smsPayload(input: SmsInput): string {
  const number = input.number.trim().replace(/[\s().-]/g, '');
  return `sms:${number}${input.message ? `?body=${encodeURIComponent(input.message)}` : ''}`;
}

export interface UpiInput {
  /** Payee address (VPA), e.g. name@bank. */
  payee: string;
  name?: string;
  amount?: string;
  note?: string;
  currency?: string;
}

function queryString(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => {
      const encoded = encodeURIComponent(value);
      // UPI apps expect the raw @ in a payee address (name@bank).
      return `${key}=${key === 'pa' ? encoded.replace(/%40/g, '@') : encoded}`;
    })
    .join('&');
}

export function upiPayload(input: UpiInput): string {
  return `upi://pay?${queryString({
    pa: input.payee.trim(),
    pn: input.name?.trim(),
    am: input.amount?.trim(),
    cu: input.currency ?? 'INR',
    tn: input.note?.trim(),
  })}`;
}

import { describe, expect, it } from 'vitest';
import {
  emailPayload,
  escapeWifi,
  normalizeUrl,
  phonePayload,
  smsPayload,
  upiPayload,
  wifiPayload,
} from './qr';

describe('normalizeUrl', () => {
  it('adds https to a bare address', () => {
    expect(normalizeUrl('  example.com/path ')).toBe('https://example.com/path');
  });

  it('keeps absolute links and app schemes', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    expect(normalizeUrl('mailto:hi@example.com')).toBe('mailto:hi@example.com');
    expect(normalizeUrl('upi://pay?pa=name@bank')).toBe('upi://pay?pa=name@bank');
  });

  it('does not mistake a port for a scheme', () => {
    expect(normalizeUrl('example.com:8080')).toBe('https://example.com:8080');
  });

  it('ignores blank input', () => {
    expect(normalizeUrl('   ')).toBe('');
  });
});

describe('wifiPayload', () => {
  it('escapes separators in names and passwords', () => {
    expect(escapeWifi('Cafe;Guest')).toBe('Cafe\\;Guest');
    expect(wifiPayload({ ssid: 'Cafe;Guest', password: 'p:a\\ss', encryption: 'WPA' })).toBe(
      'WIFI:T:WPA;S:Cafe\\;Guest;P:p\\:a\\\\ss;;',
    );
  });

  it('defaults to WPA when a password is present', () => {
    expect(wifiPayload({ ssid: 'Cafe', password: 'secret' })).toBe('WIFI:T:WPA;S:Cafe;P:secret;;');
  });

  it('omits the password for open networks', () => {
    expect(wifiPayload({ ssid: 'Cafe', encryption: 'nopass', password: 'ignored' })).toBe(
      'WIFI:T:nopass;S:Cafe;;',
    );
  });

  it('marks hidden networks', () => {
    expect(wifiPayload({ ssid: 'Cafe', password: 'secret', hidden: true })).toBe(
      'WIFI:T:WPA;S:Cafe;P:secret;H:true;;',
    );
  });
});

describe('emailPayload', () => {
  it('encodes the subject and body', () => {
    expect(
      emailPayload({ to: ' hi@example.com ', subject: 'Hello world', body: 'Line 1\nLine 2' }),
    ).toBe('mailto:hi@example.com?subject=Hello%20world&body=Line%201%0ALine%202');
  });

  it('leaves out an empty query', () => {
    expect(emailPayload({ to: 'hi@example.com' })).toBe('mailto:hi@example.com');
  });
});

describe('phonePayload', () => {
  it('keeps the country code and strips formatting', () => {
    expect(phonePayload(' +91 (987) 654-3210 ')).toBe('tel:+919876543210');
  });
});

describe('smsPayload', () => {
  it('encodes an optional message', () => {
    expect(smsPayload({ number: '+91 98765 43210', message: 'Hi there' })).toBe(
      'sms:+919876543210?body=Hi%20there',
    );
  });

  it('works without a message', () => {
    expect(smsPayload({ number: '+91 98765 43210' })).toBe('sms:+919876543210');
  });
});

describe('upiPayload', () => {
  it('builds a payment link with the raw payee address', () => {
    expect(
      upiPayload({
        payee: 'name@bank',
        name: 'Café',
        amount: '125.50',
        note: 'Lunch & tea',
      }),
    ).toBe('upi://pay?pa=name@bank&pn=Caf%C3%A9&am=125.50&cu=INR&tn=Lunch%20%26%20tea');
  });

  it('always includes the currency', () => {
    expect(upiPayload({ payee: 'name@bank' })).toBe('upi://pay?pa=name@bank&cu=INR');
    expect(upiPayload({ payee: 'name@bank', currency: 'USD' })).toBe(
      'upi://pay?pa=name@bank&cu=USD',
    );
  });
});

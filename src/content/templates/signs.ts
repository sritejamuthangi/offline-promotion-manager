import type { TemplateDefinition } from '@/core/templates';
import { createKit, NO_FILL, solidFill, templateTheme } from './kit';

export const wifiSign: TemplateDefinition = {
  id: 'wifi-sign',
  name: 'Wi-Fi password sign',
  description:
    'Welcome guests with an easy-to-read Wi-Fi sign. Edit the network, password and QR payload to match your connection, in A5 or half-letter size.',
  category: 'signs',
  tags: ['wifi', 'internet', 'password', 'guest', 'cafe', 'hotel', 'office', 'qr'],
  size: { a4: 'a5', letter: 'half-letter' },
  theme: templateTheme('mint', 'friendly'),
  build: (page) => {
    const k = createKit(page);
    const { W, s } = k;
    const band = k.y(40);
    const icon = s(24);
    const qr = s(21);
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect({ x: -s(10), y: -s(20), w: W + s(20), h: band + s(20) }, '$primary', {
            radius: s(12),
          }),
          k.icon('wifi', { x: (W - icon) / 2, y: k.y(5), w: icon, h: icon }, '$background', {
            strokeWidth: 2.25,
          }),
          k.text('Free Wi-Fi', k.box(8, 24, 84, 11), {
            font: '$heading',
            size: s(12),
            weight: 800,
            lineHeight: 1.1,
            color: '$background',
            placeholder: true,
          }),
          k.text('Network', k.box(10, 44, 80, 4.5), {
            size: s(3.6),
            weight: 600,
            spacing: 0.1,
            lineHeight: 1.1,
            transform: 'uppercase',
            color: '$muted',
          }),
          k.text('Guest Wi-Fi', k.box(10, 48.5, 80, 7), {
            font: '$heading',
            size: s(6.5),
            weight: 800,
            lineHeight: 1.1,
            placeholder: true,
          }),
          k.text('Password', k.box(10, 57.5, 80, 4.5), {
            size: s(3.6),
            weight: 600,
            spacing: 0.1,
            lineHeight: 1.1,
            transform: 'uppercase',
            color: '$muted',
          }),
          k.text('change-me-123', k.box(10, 62, 80, 7), {
            font: '$heading',
            size: s(6.5),
            weight: 800,
            lineHeight: 1.1,
            placeholder: true,
          }),
          k.qr(
            'WIFI:T:WPA;S:Guest Wi-Fi;P:change-me-123;;',
            { x: (W - qr) / 2, y: k.y(71.5), w: qr, h: qr },
            { placeholder: true },
          ),
          k.text('Scan to connect', k.box(10, 90, 80, 5), {
            size: s(3.6),
            weight: 600,
            lineHeight: 1.1,
            color: '$secondary',
          }),
        ],
      },
    ];
  },
};

export const noticeSign: TemplateDefinition = {
  id: 'notice-sign',
  name: 'Notice sign',
  description:
    'Display an important notice with high-contrast colours, a warning icon and a clear message. Customise this A4 or US Letter sign for your venue.',
  category: 'signs',
  tags: ['notice', 'warning', 'closed', 'announcement', 'caution', 'office', 'shop'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('noir', 'headline'),
  build: (page) => {
    const k = createKit(page);
    const { W, H, s } = k;
    const icon = s(20);
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect({ x: s(4), y: s(4), w: W - s(8), h: H - s(8) }, NO_FILL, {
            radius: s(2),
            stroke: { color: '$primary', width: s(1.1) },
            name: 'Border',
          }),
          k.icon('triangle-alert', { x: (W - icon) / 2, y: k.y(9), w: icon, h: icon }, '$primary'),
          k.text('Please note', k.box(10, 27, 80, 9), {
            font: '$heading',
            size: s(10),
            weight: 700,
            spacing: 0.04,
            lineHeight: 1.1,
            transform: 'uppercase',
            color: '$primary',
          }),
          k.line({ x: k.x(32), y: k.y(37.5), w: k.x(36), h: s(0.6) }, '$primary'),
          k.text('This area is closed\nfor cleaning', k.box(10, 41, 80, 20), {
            font: '$heading',
            size: s(8),
            weight: 600,
            lineHeight: 1.12,
            placeholder: true,
          }),
          k.text('We will reopen at 2 pm. Sorry for any inconvenience.', k.box(14, 63, 72, 9), {
            size: s(3.8),
            lineHeight: 1.4,
            color: '$muted',
            placeholder: true,
          }),
          k.text('Thank you for your patience', k.box(10, 83, 80, 5), {
            size: s(3.8),
            weight: 600,
            lineHeight: 1.1,
            color: '$primary',
          }),
          k.text('The management', k.box(10, 88, 80, 4.5), {
            size: s(3),
            lineHeight: 1.1,
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

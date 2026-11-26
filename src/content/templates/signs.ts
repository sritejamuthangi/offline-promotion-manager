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

export const openingHours: TemplateDefinition = {
  id: 'opening-hours',
  name: 'Opening hours sign',
  description:
    'Make your weekly hours easy to find with a clear shop-door sign, editable schedule and contact line. Available in A4 or US Letter.',
  category: 'signs',
  tags: ['opening', 'hours', 'schedule', 'shop', 'store', 'door', 'business'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('ocean', 'clean'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 100, 28), '$primary'),
          k.text('Come on in', k.box(8, 5, 84, 10), {
            font: '$heading',
            size: s(10),
            weight: 700,
            color: '$background',
            placeholder: true,
          }),
          k.text('OUR OPENING HOURS', k.box(8, 18, 84, 5), {
            size: s(3.5),
            spacing: 0.13,
            color: '$background',
          }),
          ...days.flatMap((day, i) => [
            k.rect(k.box(8, 34 + i * 7, 84, 6), i % 2 === 0 ? '$surface' : '$background', {
              radius: s(0.8),
            }),
            k.text(day, k.box(12, 34 + i * 7, 35, 6), {
              size: s(3.6),
              weight: 600,
              align: 'start',
              placeholder: true,
            }),
            k.text(
              i === 6 ? 'Closed' : i === 5 ? '10 am – 4 pm' : '9 am – 6 pm',
              k.box(49, 34 + i * 7, 39, 6),
              { size: s(3.6), align: 'end', color: '$primary', placeholder: true },
            ),
          ]),
          k.text('Holiday hours may vary. Visit example.com', k.box(8, 88, 84, 6), {
            size: s(2.9),
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const directionalSign: TemplateDefinition = {
  id: 'directional-sign',
  name: 'Wayfinding arrow sign',
  description:
    'Point visitors in the right direction with a large editable label, arrow and supporting line. A landscape A4 or US Letter wayfinding sign for venues and events.',
  category: 'signs',
  tags: ['direction', 'arrow', 'wayfinding', 'reception', 'venue', 'event', 'entrance'],
  size: { a4: 'certificate-a4', letter: 'certificate-letter' },
  theme: templateTheme('sky', 'modern'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$primary'),
        elements: [
          k.text('WELCOME', k.box(7, 12, 59, 9), {
            size: s(4),
            weight: 700,
            spacing: 0.2,
            align: 'start',
            color: '$background',
          }),
          k.text('Reception', k.box(7, 32, 59, 22), {
            font: '$heading',
            size: s(10.8),
            weight: 800,
            align: 'start',
            color: '$background',
            placeholder: true,
          }),
          k.text('Check in here', k.box(7, 65, 59, 11), {
            size: s(5.2),
            align: 'start',
            color: '$background',
            placeholder: true,
          }),
          k.sticker('arrow', k.box(73, 29, 21, 38), '$background', { name: 'Direction arrow' }),
          k.text('Level 1 · Main entrance', k.box(7, 84, 86, 7), {
            size: s(3.2),
            align: 'start',
            color: '$background',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const reservedSign: TemplateDefinition = {
  id: 'reserved-sign',
  name: 'Reserved table sign',
  description:
    'Reserve a place with a simple landscape table sign, guest name and time. Edit the wording in A6 or 4 × 6 inch size for cafés, meetings and celebrations.',
  category: 'signs',
  tags: ['reserved', 'table', 'seat', 'restaurant', 'meeting', 'name', 'card'],
  size: { a4: 'postcard-a6', letter: 'postcard-4x6' },
  theme: templateTheme('terracotta', 'elegant'),
  build: (page) => {
    const k = createKit(page);
    const { W, H, s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect({ x: s(5), y: s(5), w: W - s(10), h: H - s(10) }, NO_FILL, {
            stroke: { color: '$primary', width: s(0.3) },
          }),
          k.icon('utensils', { x: W / 2 - s(6), y: k.y(13), w: s(12), h: s(12) }, '$primary', {
            strokeWidth: 1.3,
          }),
          k.text('Reserved', k.box(10, 32, 80, 23), {
            font: '$heading',
            size: s(15),
            lineHeight: 1.1,
            color: '$primary',
            placeholder: true,
          }),
          k.text('The Morgan party', k.box(10, 61, 80, 10), { size: s(4.8), placeholder: true }),
          k.text('7 PM · THANK YOU', k.box(10, 77, 80, 8), {
            size: s(3.5),
            spacing: 0.16,
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const quietZone: TemplateDefinition = {
  id: 'quiet-zone',
  name: 'Quiet space sign',
  description:
    'Create a calm reminder for a library, study area or shared workspace with clear typography and a book icon. Personalise this A4 or US Letter sign.',
  category: 'signs',
  tags: ['quiet', 'silence', 'library', 'study', 'workspace', 'office', 'reading'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('lavender', 'friendly'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.ellipse({ x: k.x(32), y: k.y(10), w: s(36), h: s(36) }, '$surface'),
          k.icon('book-open', { x: k.x(41), y: k.y(10) + s(9), w: s(18), h: s(18) }, '$primary', {
            strokeWidth: 1.5,
          }),
          k.text('Quiet space', k.box(8, 43, 84, 12), {
            font: '$heading',
            size: s(10.5),
            weight: 800,
            color: '$primary',
            placeholder: true,
          }),
          k.text('Big ideas need a little quiet.', k.box(12, 60, 76, 6), {
            size: s(4),
            weight: 600,
            placeholder: true,
          }),
          k.text('Please keep voices low\nand take calls outside.', k.box(12, 70, 76, 10), {
            size: s(3.8),
            lineHeight: 1.5,
            color: '$muted',
            placeholder: true,
          }),
          k.text('Thank you for sharing this space kindly.', k.box(10, 89, 80, 5), {
            size: s(2.9),
            color: '$primary',
          }),
        ],
      },
    ];
  },
};

export const recyclingSign: TemplateDefinition = {
  id: 'recycling-sign',
  name: 'Paper recycling sign',
  description:
    'Label a recycling station with a large paper-and-card heading and editable sorting guidance. Adapt the instructions to your local collection in A4 or US Letter.',
  category: 'signs',
  tags: ['recycling', 'paper', 'card', 'bin', 'sorting', 'environment', 'office'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('forest', 'heavy'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 100, 8), '$primary'),
          k.icon('leaf', { x: k.x(38), y: k.y(14), w: s(24), h: s(24) }, '$primary', {
            strokeWidth: 1.5,
          }),
          k.text('PAPER\n& CARD', k.box(8, 38, 84, 22), {
            font: '$heading',
            size: s(12),
            lineHeight: 1.05,
            color: '$primary',
            placeholder: true,
          }),
          k.text('Clean, dry and flattened', k.box(10, 64, 80, 7), {
            size: s(4.2),
            weight: 700,
            placeholder: true,
          }),
          k.rect(k.box(10, 76, 80, 13), '$surface', { radius: s(2) }),
          k.text(
            'Check local collection rules.\nKeep food and liquids out.',
            k.box(14, 78, 72, 9),
            { size: s(3.3), lineHeight: 1.5, placeholder: true },
          ),
          k.text('Small actions. A shared future.', k.box(10, 93, 80, 4), {
            size: s(2.8),
            color: '$muted',
          }),
        ],
      },
    ];
  },
};

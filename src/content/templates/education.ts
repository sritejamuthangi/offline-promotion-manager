import type { IconName } from '@/core/schema';
import type { TemplateDefinition } from '@/core/templates';
import { createKit, solidFill, templateTheme } from './kit';

export const certificate: TemplateDefinition = {
  id: 'certificate',
  name: 'Certificate of achievement',
  description:
    'Recognise achievement with an elegant landscape certificate, decorative border and award seal. Edit the recipient, message, date and signature in A4 or US Letter.',
  category: 'education',
  tags: ['award', 'diploma', 'school', 'course', 'completion', 'recognition', 'prize'],
  size: { a4: 'certificate-a4', letter: 'certificate-letter' },
  theme: templateTheme('royal', 'formal'),
  build: (page) => {
    const k = createKit(page);
    const { W, H, s } = k;
    const seal = s(18);
    const sealX = (W - seal) / 2;
    const sealY = k.y(72);
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.graphic('frame-classic', { x: 0, y: 0, w: W, h: H }, { name: 'Border' }),
          k.text('CERTIFICATE', k.box(10, 13, 80, 10), {
            size: s(7),
            weight: 700,
            spacing: 0.22,
            lineHeight: 1.1,
            color: '$primary',
          }),
          k.text('OF ACHIEVEMENT', k.box(10, 23, 80, 5), {
            size: s(3.2),
            weight: 600,
            spacing: 0.4,
            lineHeight: 1.1,
            color: '$secondary',
          }),
          k.text('This certificate is proudly presented to', k.box(10, 33, 80, 5), {
            size: s(3),
            italic: true,
            lineHeight: 1.1,
            color: '$muted',
          }),
          k.text('Jordan Lee', k.box(10, 38.5, 80, 16), {
            font: '$heading',
            size: s(12),
            lineHeight: 1.1,
            placeholder: true,
          }),
          k.line({ x: k.x(28), y: k.y(55.5), w: k.x(44), h: s(0.25) }, '$secondary'),
          k.text(
            'For outstanding dedication, creativity and excellent results this year.',
            k.box(22, 58.5, 56, 10),
            { size: s(3.2), lineHeight: 1.4, placeholder: true },
          ),
          k.text('15 June', k.box(14, 75, 24, 5.5), {
            size: s(3),
            valign: 'bottom',
            lineHeight: 1.1,
            placeholder: true,
          }),
          k.line({ x: k.x(14), y: k.y(81), w: k.x(24), h: s(0.2) }, '$text'),
          k.text('Date', k.box(14, 82, 24, 4.5), {
            size: s(2.6),
            valign: 'top',
            lineHeight: 1.1,
            color: '$muted',
          }),
          k.line({ x: k.x(62), y: k.y(81), w: k.x(24), h: s(0.2) }, '$text'),
          k.text('Signature', k.box(62, 82, 24, 4.5), {
            size: s(2.6),
            valign: 'top',
            lineHeight: 1.1,
            color: '$muted',
          }),
          k.graphic('seal', { x: sealX, y: sealY, w: seal, h: seal }),
          k.text(
            'AWARD',
            { x: sealX, y: sealY + seal * 0.4, w: seal, h: seal * 0.2 },
            {
              size: s(2.4),
              weight: 700,
              spacing: 0.2,
              lineHeight: 1.1,
              color: '$background',
            },
          ),
        ],
      },
    ];
  },
};

export const workshopFlyer: TemplateDefinition = {
  id: 'workshop-flyer',
  name: 'Workshop flyer',
  description:
    'Invite your community to a workshop with a clear agenda, botanical decoration and booking QR code. Edit the details in A5 or half-letter size.',
  category: 'education',
  tags: ['class', 'course', 'lesson', 'training', 'community', 'learn', 'garden'],
  size: { a4: 'a5', letter: 'half-letter' },
  theme: templateTheme('forest', 'clean'),
  build: (page) => {
    const k = createKit(page);
    const { W, H, s } = k;
    const leaves = k.x(36);
    const qr = s(17);
    const band = k.y(73);
    const bullet = s(4.6);
    const points = [
      'Choosing seeds and soil',
      'Watering, light and care',
      'Harvesting and storing',
    ];
    const details: [IconName, string][] = [
      ['calendar', 'Saturday · 10 am – 12 pm'],
      ['map-pin', 'Community Library, Room 2'],
    ];
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.graphic('leaves', { x: W - leaves - k.x(2), y: k.y(2), w: leaves, h: leaves * 0.7 }),
          k.text('FREE WORKSHOP', k.box(8, 8, 60, 4.5), {
            size: s(3.8),
            weight: 700,
            spacing: 0.2,
            lineHeight: 1.1,
            align: 'start',
            color: '$secondary',
          }),
          k.text('Grow your\nown herbs', k.box(8, 13, 70, 19), {
            font: '$heading',
            size: s(10.5),
            weight: 700,
            lineHeight: 1.05,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text(
            'A hands-on session for beginners. Everyone takes home a starter pot.',
            k.box(8, 33, 84, 9),
            {
              size: s(3.7),
              lineHeight: 1.4,
              align: 'start',
              valign: 'top',
              color: '$muted',
              placeholder: true,
            },
          ),
          k.text('What you’ll learn', k.box(8, 44.5, 84, 5), {
            font: '$heading',
            size: s(4.4),
            weight: 700,
            lineHeight: 1.1,
            align: 'start',
          }),
          ...points.flatMap((point, i) => {
            const top = k.y(51 + i * 6.8);
            return [
              k.icon('circle-check', { x: k.x(8), y: top, w: bullet, h: bullet }, '$secondary'),
              k.text(
                point,
                {
                  x: k.x(8) + bullet + s(2.5),
                  y: top - s(0.8),
                  w: k.x(80) - bullet,
                  h: bullet + s(1.6),
                },
                { size: s(3.6), align: 'start', placeholder: true },
              ),
            ];
          }),
          k.rect({ x: 0, y: band, w: W, h: H - band }, '$primary'),
          ...details.flatMap(([name, label], i) => {
            const top = band + k.y(4.5 + i * 7);
            const icon = s(4.4);
            return [
              k.icon(name, { x: k.x(8), y: top, w: icon, h: icon }, '$background'),
              k.text(
                label,
                { x: k.x(8) + icon + s(2.5), y: top - s(1), w: k.x(56) - icon, h: icon + s(2) },
                {
                  size: s(3.4),
                  weight: 600,
                  align: 'start',
                  color: '$background',
                  placeholder: true,
                },
              ),
            ];
          }),
          k.text(
            'Places are limited. Scan to book.',
            { x: k.x(8), y: band + k.y(18.5), w: k.x(58), h: k.y(5) },
            { size: s(3), lineHeight: 1.1, align: 'start', color: '$background' },
          ),
          k.qr(
            'https://example.com/workshop',
            { x: W - k.x(8) - qr, y: band + (H - band - qr) / 2, w: qr, h: qr },
            { placeholder: true },
          ),
        ],
      },
    ];
  },
};

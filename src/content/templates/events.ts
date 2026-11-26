import type { IconName } from '@/core/schema';
import type { TemplateDefinition } from '@/core/templates';
import { createKit, libraryFill, softShadow, templateTheme } from './kit';

export const eventPoster: TemplateDefinition = {
  id: 'event-poster',
  name: 'Music festival poster',
  description:
    'Create a music festival poster with a bold headline, event date, venue and QR code. Personalise the colours and fonts for A3 or US tabloid paper.',
  category: 'events',
  tags: ['concert', 'festival', 'music', 'gig', 'live', 'party', 'outdoor', 'fair'],
  size: { a4: 'a3', letter: 'tabloid' },
  theme: templateTheme('sunset', 'poster'),
  build: (page) => {
    const k = createKit(page);
    const { W, s } = k;
    const card = k.box(8, 50, 84, 19);
    const column = card.w / 3;
    const icon = s(6);
    const qr = s(19);
    const details: [IconName, string][] = [
      ['calendar', 'Saturday\n14 June'],
      ['clock', '4 pm –\n11 pm'],
      ['map-pin', 'Riverside\nPark'],
    ];
    return [
      {
        background: libraryFill('soft-gradient'),
        elements: [
          k.text('THIS SUMMER', k.box(8, 6, 84, 4.5), {
            size: s(3.2),
            weight: 700,
            spacing: 0.3,
            lineHeight: 1.1,
            color: '$primary',
          }),
          k.text('MUSIC\nFESTIVAL', k.box(8, 10.5, 84, 30), {
            font: '$heading',
            size: s(22),
            lineHeight: 0.92,
            placeholder: true,
          }),
          k.text('Three stages · 20 artists · Food & crafts', k.box(8, 41.5, 84, 5), {
            size: s(3.6),
            weight: 500,
            lineHeight: 1.1,
            color: '$muted',
            placeholder: true,
          }),
          k.rect(card, '$surface', { radius: s(3), shadow: softShadow(s(1)) }),
          ...details.flatMap(([name, label], i) => {
            const left = card.x + column * i;
            return [
              k.icon(
                name,
                { x: left + (column - icon) / 2, y: card.y + s(3), w: icon, h: icon },
                '$primary',
              ),
              k.text(
                label,
                {
                  x: left + s(1),
                  y: card.y + s(4.5) + icon,
                  w: column - s(2),
                  h: card.h - icon - s(6),
                },
                { size: s(4), weight: 700, lineHeight: 1.2, valign: 'top', placeholder: true },
              ),
            ];
          }),
          k.text('Free entry · All ages', k.box(8, 74, 52, 6), {
            font: '$heading',
            size: s(5.6),
            lineHeight: 1.1,
            align: 'start',
            color: '$primary',
          }),
          k.text('Scan the code for artists, maps and food stalls.', k.box(8, 80.5, 52, 7.5), {
            size: s(3.2),
            lineHeight: 1.35,
            align: 'start',
            valign: 'top',
          }),
          k.text('example.com/festival', k.box(8, 88.5, 52, 4), {
            size: s(3.2),
            weight: 700,
            lineHeight: 1.1,
            align: 'start',
            color: '$secondary',
            placeholder: true,
          }),
          k.qr(
            'https://example.com/festival',
            { x: W - k.x(8) - qr, y: k.y(73.5), w: qr, h: qr },
            {
              placeholder: true,
            },
          ),
        ],
      },
    ];
  },
};

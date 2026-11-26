import type { IconName } from '@/core/schema';
import type { TemplateDefinition } from '@/core/templates';
import { createKit, libraryFill, softShadow, solidFill, templateTheme } from './kit';

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

export const communityMarket: TemplateDefinition = {
  id: 'community-market',
  name: 'Community market poster',
  description:
    'Bring neighbours together with an illustrated market poster for food, crafts and local makers. Customise the date, location and stall information in A3 or US tabloid.',
  category: 'events',
  tags: ['market', 'community', 'craft', 'makers', 'fair', 'local', 'weekend'],
  size: { a4: 'a3', letter: 'tabloid' },
  theme: templateTheme('terracotta', 'editorial'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const stalls: [IconName, string][] = [
      ['utensils', 'Good food'],
      ['palette', 'Local makers'],
      ['leaf', 'Fresh finds'],
    ];
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.graphic('bunting', k.box(0, 0, 100, 15)),
          k.text('MEET YOUR NEIGHBOURS', k.box(8, 19, 84, 5), {
            size: s(3),
            weight: 700,
            spacing: 0.15,
            color: '$secondary',
          }),
          k.text('The Sunday\nMarket', k.box(8, 27, 84, 20), {
            font: '$heading',
            size: s(10),
            lineHeight: 1.15,
            color: '$primary',
            placeholder: true,
          }),
          ...stalls.flatMap(([icon, label], i) => [
            k.ellipse({ x: k.x(15 + i * 29), y: k.y(52), w: s(12), h: s(12) }, '$surface'),
            k.icon(icon, { x: k.x(18 + i * 29), y: k.y(52) + s(3), w: s(6), h: s(6) }, '$primary'),
            k.text(label, k.box(8 + i * 29, 63, 26, 5), { size: s(3.3), weight: 600 }),
          ]),
          k.line({ x: k.x(15), y: k.y(73), w: k.x(70), h: s(0.3) }, '$secondary'),
          k.text('EVERY SUNDAY · 9 AM – 2 PM', k.box(8, 77, 84, 6), {
            size: s(4),
            weight: 700,
            placeholder: true,
          }),
          k.text(
            'Town Square · Free entry\nStall enquiries: hello@example.com',
            k.box(8, 85, 84, 9),
            { size: s(3.2), lineHeight: 1.45, color: '$muted', placeholder: true },
          ),
        ],
      },
    ];
  },
};

export const charityRun: TemplateDefinition = {
  id: 'charity-run',
  name: 'Community charity run flyer',
  description:
    'Invite people to a community run or walk with a bold distance, event details and registration QR code. Edit the cause and route in A4 or US Letter.',
  category: 'events',
  tags: ['charity', 'run', 'walk', 'fundraiser', 'sport', 'community', '5k'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('citrus', 'heavy'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: libraryFill('wave-footer'),
        elements: [
          k.text('MOVE TOGETHER. MAKE A DIFFERENCE.', k.box(8, 7, 84, 5), {
            size: s(2.8),
            weight: 700,
            color: '$primary',
          }),
          k.text('5K', k.box(8, 15, 84, 28), {
            font: '$heading',
            size: s(33),
            lineHeight: 1,
            color: '$primary',
            placeholder: true,
          }),
          k.text('RUN / WALK', k.box(8, 45, 84, 8), {
            font: '$heading',
            size: s(8),
            lineHeight: 1.05,
            placeholder: true,
          }),
          k.text('A morning for our community garden.', k.box(10, 55, 80, 7), {
            size: s(3.5),
            placeholder: true,
          }),
          k.rect(k.box(7, 68, 86, 25), '$background', { radius: s(3), shadow: softShadow(s(0.7)) }),
          k.text('20 SEPTEMBER · 8 AM', k.box(12, 72, 57, 6), {
            size: s(3.8),
            weight: 800,
            align: 'start',
            placeholder: true,
          }),
          k.text('Start: Riverside Park\nAll paces welcome. Scan to join.', k.box(12, 80, 57, 9), {
            size: s(3),
            lineHeight: 1.45,
            align: 'start',
            placeholder: true,
          }),
          k.qr(
            'https://example.com/run',
            { x: k.x(72), y: k.y(74), w: s(16), h: s(16) },
            { placeholder: true },
          ),
        ],
      },
    ];
  },
};

export const exhibitionPoster: TemplateDefinition = {
  id: 'exhibition-poster',
  name: 'Art exhibition poster',
  description:
    'Give an exhibition an editorial look with a replaceable artwork image, oversized title and gallery details. Personalise this A3 or US tabloid poster.',
  category: 'events',
  tags: ['art', 'exhibition', 'gallery', 'museum', 'photography', 'show', 'photo'],
  size: { a4: 'a3', letter: 'tabloid' },
  theme: templateTheme('mono', 'elegant'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.text('FORM\n& FEELING', k.box(7, 5, 86, 24), {
            font: '$heading',
            size: s(12),
            lineHeight: 1.05,
            align: 'start',
            placeholder: true,
          }),
          k.graphic('photo-placeholder', k.box(7, 34, 55, 45), {
            name: 'Exhibition artwork',
            alt: 'Replace with exhibition artwork',
            placeholder: true,
          }),
          k.text('01—28\nOCT', k.box(68, 34, 25, 13), {
            size: s(5),
            weight: 700,
            lineHeight: 1.15,
            align: 'start',
            placeholder: true,
          }),
          k.line({ x: k.x(68), y: k.y(51), w: k.x(25), h: s(0.3) }, '$primary'),
          k.text('A new\nperspective\non everyday\nobjects.', k.box(68, 55, 25, 15), {
            size: s(3.2),
            lineHeight: 1.5,
            align: 'start',
            valign: 'top',
            color: '$muted',
            placeholder: true,
          }),
          k.text('Gallery North', k.box(7, 84, 86, 5), {
            size: s(4),
            weight: 700,
            align: 'start',
            placeholder: true,
          }),
          k.text('12 Art Lane · Tue – Sun, 10 am – 6 pm · Free admission', k.box(7, 91, 86, 4), {
            size: s(2.8),
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const movieNight: TemplateDefinition = {
  id: 'movie-night',
  name: 'Outdoor movie night poster',
  description:
    'Set the scene for a film night with a cinema-style frame, editable film title and screening details. Customise this A4 or US Letter poster for your venue.',
  category: 'events',
  tags: ['movie', 'cinema', 'film', 'screening', 'outdoor', 'community', 'night'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('midnight', 'poster'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.icon('moon', { x: k.x(43), y: k.y(6), w: s(14), h: s(14) }, '$primary'),
          k.text('UNDER THE STARS', k.box(8, 19, 84, 5), {
            size: s(3.4),
            spacing: 0.15,
            weight: 700,
            color: '$primary',
          }),
          k.text('MOVIE NIGHT', k.box(8, 26, 84, 12), {
            font: '$heading',
            size: s(13.5),
            lineHeight: 1,
            placeholder: true,
          }),
          k.rect(k.box(6, 43, 88, 27), '$surface'),
          ...Array.from({ length: 9 }, (_, i) => [
            k.rect(k.box(9 + i * 9.5, 44.5, 5, 2), '$primary'),
            k.rect(k.box(9 + i * 9.5, 66.5, 5, 2), '$primary'),
          ]).flat(),
          k.text('YOUR FILM TITLE', k.box(12, 49, 76, 9), {
            font: '$heading',
            size: s(7),
            lineHeight: 1.1,
            placeholder: true,
          }),
          k.text('An evening worth sharing', k.box(12, 59, 76, 4), {
            size: s(3.2),
            color: '$muted',
            placeholder: true,
          }),
          k.text('16 AUGUST · DOORS 7 PM', k.box(8, 76, 84, 6), {
            size: s(4.2),
            weight: 700,
            placeholder: true,
          }),
          k.text(
            'Community garden · Bring a blanket\nDetails & bookings: example.com/movie',
            k.box(8, 85, 84, 9),
            { size: s(3.2), lineHeight: 1.5, color: '$muted', placeholder: true },
          ),
        ],
      },
    ];
  },
};

export const meetupFlyer: TemplateDefinition = {
  id: 'meetup-flyer',
  name: 'Creative meetup flyer',
  description:
    'Share a relaxed meetup with a modern headline, short agenda and RSVP details. An A5 or half-letter flyer for clubs, makers and professional communities.',
  category: 'events',
  tags: ['meetup', 'networking', 'creative', 'club', 'community', 'talk', 'agenda'],
  size: { a4: 'a5', letter: 'half-letter' },
  theme: templateTheme('violet', 'tech'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 100, 46), '$primary'),
          k.text('GOOD PEOPLE. FRESH IDEAS.', k.box(8, 7, 84, 5), {
            size: s(3),
            weight: 600,
            align: 'start',
            color: '$background',
          }),
          k.text('Let’s\nconnect.', k.box(8, 16, 84, 23), {
            font: '$heading',
            size: s(15),
            weight: 700,
            lineHeight: 1.05,
            align: 'start',
            color: '$background',
            placeholder: true,
          }),
          ...[
            ['18:00', 'Hello & refreshments'],
            ['18:30', 'Ideas worth sharing'],
            ['19:15', 'Meet someone new'],
          ].flatMap(([time, activity], i) => [
            k.text(time ?? '', k.box(8, 51 + i * 8, 18, 6), {
              size: s(3.3),
              weight: 700,
              align: 'start',
              color: '$primary',
              placeholder: true,
            }),
            k.text(activity ?? '', k.box(29, 51 + i * 8, 63, 6), {
              size: s(3.6),
              align: 'start',
              placeholder: true,
            }),
          ]),
          k.line({ x: k.x(8), y: k.y(78), w: k.x(84), h: s(0.25) }, '$primary'),
          k.text('6 NOVEMBER · THE MAKER SPACE', k.box(8, 82, 84, 5), {
            size: s(3.1),
            weight: 700,
            align: 'start',
            placeholder: true,
          }),
          k.text('Save your spot: example.com/meet', k.box(8, 89, 84, 5), {
            size: s(3.3),
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const eventTicket: TemplateDefinition = {
  id: 'event-ticket',
  name: 'Event admission ticket',
  description:
    'Design an event ticket with an editable number, date, venue and information QR code. A landscape A6 or 4 × 6 inch keepsake for shows and community events.',
  category: 'events',
  tags: ['ticket', 'admission', 'pass', 'concert', 'show', 'event', 'qr'],
  size: { a4: 'postcard-a6', letter: 'postcard-4x6' },
  theme: templateTheme('noir', 'headline'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const qr = s(24);
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 3, 100), '$primary'),
          k.text('ADMIT ONE', k.box(8, 9, 59, 10), {
            size: s(4.4),
            weight: 700,
            spacing: 0.2,
            align: 'start',
            color: '$primary',
          }),
          k.text('LIVE AT\nTHE GARDEN', k.box(8, 24, 59, 32), {
            font: '$heading',
            size: s(10),
            lineHeight: 1.05,
            align: 'start',
            placeholder: true,
          }),
          k.text('12 JULY · 6 PM\nRiverside Garden, Main Stage', k.box(8, 66, 59, 19), {
            size: s(3.6),
            lineHeight: 1.5,
            align: 'start',
            placeholder: true,
          }),
          ...Array.from({ length: 12 }, (_, i) => k.rect(k.box(72, 5 + i * 8, 0.3, 4), '$muted')),
          k.text('No. 001', k.box(76, 11, 21, 9), {
            size: s(4.1),
            weight: 700,
            color: '$primary',
            placeholder: true,
          }),
          k.qr(
            'https://example.com/event',
            { x: k.x(86.5) - qr / 2, y: k.y(35), w: qr, h: qr },
            { placeholder: true },
          ),
          k.text('EVENT\nDETAILS', k.box(76, 68, 21, 15), {
            size: s(3.1),
            lineHeight: 1.3,
            color: '$muted',
          }),
        ],
      },
    ];
  },
};

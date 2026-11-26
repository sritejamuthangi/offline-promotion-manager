import type { IconName } from '@/core/schema';
import type { TemplateDefinition } from '@/core/templates';
import { createKit, libraryFill, softShadow, solidFill, templateTheme } from './kit';

export const saleFlyer: TemplateDefinition = {
  id: 'sale-flyer',
  name: 'Big sale flyer',
  description:
    'Promote a shop sale with bold headlines, a discount badge and space for your opening hours. Customise every detail in A5 or half-letter size.',
  category: 'business',
  tags: ['sale', 'discount', 'offer', 'shop', 'store', 'retail', 'promotion', 'deal'],
  size: { a4: 'a5', letter: 'half-letter' },
  theme: templateTheme('candy', 'heavy'),
  build: (page) => {
    const k = createKit(page);
    const { W, s } = k;
    const burst = s(46);
    const bx = (W - burst) / 2;
    const by = k.y(45);
    return [
      {
        background: libraryFill('sunburst'),
        elements: [
          k.text('WEEKEND ONLY', k.box(8, 6, 84, 5), {
            size: s(4.6),
            weight: 800,
            spacing: 0.25,
            lineHeight: 1.1,
            color: '$background',
          }),
          k.text('BIG\nSALE', k.box(8, 11, 84, 34), {
            font: '$heading',
            size: s(24),
            lineHeight: 0.95,
            color: '$background',
            placeholder: true,
          }),
          k.sticker('burst', { x: bx, y: by, w: burst, h: burst }, '$background', {
            rotation: -8,
            shadow: softShadow(s(1)),
          }),
          k.text(
            'UP TO',
            { x: bx, y: by + burst * 0.22, w: burst, h: burst * 0.12 },
            {
              size: s(4),
              weight: 800,
              spacing: 0.15,
              lineHeight: 1.1,
              color: '$primary',
            },
          ),
          k.text(
            '50%',
            { x: bx, y: by + burst * 0.33, w: burst, h: burst * 0.32 },
            {
              font: '$heading',
              size: s(12),
              lineHeight: 1,
              color: '$primary',
              placeholder: true,
            },
          ),
          k.text(
            'OFF',
            { x: bx, y: by + burst * 0.63, w: burst, h: burst * 0.14 },
            {
              font: '$heading',
              size: s(5.5),
              lineHeight: 1.1,
              color: '$primary',
            },
          ),
          k.text('On everything in store', k.box(8, 79, 84, 6), {
            size: s(4.6),
            weight: 700,
            lineHeight: 1.1,
            color: '$background',
          }),
          k.text('Fri – Sun · 10 am – 8 pm\n12 Market Street · example.com', k.box(8, 86, 84, 9), {
            size: s(3.2),
            lineHeight: 1.4,
            color: '$background',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const businessCard: TemplateDefinition = {
  id: 'business-card',
  name: 'Modern business card',
  description:
    'Introduce yourself with a clean business card, contact details and a website QR code. Available in international and US business-card sizes.',
  category: 'business',
  tags: ['contact', 'card', 'professional', 'networking', 'company', 'visiting card'],
  size: { a4: 'business-card-intl', letter: 'business-card-us' },
  theme: templateTheme('sky', 'modern'),
  build: (page) => {
    const k = createKit(page);
    const { W, H, s } = k;
    const band = k.x(34);
    const qr = s(34);
    const left = k.x(40);
    const icon = s(6.5);
    const contacts: [IconName, string][] = [
      ['phone', '+1 555 0100'],
      ['mail', 'alex@example.com'],
      ['globe', 'example.com'],
    ];
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect({ x: 0, y: 0, w: band, h: H }, '$primary'),
          k.text(
            'Bright\nStudio',
            { x: s(4), y: s(8), w: band - s(8), h: s(30) },
            {
              font: '$heading',
              size: s(10),
              weight: 800,
              lineHeight: 1.05,
              color: '$background',
              placeholder: true,
            },
          ),
          k.qr(
            'https://example.com',
            { x: (band - qr) / 2, y: H - qr - s(8), w: qr, h: qr },
            {
              margin: 1,
              placeholder: true,
            },
          ),
          k.text(
            'Alex Morgan',
            { x: left, y: k.y(11), w: W - left - s(6), h: k.y(15) },
            {
              font: '$heading',
              size: s(10.5),
              weight: 700,
              lineHeight: 1.1,
              align: 'start',
              placeholder: true,
            },
          ),
          k.text(
            'Creative Director',
            { x: left, y: k.y(26), w: W - left - s(6), h: k.y(10) },
            {
              size: s(6),
              weight: 600,
              lineHeight: 1.1,
              align: 'start',
              color: '$primary',
              placeholder: true,
            },
          ),
          k.line({ x: left, y: k.y(40), w: k.x(14), h: s(1) }, '$accent'),
          ...contacts.flatMap(([name, label], i) => {
            const top = k.y(48 + i * 14);
            return [
              k.icon(name, { x: left, y: top, w: icon, h: icon }, '$primary'),
              k.text(
                label,
                {
                  x: left + icon + s(3),
                  y: top - s(1.5),
                  w: W - left - icon - s(9),
                  h: icon + s(3),
                },
                { size: s(5.4), align: 'start', color: '$muted', placeholder: true },
              ),
            ];
          }),
        ],
      },
    ];
  },
};

export const hiringPoster: TemplateDefinition = {
  id: 'hiring-poster',
  name: 'We’re hiring poster',
  description:
    'Advertise job openings with an editable Smart Grid of roles, application details and a QR code. Start with A3 or US tabloid paper.',
  category: 'business',
  tags: ['jobs', 'careers', 'recruitment', 'vacancy', 'team', 'work', 'roles', 'openings'],
  size: { a4: 'a3', letter: 'tabloid' },
  theme: templateTheme('ocean', 'modern'),
  build: (page) => {
    const k = createKit(page);
    const { W, s } = k;
    const qr = s(15);
    return [
      {
        background: libraryFill('dots'),
        elements: [
          k.text('JOIN OUR TEAM', k.box(10, 8, 80, 4.5), {
            size: s(3.4),
            weight: 700,
            spacing: 0.3,
            lineHeight: 1.1,
            color: '$secondary',
          }),
          k.text('We’re hiring!', k.box(8, 12.5, 84, 20), {
            font: '$heading',
            size: s(12.5),
            weight: 800,
            lineHeight: 1.05,
            color: '$primary',
            placeholder: true,
          }),
          k.text(
            'Help us build something great. We’re looking for kind, curious people to join us.',
            k.box(14, 33, 72, 8),
            { size: s(3.5), lineHeight: 1.4, color: '$muted', placeholder: true },
          ),
          k.grid(
            [
              ['Designer', 'Full time'],
              ['Developer', 'Full time'],
              ['Sales lead', 'Part time'],
              ['Support', 'Remote'],
              ['Marketing', 'Hybrid'],
            ],
            k.box(8, 43, 84, 36),
            {
              gap: s(2),
              padding: s(2),
              cardPadding: s(1.4),
              cardRadius: s(2),
              logoHeight: s(4.6),
              nameStyle: {
                fontFamily: '$heading',
                fontSize: s(2.9),
                fontWeight: 700,
                color: '$text',
              },
              subtitleStyle: {
                fontFamily: '$body',
                fontSize: s(2.3),
                fontWeight: 400,
                color: '$muted',
              },
              shadow: softShadow(s(0.6)),
              placeholder: true,
            },
          ),
          k.text('Apply today', k.box(8, 81, 56, 6), {
            font: '$heading',
            size: s(5.5),
            weight: 800,
            lineHeight: 1.1,
            align: 'start',
            color: '$primary',
          }),
          k.text(
            'Send your CV to jobs@example.com\nor scan the code to see all roles.',
            k.box(8, 87, 58, 7),
            { size: s(3.1), lineHeight: 1.4, align: 'start', valign: 'top', placeholder: true },
          ),
          k.qr(
            'https://example.com/jobs',
            { x: W - k.x(8) - qr, y: k.y(80.5), w: qr, h: qr },
            {
              placeholder: true,
            },
          ),
        ],
      },
    ];
  },
};

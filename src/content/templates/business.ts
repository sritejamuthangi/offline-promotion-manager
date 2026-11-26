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

export const grandOpening: TemplateDefinition = {
  id: 'grand-opening',
  name: 'Grand opening flyer',
  description:
    'Welcome the neighbourhood to your new shop with an opening-day flyer, festive bunting and editable shop name, address and hours. Fits A4 or US Letter.',
  category: 'business',
  tags: ['shop', 'store', 'launch', 'opening', 'retail', 'invitation'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('retro', 'poster'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: libraryFill('stripes'),
        elements: [
          k.rect(k.box(6, 4, 88, 92), '$background'),
          k.graphic('bunting', k.box(7, 5, 86, 12)),
          k.text('HELLO, NEIGHBOUR!', k.box(12, 20, 76, 5), {
            size: s(3.8),
            weight: 700,
            spacing: 0.15,
            color: '$secondary',
          }),
          k.text('GRAND\nOPENING', k.box(10, 26, 80, 27), {
            font: '$heading',
            size: s(18),
            lineHeight: 0.95,
            color: '$primary',
            placeholder: true,
          }),
          k.text('The Corner Shop', k.box(12, 55, 76, 7), {
            size: s(5.2),
            weight: 800,
            placeholder: true,
          }),
          k.rect(k.box(15, 66, 70, 10), '$primary', { radius: s(1) }),
          k.text('12 JULY · 10 AM', k.box(15, 66, 70, 10), {
            size: s(5),
            weight: 800,
            color: '$background',
            placeholder: true,
          }),
          k.text('Come for a browse. Stay for a treat.', k.box(12, 79, 76, 5), {
            size: s(3.4),
            placeholder: true,
          }),
          k.text('24 Market Lane · example.com', k.box(12, 86, 76, 5), {
            size: s(3.2),
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const servicePriceList: TemplateDefinition = {
  id: 'service-price-list',
  name: 'Salon service price list',
  description:
    'Present services and prices in a spacious salon price list with separate sections for cuts, colour and styling. Edit the currency and booking details in A4 or US Letter.',
  category: 'business',
  tags: ['salon', 'beauty', 'hair', 'barber', 'services', 'prices', 'spa'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('blush', 'editorial'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const sections = [
      {
        title: 'CUT & CARE',
        rows: [
          ['Cut & finish', '35'],
          ['Wash & treatment', '20'],
          ['Fringe trim', '10'],
        ],
      },
      {
        title: 'COLOUR & STYLE',
        rows: [
          ['Full colour', '65'],
          ['Highlights', '80'],
          ['Occasion styling', '45'],
        ],
      },
    ];
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 100, 3), '$primary'),
          k.icon('scissors', { x: k.x(44), y: k.y(7), w: s(12), h: s(12) }, '$primary', {
            strokeWidth: 1.3,
          }),
          k.text('Studio Bloom', k.box(10, 18, 80, 9), {
            font: '$heading',
            size: s(8),
            color: '$primary',
            placeholder: true,
          }),
          k.text('A LITTLE TIME FOR YOU', k.box(10, 29, 80, 5), {
            size: s(3),
            spacing: 0.2,
            color: '$muted',
          }),
          ...sections.flatMap(({ title, rows }, section) => {
            const top = 38 + section * 24;
            return [
              k.text(title, k.box(12, top, 76, 5), {
                size: s(3),
                weight: 700,
                spacing: 0.12,
                align: 'start',
                color: '$primary',
              }),
              ...rows.flatMap(([label, price], row) => [
                k.text(label ?? '', k.box(12, top + 6 + row * 5.5, 60, 5), {
                  size: s(3.4),
                  align: 'start',
                  placeholder: true,
                }),
                k.text(price ?? '', k.box(74, top + 6 + row * 5.5, 14, 5), {
                  size: s(3.4),
                  align: 'end',
                  placeholder: true,
                }),
              ]),
            ];
          }),
          k.line({ x: k.x(12), y: k.y(86), w: k.x(76), h: s(0.25) }, '$primary'),
          k.text('Prices in your currency · Book at example.com', k.box(10, 89, 80, 5), {
            size: s(2.8),
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const realEstateFlyer: TemplateDefinition = {
  id: 'real-estate-flyer',
  name: 'Property listing flyer',
  description:
    'Show a home for sale or rent with a replaceable property image, feature cards, asking price and agent contact details. An editable A4 or US Letter listing flyer.',
  category: 'business',
  tags: ['property', 'house', 'home', 'real estate', 'rent', 'sale', 'agent', 'photo'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('ocean', 'modern'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.graphic('photo-placeholder', k.box(0, 0, 100, 43), {
            name: 'Property photo',
            alt: 'Replace with your property photo',
            placeholder: true,
          }),
          k.rect(k.box(0, 36, 47, 7), '$primary'),
          k.text('FOR SALE', k.box(5, 36, 37, 7), {
            size: s(4.6),
            weight: 800,
            spacing: 0.12,
            color: '$background',
            placeholder: true,
          }),
          k.text('A place to call home', k.box(7, 47, 86, 8), {
            font: '$heading',
            size: s(6.8),
            weight: 700,
            align: 'start',
            placeholder: true,
          }),
          k.text('24 Willow Lane · Your city', k.box(7, 56, 86, 5), {
            size: s(3.5),
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
          ...['3 bedrooms', '2 bathrooms', '120 m²'].flatMap((label, index) => [
            k.rect(k.box(7 + index * 29.5, 64, 26.5, 8), '$surface', { radius: s(1) }),
            k.text(label, k.box(8 + index * 29.5, 64, 24.5, 8), {
              size: s(3.2),
              weight: 600,
              placeholder: true,
            }),
          ]),
          k.text('Asking 350,000', k.box(7, 76, 86, 7), {
            font: '$heading',
            size: s(6),
            weight: 800,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text('Add your currency · Arrange a viewing today', k.box(7, 83, 86, 4), {
            size: s(2.7),
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
          k.rect(k.box(0, 90, 100, 10), '$primary'),
          k.text('Alex Morgan · hello@example.com · 555 0100', k.box(7, 92, 86, 6), {
            size: s(3),
            color: '$background',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const loyaltyCard: TemplateDefinition = {
  id: 'loyalty-card',
  name: 'Coffee loyalty card',
  description:
    'Reward returning customers with an editable eight-stamp loyalty card. Customise the reward, shop name and terms in international or US business-card size.',
  category: 'business',
  tags: ['loyalty', 'stamp', 'reward', 'coffee', 'customer', 'card'],
  size: { a4: 'business-card-intl', letter: 'business-card-us' },
  theme: templateTheme('earth', 'clean'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const diameter = s(14);
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.text('THE DAILY CUP', k.box(7, 6, 86, 14), {
            font: '$heading',
            size: s(8),
            weight: 700,
            spacing: 0.08,
            color: '$primary',
            placeholder: true,
          }),
          k.text('Your next little treat is on us.', k.box(7, 22, 86, 10), {
            size: s(5),
            placeholder: true,
          }),
          ...Array.from({ length: 8 }, (_, i) => {
            const x = k.x(9 + (i % 4) * 23.5);
            const y = k.y(37 + Math.floor(i / 4) * 21);
            return [
              k.ellipse({ x, y, w: diameter, h: diameter }, i === 7 ? '$primary' : '$surface'),
              k.text(
                i === 7 ? '★' : `${i + 1}`,
                { x, y, w: diameter, h: diameter },
                { size: s(6), weight: 700, color: i === 7 ? '$background' : '$muted' },
              ),
            ];
          }).flat(),
          k.text('Buy 7 drinks, enjoy your 8th free.', k.box(6, 79, 88, 10), {
            size: s(5),
            weight: 700,
            placeholder: true,
          }),
          k.text('One stamp per drink · In store only', k.box(6, 90, 88, 7), {
            size: s(4.3),
            lineHeight: 1.1,
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const productFlyer: TemplateDefinition = {
  id: 'product-flyer',
  name: 'Product spotlight flyer',
  description:
    'Introduce a product with a large replaceable image, feature list and website call to action. Use this clean A5 or half-letter flyer for any small business.',
  category: 'business',
  tags: ['product', 'launch', 'catalogue', 'shop', 'handmade', 'photo', 'promotion'],
  size: { a4: 'a5', letter: 'half-letter' },
  theme: templateTheme('mint', 'clean'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.text('MADE FOR EVERYDAY', k.box(8, 5, 84, 5), {
            size: s(3.2),
            weight: 700,
            spacing: 0.15,
            color: '$primary',
          }),
          k.text('Meet your new favourite', k.box(8, 11, 84, 14), {
            font: '$heading',
            size: s(8),
            weight: 700,
            lineHeight: 1.05,
            placeholder: true,
          }),
          k.graphic('photo-placeholder', k.box(13, 28, 74, 32), {
            radius: s(3),
            name: 'Product photo',
            alt: 'Replace with your product photo',
            placeholder: true,
          }),
          k.text('The Everyday Tote', k.box(8, 63, 84, 7), {
            font: '$heading',
            size: s(6),
            weight: 700,
            color: '$primary',
            placeholder: true,
          }),
          k.text(
            'Room for everything. Ready for anywhere.\nDurable fabric · Thoughtful details',
            k.box(10, 72, 80, 10),
            { size: s(3.5), lineHeight: 1.45, color: '$muted', placeholder: true },
          ),
          k.rect(k.box(18, 86, 64, 8), '$primary', { radius: s(4) }),
          k.text('Explore at example.com', k.box(18, 86, 64, 8), {
            size: s(3.5),
            weight: 700,
            color: '$background',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

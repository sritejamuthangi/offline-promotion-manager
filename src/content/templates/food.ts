import type { DesignElement } from '@/core/schema';
import type { TemplateDefinition } from '@/core/templates';
import { createKit, libraryFill, softShadow, solidFill, templateTheme } from './kit';

const MENU: readonly (readonly [string, readonly (readonly [string, string, string])[]])[] = [
  [
    'Starters',
    [
      ['Garden bruschetta', 'Toasted bread, tomato, basil and olive oil', '9'],
      ['Soup of the day', 'Ask your server for today’s choice', '7'],
      ['Crispy halloumi', 'Honey, sesame and lemon', '10'],
    ],
  ],
  [
    'Mains',
    [
      ['Herb roast chicken', 'Roast potatoes, greens and pan juices', '19'],
      ['Wild mushroom risotto', 'Parmesan, thyme and truffle oil', '17'],
      ['Fish of the day', 'Lemon butter and seasonal vegetables', '22'],
    ],
  ],
  [
    'Desserts',
    [
      ['Chocolate torte', 'Berries and whipped cream', '8'],
      ['Lemon tart', 'Crème fraîche and mint', '8'],
      ['Ice cream', 'Three scoops, ask for today’s flavours', '7'],
    ],
  ],
];

export const restaurantMenu: TemplateDefinition = {
  id: 'restaurant-menu',
  name: 'Restaurant menu',
  description:
    'Build a restaurant menu with editable starters, mains, desserts and prices. This elegant layout fits A4 or US Letter and adapts to your brand colours.',
  category: 'food',
  tags: ['menu', 'restaurant', 'cafe', 'dinner', 'lunch', 'prices', 'dishes', 'bistro'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('terracotta', 'elegant'),
  build: (page) => {
    const k = createKit(page);
    const { W, s } = k;
    const divider = k.x(56);
    const elements: DesignElement[] = [
      k.text('The Olive Table', k.box(8, 5, 84, 7.5), {
        font: '$heading',
        size: s(8),
        weight: 700,
        lineHeight: 1.1,
        color: '$primary',
        placeholder: true,
      }),
      k.text('Seasonal kitchen & wine bar', k.box(8, 12.5, 84, 3.6), {
        size: s(2.9),
        italic: true,
        spacing: 0.04,
        lineHeight: 1.1,
        color: '$muted',
        placeholder: true,
      }),
      k.graphic('divider', { x: (W - divider) / 2, y: k.y(16.6), w: divider, h: divider * 0.08 }),
    ];
    MENU.forEach(([title, items], section) => {
      const top = 21.5 + section * 24;
      elements.push(
        k.text(title, k.box(10, top, 80, 4.4), {
          font: '$heading',
          size: s(4.2),
          weight: 700,
          spacing: 0.18,
          lineHeight: 1.15,
          transform: 'uppercase',
          align: 'start',
          color: '$primary',
        }),
      );
      items.forEach(([name, description, price], row) => {
        const rowTop = top + 4.8 + row * 6.4;
        elements.push(
          k.text(name, k.box(10, rowTop, 64, 3.3), {
            size: s(3.1),
            weight: 700,
            lineHeight: 1.2,
            align: 'start',
            placeholder: true,
          }),
          k.text(price, k.box(74, rowTop, 16, 3.3), {
            size: s(3.1),
            weight: 700,
            lineHeight: 1.2,
            align: 'end',
            color: '$primary',
            placeholder: true,
          }),
          k.text(description, k.box(10, rowTop + 3.3, 70, 2.9), {
            size: s(2.45),
            lineHeight: 1.2,
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
        );
      });
    });
    elements.push(
      k.text('Tell us about any allergies. Vegan options available.', k.box(8, 94, 84, 3.4), {
        size: s(2.3),
        lineHeight: 1.1,
        color: '$muted',
      }),
    );
    return [{ background: solidFill('$background'), elements }];
  },
};

export const cafeSpecial: TemplateDefinition = {
  id: 'cafe-special',
  name: 'Café special of the day',
  description:
    'Showcase a café special with a coffee illustration, price badge and editable description. A square social post with warm colours and playful lettering.',
  category: 'food',
  tags: ['coffee', 'cafe', 'drink', 'special', 'offer', 'instagram', 'bakery'],
  size: { a4: 'instagram-post', letter: 'instagram-post' },
  theme: templateTheme('earth', 'casual'),
  build: (page) => {
    const k = createKit(page);
    const { W, s } = k;
    const cup = s(32);
    const badge = s(17);
    const badgeX = k.x(70);
    const badgeY = k.y(30);
    return [
      {
        background: libraryFill('gingham'),
        elements: [
          k.rect(k.box(7, 7, 86, 86), '$background', {
            radius: s(4),
            shadow: softShadow(s(1)),
          }),
          k.text('Today’s special', k.box(12, 12, 76, 10), {
            font: '$heading',
            size: s(8.5),
            lineHeight: 1.1,
            color: '$secondary',
          }),
          k.graphic('coffee', { x: (W - cup) / 2, y: k.y(23), w: cup, h: cup }),
          k.sticker('badge', { x: badgeX, y: badgeY, w: badge, h: badge }, '$primary', {
            rotation: 12,
          }),
          k.text(
            '4.50',
            { x: badgeX, y: badgeY + badge * 0.3, w: badge, h: badge * 0.4 },
            {
              size: s(5),
              weight: 800,
              lineHeight: 1,
              rotation: 12,
              color: '$background',
              placeholder: true,
            },
          ),
          k.text('Caramel oat latte', k.box(10, 56, 80, 10), {
            font: '$heading',
            size: s(8),
            weight: 700,
            lineHeight: 1.1,
            color: '$primary',
            placeholder: true,
          }),
          k.text(
            'Smooth espresso, oat milk and a drizzle of homemade caramel.',
            k.box(18, 66.5, 64, 11),
            { size: s(3.6), lineHeight: 1.4, color: '$muted', placeholder: true },
          ),
          k.text('Open daily 7 am – 6 pm · example.com', k.box(10, 81, 80, 5), {
            size: s(3),
            weight: 600,
            lineHeight: 1.1,
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const bakeryMenu: TemplateDefinition = {
  id: 'bakery-menu',
  name: 'Neighbourhood bakery menu',
  description:
    'Display freshly baked favourites with an illustrated bakery menu, editable descriptions and prices. Personalise the shop name and collection details in A4 or US Letter.',
  category: 'food',
  tags: ['bakery', 'bread', 'pastry', 'cake', 'menu', 'prices', 'cafe'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('earth', 'editorial'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const items = [
      ['Sourdough loaf', 'Slow fermented, baked each morning', '6.50'],
      ['Butter croissant', 'Flaky layers, golden finish', '3.00'],
      ['Cinnamon bun', 'Soft dough with a cinnamon swirl', '3.50'],
      ['Lemon drizzle slice', 'Bright citrus, delicate glaze', '4.00'],
      ['Chocolate cookie', 'Crisp edges and a soft centre', '2.50'],
    ];
    return [
      {
        background: libraryFill('gingham'),
        elements: [
          k.rect(k.box(5, 4, 90, 92), '$background', { radius: s(2) }),
          k.icon('cake', { x: k.x(44), y: k.y(8), w: s(12), h: s(12) }, '$primary', {
            strokeWidth: 1.5,
          }),
          k.text('Little Oven', k.box(10, 19, 80, 9), {
            font: '$heading',
            size: s(8),
            color: '$primary',
            placeholder: true,
          }),
          k.text('BAKED WITH CARE, EVERY DAY', k.box(10, 29, 80, 5), {
            size: s(2.8),
            spacing: 0.1,
            color: '$muted',
          }),
          ...items.flatMap(([title, description, price], i) => [
            k.text(title ?? '', k.box(12, 39 + i * 9, 60, 4.5), {
              size: s(3.7),
              weight: 700,
              align: 'start',
              placeholder: true,
            }),
            k.text(price ?? '', k.box(74, 39 + i * 9, 14, 4.5), {
              size: s(3.5),
              weight: 700,
              align: 'end',
              color: '$primary',
              placeholder: true,
            }),
            k.text(description ?? '', k.box(12, 43.5 + i * 9, 76, 3.5), {
              size: s(2.5),
              align: 'start',
              color: '$muted',
              placeholder: true,
            }),
          ]),
          k.text('Prices in your currency · Ask us about allergens', k.box(10, 87, 80, 4), {
            size: s(2.6),
            color: '$muted',
            placeholder: true,
          }),
          k.text('Pre-order: hello@example.com', k.box(10, 91, 80, 3.5), {
            size: s(2.7),
            weight: 700,
            color: '$primary',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const foodTruckMenu: TemplateDefinition = {
  id: 'food-truck-menu',
  name: 'Street food menu',
  description:
    'Make a food truck menu with bold type, three signature dishes and a clear price for each. Edit the dishes, currency and ordering details in A4 or US Letter.',
  category: 'food',
  tags: ['street food', 'food truck', 'menu', 'takeaway', 'wrap', 'lunch', 'prices'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('sunset', 'poster'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const dishes = [
      ['THE CLASSIC', 'Grilled chicken, slaw & herb sauce', '9'],
      ['THE GREEN ONE', 'Roast vegetables, hummus & greens', '8'],
      ['THE HOT ONE', 'Spiced beans, chilli & lime', '8'],
    ];
    return [
      {
        background: solidFill('$primary'),
        elements: [
          k.text('STREET\nKITCHEN', k.box(8, 5, 84, 25), {
            font: '$heading',
            size: s(17),
            lineHeight: 0.95,
            color: '$background',
            placeholder: true,
          }),
          k.text('FRESH WRAPS. BIG FLAVOUR.', k.box(8, 32, 84, 5), {
            size: s(3.3),
            weight: 800,
            color: '$background',
          }),
          ...dishes.flatMap(([title, detail, price], i) => [
            k.rect(k.box(7, 42 + i * 15, 86, 12), '$background', { radius: s(1) }),
            k.text(title ?? '', k.box(11, 43.5 + i * 15, 64, 5.5), {
              font: '$heading',
              size: s(5.7),
              lineHeight: 1,
              align: 'start',
              placeholder: true,
            }),
            k.text(detail ?? '', k.box(11, 49 + i * 15, 64, 4), {
              size: s(2.5),
              align: 'start',
              color: '$muted',
              placeholder: true,
            }),
            k.text(price ?? '', k.box(77, 44 + i * 15, 12, 8), {
              font: '$heading',
              size: s(8),
              color: '$primary',
              placeholder: true,
            }),
          ]),
          k.text('ORDER AT THE WINDOW', k.box(8, 88, 84, 4), {
            size: s(3.1),
            weight: 800,
            color: '$background',
          }),
          k.text('Prices in your currency · Ask us about allergens', k.box(8, 93, 84, 3), {
            size: s(2.4),
            color: '$background',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const recipeCard: TemplateDefinition = {
  id: 'recipe-card',
  name: 'Everyday recipe card',
  description:
    'Keep a favourite recipe on a landscape card with ingredients, three clear steps and preparation details. Edit every word in A6 or 4 × 6 inch size.',
  category: 'food',
  tags: ['recipe', 'cooking', 'ingredients', 'kitchen', 'card', 'meal', 'food'],
  size: { a4: 'postcard-a6', letter: 'postcard-4x6' },
  theme: templateTheme('forest', 'clean'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 100, 29), '$surface'),
          k.text('Rainbow grain bowl', k.box(6, 5, 88, 13), {
            font: '$heading',
            size: s(8),
            weight: 700,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text('SERVES 2 · PREP 15 MIN · USE COOKED GRAINS', k.box(6, 20, 88, 6), {
            size: s(2.9),
            weight: 600,
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
          k.text('INGREDIENTS', k.box(6, 35, 31, 7), {
            size: s(3.2),
            weight: 800,
            spacing: 0.08,
            align: 'start',
            color: '$primary',
          }),
          k.text(
            '2 cups cooked rice\n1 cup diced vegetables\nA handful of herbs\n1 tbsp olive oil\nLemon juice to taste',
            k.box(6, 47, 31, 37),
            { size: s(3), lineHeight: 1.8, align: 'start', valign: 'top', placeholder: true },
          ),
          k.rect(k.box(41, 35, 0.2, 52), '$secondary'),
          k.text('MAKE IT', k.box(46, 35, 48, 7), {
            size: s(3.2),
            weight: 800,
            spacing: 0.08,
            align: 'start',
            color: '$primary',
          }),
          ...[
            '1. Chop the vegetables and herbs.',
            '2. Toss with rice, oil and lemon.',
            '3. Season to taste. Serve and enjoy.',
          ].map((step, i) =>
            k.text(step, k.box(46, 47 + i * 12, 48, 10), {
              size: s(3.2),
              lineHeight: 1.4,
              align: 'start',
              valign: 'top',
              placeholder: true,
            }),
          ),
          k.text('From the kitchen of: Your name', k.box(6, 91, 88, 6), {
            size: s(2.9),
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const cateringFlyer: TemplateDefinition = {
  id: 'catering-flyer',
  name: 'Catering service flyer',
  description:
    'Introduce a catering business with a replaceable food photograph, service options and enquiry details. A welcoming A5 or half-letter flyer for celebrations and office events.',
  category: 'food',
  tags: ['catering', 'buffet', 'party', 'food', 'service', 'events', 'photo'],
  size: { a4: 'a5', letter: 'half-letter' },
  theme: templateTheme('terracotta', 'elegant'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.graphic('photo-placeholder', k.box(0, 0, 100, 32), {
            name: 'Catering photo',
            alt: 'Replace with your food photography',
            placeholder: true,
          }),
          k.text('Good food.\nGreat company.', k.box(8, 37, 84, 17), {
            font: '$heading',
            size: s(8.8),
            lineHeight: 1.1,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text('Freshly prepared for your next gathering.', k.box(8, 57, 84, 6), {
            size: s(3.2),
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
          ...['Office lunches', 'Family celebrations', 'Sharing platters'].map((label, i) =>
            k.text(`0${i + 1}  /  ${label}`, k.box(8, 66 + i * 6, 84, 5), {
              size: s(3.5),
              align: 'start',
              placeholder: true,
            }),
          ),
          k.rect(k.box(0, 87, 100, 13), '$primary'),
          k.text('Let’s plan your menu\nhello@example.com · 555 0100', k.box(8, 89, 84, 9), {
            size: s(3.2),
            weight: 600,
            lineHeight: 1.5,
            color: '$background',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const drinksMenu: TemplateDefinition = {
  id: 'drinks-menu',
  name: 'Coffee and cold drinks menu',
  description:
    'Create a compact drinks menu with hot and cold sections, editable prices and a bold side panel. Personalise this A5 or half-letter café menu.',
  category: 'food',
  tags: ['drinks', 'coffee', 'tea', 'juice', 'cafe', 'menu', 'prices'],
  size: { a4: 'a5', letter: 'half-letter' },
  theme: templateTheme('earth', 'headline'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const groups = [
      {
        title: 'HOT',
        rows: [
          ['Espresso', '2.50'],
          ['Flat white', '3.50'],
          ['Cappuccino', '3.50'],
          ['Tea', '2.50'],
        ],
      },
      {
        title: 'COLD',
        rows: [
          ['Iced latte', '4.00'],
          ['Cold brew', '3.50'],
          ['Lemonade', '3.00'],
          ['Fresh juice', '4.00'],
        ],
      },
    ];
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 34, 100), '$primary'),
          k.icon('coffee', { x: k.x(10), y: k.y(9), w: s(14), h: s(14) }, '$background', {
            strokeWidth: 1.4,
          }),
          k.text('SIP\n&\nSAVOUR', k.box(4, 29, 26, 28), {
            font: '$heading',
            size: s(6.5),
            lineHeight: 1.4,
            color: '$background',
            placeholder: true,
          }),
          k.text('YOUR\nCAFÉ', k.box(4, 77, 26, 10), {
            size: s(3.4),
            weight: 700,
            lineHeight: 1.3,
            color: '$background',
            placeholder: true,
          }),
          ...groups.flatMap(({ title, rows }, group) => {
            const top = 9 + group * 39;
            return [
              k.text(title, k.box(41, top, 52, 7), {
                font: '$heading',
                size: s(6),
                align: 'start',
                color: '$primary',
              }),
              ...rows.flatMap(([name, price], row) => [
                k.text(name ?? '', k.box(41, top + 10 + row * 6, 35, 5), {
                  size: s(3),
                  align: 'start',
                  placeholder: true,
                }),
                k.text(price ?? '', k.box(78, top + 10 + row * 6, 15, 5), {
                  size: s(3),
                  align: 'end',
                  placeholder: true,
                }),
              ]),
            ];
          }),
          k.text('Prices in your currency\nAsk about milk alternatives', k.box(41, 87, 52, 9), {
            size: s(2.5),
            lineHeight: 1.5,
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

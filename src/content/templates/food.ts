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

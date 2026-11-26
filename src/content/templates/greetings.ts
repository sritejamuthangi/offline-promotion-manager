import type { IconName } from '@/core/schema';
import type { TemplateDefinition } from '@/core/templates';
import { createKit, libraryFill, softShadow, solidFill, templateTheme } from './kit';

export const birthdayInvitation: TemplateDefinition = {
  id: 'birthday-invitation',
  name: 'Birthday party invitation',
  description:
    'Make a colourful birthday invitation with balloons, confetti and room for the date, venue and RSVP. Personalise it in A5 or 5 × 7 inch size.',
  category: 'greetings',
  tags: ['birthday', 'party', 'invite', 'kids', 'celebration', 'balloons'],
  size: { a4: 'a5', letter: 'card-5x7' },
  theme: templateTheme('candy', 'playful'),
  build: (page) => {
    const k = createKit(page);
    const { W, s } = k;
    const balloon = k.x(30);
    const card = k.box(9, 30, 82, 59);
    const icon = s(5);
    const rows: [IconName, string][] = [
      ['calendar', 'Saturday 12 July, 3 pm'],
      ['map-pin', '12 Garden Lane'],
      ['phone', 'RSVP to Sam · 555 0100'],
    ];
    return [
      {
        background: libraryFill('confetti'),
        elements: [
          k.graphic('balloons', { x: k.x(5), y: k.y(3), w: balloon, h: balloon / 0.75 }),
          k.graphic(
            'balloons',
            { x: W - k.x(5) - balloon, y: k.y(3), w: balloon, h: balloon / 0.75 },
            { flipX: true },
          ),
          k.rect(card, '$background', { radius: s(4), opacity: 0.95, shadow: softShadow(s(1)) }),
          k.text(
            'YOU’RE INVITED',
            { x: card.x, y: card.y + s(5), w: card.w, h: s(6) },
            {
              size: s(3.8),
              weight: 800,
              spacing: 0.18,
              lineHeight: 1.1,
              color: '$secondary',
            },
          ),
          k.text(
            'Maya’s 7th\nBirthday!',
            { x: card.x + s(4), y: card.y + s(12), w: card.w - s(8), h: s(30) },
            {
              font: '$heading',
              size: s(10.5),
              lineHeight: 1.2,
              color: '$primary',
              placeholder: true,
            },
          ),
          ...rows.flatMap(([name, label], i) => {
            const top = card.y + s(45 + i * 9);
            return [
              k.icon(name, { x: card.x + s(7), y: top, w: icon, h: icon }, '$secondary'),
              k.text(
                label,
                {
                  x: card.x + s(10) + icon,
                  y: top - s(1.5),
                  w: card.w - s(17) - icon,
                  h: icon + s(3),
                },
                { size: s(3.6), weight: 600, align: 'start', placeholder: true },
              ),
            ];
          }),
          k.text(
            'Can’t wait to celebrate with you!',
            { x: card.x, y: card.y + card.h - s(11), w: card.w, h: s(7) },
            { size: s(3.4), italic: true, color: '$muted' },
          ),
        ],
      },
    ];
  },
};

export const thankYouCard: TemplateDefinition = {
  id: 'thank-you-card',
  name: 'Thank you card',
  description:
    'Send a personal thank-you with floral artwork, handwritten-style lettering and your own message. Choose A6 or 4 × 6 inch postcard proportions.',
  category: 'greetings',
  tags: ['thanks', 'gratitude', 'note', 'postcard', 'wedding', 'flowers'],
  size: { a4: 'postcard-a6', letter: 'postcard-4x6' },
  theme: templateTheme('blush', 'graceful'),
  build: (page) => {
    const k = createKit(page);
    const { H, s } = k;
    const flower = s(78);
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.graphic('flower', { x: -flower * 0.3, y: (H - flower) / 2, w: flower, h: flower }),
          k.graphic(
            'flower',
            { x: k.x(30), y: k.y(72), w: s(18), h: s(18) },
            { opacity: 0.55, rotation: 20 },
          ),
          k.text('Thank you', k.box(40, 15, 54, 30), {
            font: '$heading',
            size: s(17),
            lineHeight: 1.1,
            color: '$primary',
            placeholder: true,
          }),
          k.text(
            'Your kindness means the world to us. We are so grateful.',
            k.box(42, 47, 50, 24),
            { size: s(4.6), lineHeight: 1.45, placeholder: true },
          ),
          k.text('— Sam & Alex', k.box(42, 74, 50, 9), {
            size: s(4.6),
            italic: true,
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

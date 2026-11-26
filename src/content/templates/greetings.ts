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

export const weddingInvitation: TemplateDefinition = {
  id: 'wedding-invitation',
  name: 'Botanical wedding invitation',
  description:
    'Invite loved ones with botanical artwork, elegant names and editable ceremony and RSVP details. Available in A5 or 5 × 7 inch invitation size.',
  category: 'greetings',
  tags: ['wedding', 'invitation', 'marriage', 'botanical', 'ceremony', 'rsvp'],
  size: { a4: 'a5', letter: 'card-5x7' },
  theme: templateTheme('forest', 'formal'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.graphic('leaves', k.box(4, 3, 40, 17), { rotation: 15 }),
          k.graphic('leaves', k.box(56, 80, 40, 17), { rotation: 195 }),
          k.text('TOGETHER WITH THEIR FAMILIES', k.box(12, 22, 76, 5), {
            size: s(2.6),
            spacing: 0.12,
            color: '$muted',
          }),
          k.text('Alex & Sam', k.box(9, 31, 82, 16), {
            font: '$heading',
            size: s(14),
            lineHeight: 1.2,
            color: '$primary',
            placeholder: true,
          }),
          k.text('invite you to celebrate their wedding', k.box(12, 49, 76, 5), {
            size: s(3.2),
            italic: true,
          }),
          k.graphic('divider', k.box(25, 57, 50, 3)),
          k.text('21 JUNE · 3 PM', k.box(12, 64, 76, 6), {
            size: s(4),
            weight: 700,
            spacing: 0.1,
            placeholder: true,
          }),
          k.text('The Glasshouse\n12 Garden Lane, Your city', k.box(12, 72, 76, 10), {
            size: s(3.4),
            lineHeight: 1.5,
            placeholder: true,
          }),
          k.text('Kindly RSVP by 1 May\nhello@example.com', k.box(12, 85, 58, 8), {
            size: s(2.8),
            lineHeight: 1.5,
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const babyShower: TemplateDefinition = {
  id: 'baby-shower',
  name: 'Baby shower invitation',
  description:
    'Celebrate a little arrival with a moon-and-cloud invitation, soft colours and editable party details. Personalise this A5 or 5 × 7 inch card.',
  category: 'greetings',
  tags: ['baby', 'shower', 'invitation', 'family', 'celebration', 'moon', 'cloud'],
  size: { a4: 'a5', letter: 'card-5x7' },
  theme: templateTheme('lavender', 'graceful'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: libraryFill('dots'),
        elements: [
          k.rect(k.box(7, 5, 86, 90), '$background', { radius: s(12) }),
          k.icon('moon', { x: k.x(41), y: k.y(10), w: s(18), h: s(18) }, '$primary', {
            strokeWidth: 1.5,
          }),
          k.sticker('cloud', k.box(51, 20, 22, 9), '$surface'),
          k.graphic('sparkles', k.box(21, 16, 16, 10)),
          k.text('Oh, baby!', k.box(12, 33, 76, 14), {
            font: '$heading',
            size: s(15),
            lineHeight: 1.1,
            color: '$primary',
            placeholder: true,
          }),
          k.text('A LITTLE ONE IS ON THE WAY', k.box(12, 50, 76, 5), {
            size: s(2.7),
            weight: 700,
            spacing: 0.12,
          }),
          k.text('Join us to celebrate Taylor', k.box(12, 59, 76, 6), {
            size: s(3.5),
            placeholder: true,
          }),
          k.text('8 AUGUST · 2 PM\n24 Willow Lane', k.box(12, 69, 76, 11), {
            size: s(4),
            weight: 600,
            lineHeight: 1.5,
            placeholder: true,
          }),
          k.text('RSVP: hello@example.com', k.box(12, 85, 76, 5), {
            size: s(3),
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const congratulationsCard: TemplateDefinition = {
  id: 'congratulations-card',
  name: 'Graduation congratulations card',
  description:
    'Celebrate a graduate with a cap illustration, bold congratulations and your own message. Edit this landscape A6 or 4 × 6 inch card.',
  category: 'greetings',
  tags: ['graduation', 'congratulations', 'graduate', 'achievement', 'celebration', 'card'],
  size: { a4: 'postcard-a6', letter: 'postcard-4x6' },
  theme: templateTheme('royal', 'modern'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 35, 100), '$surface'),
          k.graphic('graduation-cap', k.box(3, 25, 30, 37)),
          k.graphic('sparkles', k.box(14, 67, 12, 15)),
          k.text('YOU DID IT!', k.box(41, 14, 53, 17), {
            font: '$heading',
            size: s(9),
            weight: 800,
            lineHeight: 1.1,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text('Congratulations, Jordan', k.box(41, 35, 53, 15), {
            size: s(4.6),
            weight: 700,
            align: 'start',
            placeholder: true,
          }),
          k.text(
            'Here’s to everything you’ve learned,\nand all the adventures ahead.',
            k.box(41, 53, 53, 21),
            { size: s(3.7), lineHeight: 1.45, align: 'start', color: '$muted', placeholder: true },
          ),
          k.text('With love, Alex', k.box(41, 80, 53, 8), {
            size: s(3.8),
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const holidayCard: TemplateDefinition = {
  id: 'holiday-card',
  name: 'Warm wishes holiday card',
  description:
    'Share seasonal wishes with a geometric evergreen tree and a personal message. A square holiday card with editable colours, greeting and sender name.',
  category: 'greetings',
  tags: ['holiday', 'seasonal', 'winter', 'new year', 'christmas', 'wishes', 'card'],
  size: { a4: 'card-square', letter: 'card-square' },
  theme: templateTheme('evergreen', 'elegant'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.sticker('star', { x: k.x(46), y: k.y(8), w: s(8), h: s(8) }, '$secondary'),
          k.shape('triangle', k.box(40, 18, 20, 15), '$primary'),
          k.shape('triangle', k.box(35, 27, 30, 18), '$primary'),
          k.shape('triangle', k.box(30, 36, 40, 20), '$primary'),
          k.rect(k.box(48, 53, 4, 7), '$secondary'),
          k.text('Warm wishes', k.box(8, 65, 84, 12), {
            font: '$heading',
            size: s(8.8),
            lineHeight: 1.1,
            placeholder: true,
          }),
          k.text('May your season be full of little joys.', k.box(10, 80, 80, 5), {
            size: s(3),
            color: '$muted',
            placeholder: true,
          }),
          k.text('With love, the Morgan family', k.box(10, 88, 80, 5), {
            size: s(3),
            color: '$primary',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const anniversaryCard: TemplateDefinition = {
  id: 'anniversary-card',
  name: 'Anniversary celebration invitation',
  description:
    'Mark a milestone with an elegant anniversary number, names and celebration details. Personalise the years and message in A5 or 5 × 7 inch size.',
  category: 'greetings',
  tags: ['anniversary', 'milestone', 'celebration', 'invitation', 'couple', 'party'],
  size: { a4: 'a5', letter: 'card-5x7' },
  theme: templateTheme('blush', 'elegant'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.text('A DECADE OF US', k.box(10, 8, 80, 5), {
            size: s(3.2),
            weight: 600,
            spacing: 0.18,
            color: '$primary',
            placeholder: true,
          }),
          k.text('10', k.box(10, 19, 80, 25), {
            font: '$heading',
            size: s(31),
            lineHeight: 1,
            color: '$primary',
            placeholder: true,
          }),
          k.text('wonderful years', k.box(10, 47, 80, 7), {
            font: '$heading',
            size: s(5.8),
            italic: true,
          }),
          k.text('Sam & Alex', k.box(10, 59, 80, 8), {
            font: '$heading',
            size: s(6.5),
            placeholder: true,
          }),
          k.text(
            'Join us for dinner and memories\n12 SEPTEMBER · 6 PM\nThe Garden Room, 24 Park Lane',
            k.box(14, 71, 72, 15),
            { size: s(3.3), lineHeight: 1.6, placeholder: true },
          ),
          k.graphic('flower', { x: k.x(-7), y: k.y(77), w: s(26), h: s(26) }, { opacity: 0.65 }),
          k.text('RSVP: hello@example.com', k.box(20, 90, 65, 5), {
            size: s(2.8),
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

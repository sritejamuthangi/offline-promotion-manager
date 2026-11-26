import type { IconName } from '@/core/schema';
import type { TemplateDefinition } from '@/core/templates';
import { createKit, libraryFill, NO_FILL, solidFill, templateTheme } from './kit';

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

export const classTimetable: TemplateDefinition = {
  id: 'class-timetable',
  name: 'Weekly class timetable',
  description:
    'Organise a school week with a five-day timetable and editable lesson blocks, times and class name. A landscape layout for A4 or US Letter.',
  category: 'education',
  tags: ['schedule', 'school', 'lessons', 'timetable', 'week', 'class', 'planner'],
  size: { a4: 'certificate-a4', letter: 'certificate-letter' },
  theme: templateTheme('sky', 'friendly'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const lessons = [
      ['Reading', 'Maths', 'Reading', 'Maths', 'Reading'],
      ['Science', 'Art', 'Music', 'Science', 'Art'],
      ['Maths', 'Writing', 'Maths', 'Writing', 'Projects'],
      ['Sport', 'History', 'Projects', 'Library', 'Class time'],
    ];
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.text('Our week', k.box(6, 6, 62, 11), {
            font: '$heading',
            size: s(8),
            weight: 800,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text('CLASS 4 · ROOM 12', k.box(65, 8, 29, 7), {
            size: s(2.8),
            weight: 700,
            align: 'end',
            color: '$muted',
            placeholder: true,
          }),
          k.rect(k.box(6, 23, 88, 10), '$primary', { radius: s(1) }),
          k.text('TIME', k.box(6, 23, 14, 10), { size: s(3), weight: 700, color: '$background' }),
          ...days.map((day, i) =>
            k.text(day, k.box(20 + i * 14.8, 23, 14.8, 10), {
              size: s(3),
              weight: 700,
              color: '$background',
            }),
          ),
          ...lessons.flatMap((row, r) => [
            k.rect(k.box(6, 35 + r * 12, 88, 11), r % 2 === 0 ? '$surface' : '$background'),
            k.text(['09:00', '10:30', '12:30', '14:00'][r] ?? '', k.box(6, 35 + r * 12, 14, 11), {
              size: s(3),
              weight: 700,
              color: '$primary',
              placeholder: true,
            }),
            ...row.map((lesson, c) =>
              k.text(lesson, k.box(21 + c * 14.8, 35 + r * 12, 12.8, 11), {
                size: s(2.9),
                placeholder: true,
              }),
            ),
          ]),
          k.text('Remember: bring a water bottle and something to read.', k.box(6, 87, 88, 7), {
            size: s(3),
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const studyPlanner: TemplateDefinition = {
  id: 'study-planner',
  name: 'Study session planner',
  description:
    'Plan a focused study session with priorities, a time-block schedule and reflection space. Edit the prompts and subject on A4 or US Letter.',
  category: 'education',
  tags: ['study', 'planner', 'revision', 'exam', 'homework', 'goals', 'worksheet'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('lavender', 'clean'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 100, 22), '$surface'),
          k.text('Make room to learn', k.box(8, 5, 84, 9), {
            font: '$heading',
            size: s(7.5),
            weight: 700,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text('SUBJECT: Your subject     DATE: Day / Month', k.box(8, 15, 84, 5), {
            size: s(3.1),
            align: 'start',
            placeholder: true,
          }),
          k.text('01 / TODAY’S PRIORITIES', k.box(8, 27, 84, 5), {
            size: s(3.3),
            weight: 700,
            align: 'start',
            color: '$primary',
          }),
          ...[0, 1, 2].flatMap((i) => [
            k.rect({ x: k.x(8), y: k.y(35 + i * 6), w: s(3), h: s(3) }, NO_FILL, {
              stroke: { color: '$muted', width: s(0.2) },
            }),
            k.line({ x: k.x(14), y: k.y(37 + i * 6), w: k.x(78), h: s(0.15) }, '$muted'),
          ]),
          k.text('02 / FOCUS BLOCKS', k.box(8, 55, 84, 5), {
            size: s(3.3),
            weight: 700,
            align: 'start',
            color: '$primary',
          }),
          ...[
            ['25 min', 'Read & take notes'],
            ['5 min', 'Take a break'],
            ['25 min', 'Practise & recall'],
          ].flatMap(([time, task], i) => [
            k.rect(k.box(8, 62 + i * 6, 20, 5), '$surface'),
            k.text(time ?? '', k.box(8, 62 + i * 6, 20, 5), {
              size: s(3),
              weight: 700,
              placeholder: true,
            }),
            k.text(task ?? '', k.box(32, 62 + i * 6, 60, 5), {
              size: s(3.3),
              align: 'start',
              placeholder: true,
            }),
          ]),
          k.text('03 / ONE THING I LEARNED', k.box(8, 83, 84, 5), {
            size: s(3.3),
            weight: 700,
            align: 'start',
            color: '$primary',
          }),
          k.line({ x: k.x(8), y: k.y(93), w: k.x(84), h: s(0.15) }, '$muted'),
        ],
      },
    ];
  },
};

export const readingChallenge: TemplateDefinition = {
  id: 'reading-challenge',
  name: 'Reading challenge tracker',
  description:
    'Celebrate twelve books with an illustrated reading tracker and spaces for book titles. Personalise the reader name and goal in A4 or US Letter.',
  category: 'education',
  tags: ['reading', 'books', 'library', 'challenge', 'tracker', 'children', 'school'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('citrus', 'friendly'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.text('A world of stories', k.box(8, 5, 84, 9), {
            font: '$heading',
            size: s(8),
            weight: 800,
            color: '$primary',
            placeholder: true,
          }),
          k.text('12 BOOKS · ENDLESS ADVENTURES', k.box(8, 16, 84, 5), {
            size: s(3.2),
            weight: 700,
            spacing: 0.08,
          }),
          k.text('Reader: Your name', k.box(8, 24, 84, 5), {
            size: s(3.4),
            color: '$muted',
            placeholder: true,
          }),
          ...Array.from({ length: 12 }, (_, i) => {
            const x = 8 + (i % 3) * 29;
            const y = 33 + Math.floor(i / 3) * 14;
            return [
              k.rect(k.box(x, y, 26, 12), '$surface', { radius: s(1.5) }),
              k.icon('book-open', { x: k.x(x + 3), y: k.y(y + 2), w: s(6), h: s(6) }, '$primary'),
              k.text(`${i + 1}`.padStart(2, '0'), k.box(x + 16, y + 1, 7, 5), {
                size: s(3.4),
                weight: 800,
                color: '$primary',
              }),
              k.line({ x: k.x(x + 3), y: k.y(y + 10), w: k.x(20), h: s(0.2) }, '$muted'),
            ];
          }).flat(),
          k.text(
            'Colour a book when you finish. Write its title on the line.',
            k.box(8, 92, 84, 4),
            { size: s(2.8), color: '$muted' },
          ),
        ],
      },
    ];
  },
};

export const scienceFair: TemplateDefinition = {
  id: 'science-fair',
  name: 'Science fair poster',
  description:
    'Spark curiosity with a science fair poster featuring experiment themes, event details and a bold rocket illustration. Edit for your school in A3 or US tabloid.',
  category: 'education',
  tags: ['science', 'fair', 'school', 'stem', 'experiment', 'exhibition', 'students'],
  size: { a4: 'a3', letter: 'tabloid' },
  theme: templateTheme('neon', 'tech'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: libraryFill('grid-paper'),
        elements: [
          k.text('BIG IDEAS START HERE', k.box(8, 7, 84, 5), {
            size: s(3.2),
            weight: 700,
            spacing: 0.15,
            color: '$primary',
          }),
          k.text('SCIENCE\nFAIR', k.box(8, 15, 84, 25), {
            font: '$heading',
            size: s(15),
            weight: 700,
            lineHeight: 1.05,
            placeholder: true,
          }),
          k.icon('rocket', { x: k.x(39), y: k.y(43), w: s(22), h: s(22) }, '$primary', {
            strokeWidth: 1.3,
          }),
          k.graphic('sparkles', { x: k.x(70), y: k.y(42), w: s(13), h: s(13) }),
          k.text('Explore · Build · Discover', k.box(8, 63, 84, 6), {
            size: s(4),
            weight: 600,
            color: '$primary',
            placeholder: true,
          }),
          k.rect(k.box(8, 74, 84, 19), '$surface', { radius: s(2) }),
          k.text('18 AUGUST · 10 AM – 3 PM', k.box(12, 77, 76, 5), {
            size: s(4),
            weight: 700,
            placeholder: true,
          }),
          k.text('School hall · Families welcome\nBring your curiosity!', k.box(12, 84, 76, 7), {
            size: s(3.2),
            lineHeight: 1.35,
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const classroomRules: TemplateDefinition = {
  id: 'classroom-rules',
  name: 'Kind classroom poster',
  description:
    'Set a positive tone with five editable classroom agreements and friendly icons. Make an A4 or US Letter poster for a school, club or learning space.',
  category: 'education',
  tags: ['classroom', 'rules', 'agreements', 'kindness', 'school', 'children', 'values'],
  size: { a4: 'a4', letter: 'letter' },
  theme: templateTheme('forest', 'friendly'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const rules: [IconName, string, string][] = [
      ['heart', 'Be kind', 'Use words that help others grow.'],
      ['users', 'Listen with care', 'Make space for every voice.'],
      ['lightbulb', 'Stay curious', 'Ask questions. Try something new.'],
      ['circle-check', 'Do your best', 'Progress matters more than perfect.'],
      ['leaf', 'Care for our space', 'Leave things ready for the next person.'],
    ];
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.text('In our classroom', k.box(8, 6, 84, 10), {
            font: '$heading',
            size: s(8),
            weight: 800,
            color: '$primary',
            placeholder: true,
          }),
          k.text('WE LEARN BETTER TOGETHER', k.box(8, 18, 84, 5), {
            size: s(3.1),
            spacing: 0.12,
            color: '$muted',
          }),
          ...rules.flatMap(([icon, title, body], i) => {
            const top = 29 + i * 12;
            return [
              k.rect(k.box(8, top, 84, 10.5), '$surface', { radius: s(2) }),
              k.icon(icon, { x: k.x(12), y: k.y(top + 2), w: s(7), h: s(7) }, '$primary'),
              k.text(title, k.box(24, top + 1, 63, 4.5), {
                font: '$heading',
                size: s(4.3),
                weight: 800,
                align: 'start',
                placeholder: true,
              }),
              k.text(body, k.box(24, top + 5.5, 63, 4), {
                size: s(2.6),
                align: 'start',
                color: '$muted',
                placeholder: true,
              }),
            ];
          }),
          k.text('You belong here.', k.box(8, 91, 84, 5), {
            size: s(3.5),
            weight: 700,
            color: '$primary',
          }),
        ],
      },
    ];
  },
};

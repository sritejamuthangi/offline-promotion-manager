import type { TemplateDefinition } from '@/core/templates';
import { createKit, libraryFill, templateTheme } from './kit';

export const quotePost: TemplateDefinition = {
  id: 'quote-post',
  name: 'Quote post',
  description:
    'Share an inspiring quote with elegant typography on a soft gradient. Personalise the words, author and handle in a square social-media layout.',
  category: 'social',
  tags: ['quote', 'inspiration', 'motivation', 'instagram', 'square', 'words'],
  size: { a4: 'instagram-post', letter: 'instagram-post' },
  theme: templateTheme('midnight', 'elegant'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: libraryFill('soft-gradient'),
        elements: [
          k.icon('quote', { x: k.x(10), y: k.y(12), w: s(13), h: s(13) }, '$primary', {
            strokeWidth: 1.5,
          }),
          k.text('Small steps every day add up to big changes.', k.box(10, 30, 80, 36), {
            font: '$heading',
            size: s(7.2),
            italic: true,
            lineHeight: 1.25,
            align: 'start',
            valign: 'top',
            placeholder: true,
          }),
          k.line({ x: k.x(10), y: k.y(71), w: k.x(12), h: s(0.6) }, '$accent'),
          k.text('Your Name', k.box(10, 74, 80, 5.5), {
            size: s(4),
            weight: 600,
            lineHeight: 1.1,
            align: 'start',
            placeholder: true,
          }),
          k.text('@yourhandle', k.box(10, 79.5, 80, 5), {
            size: s(3.2),
            lineHeight: 1.1,
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const announcementStory: TemplateDefinition = {
  id: 'announcement-story',
  name: 'New collection story',
  description:
    'Announce a product launch with a bold vertical story, bright colours and a call to action. Replace the headline, description and website with your own.',
  category: 'social',
  tags: ['story', 'announcement', 'launch', 'new', 'shop', 'instagram', 'vertical'],
  size: { a4: 'story', letter: 'story' },
  theme: templateTheme('neon', 'tech'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const pill = { x: k.x(10), y: k.y(13), w: s(22), h: s(8.5) };
    const button = { x: k.x(10), y: k.y(61), w: k.x(56), h: s(13) };
    return [
      {
        background: libraryFill('wave-footer'),
        elements: [
          k.graphic('sparkles', { x: k.x(64), y: k.y(5), w: s(26), h: s(26) }),
          k.rect(pill, '$primary', { radius: pill.h / 2 }),
          k.text('NEW', pill, {
            font: '$heading',
            size: s(4.6),
            weight: 700,
            spacing: 0.12,
            lineHeight: 1.1,
            color: '$background',
          }),
          k.text('Our new\ncollection\nis here', k.box(10, 20, 80, 26), {
            font: '$heading',
            size: s(13),
            weight: 700,
            lineHeight: 1.02,
            align: 'start',
            placeholder: true,
          }),
          k.text(
            'Fresh designs, made to last. In store and online from Friday.',
            k.box(10, 47, 80, 10),
            {
              size: s(4.4),
              lineHeight: 1.4,
              align: 'start',
              valign: 'top',
              color: '$muted',
              placeholder: true,
            },
          ),
          k.rect(button, '$secondary', { radius: button.h / 2 }),
          k.text('Shop now →', button, {
            font: '$heading',
            size: s(5),
            weight: 700,
            lineHeight: 1.1,
            color: '$background',
            placeholder: true,
          }),
          k.text('example.com/new', k.box(10, 69.5, 80, 4), {
            size: s(3.8),
            weight: 600,
            lineHeight: 1.1,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

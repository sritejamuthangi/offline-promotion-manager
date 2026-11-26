import type { TemplateDefinition } from '@/core/templates';
import { createKit, libraryFill, solidFill, templateTheme } from './kit';

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

export const tutorialThumbnail: TemplateDefinition = {
  id: 'tutorial-thumbnail',
  name: 'Tutorial video thumbnail',
  description:
    'Introduce a tutorial with a bold two-line headline, replaceable image and episode label. An editable 1280 × 720 video thumbnail for any subject.',
  category: 'social',
  tags: ['youtube', 'video', 'thumbnail', 'tutorial', 'how to', 'creator', 'photo'],
  size: { a4: 'youtube-thumbnail', letter: 'youtube-thumbnail' },
  theme: templateTheme('neon', 'heavy'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.graphic('photo-placeholder', k.box(61, 0, 39, 100), {
            name: 'Video cover photo',
            alt: 'Replace with a subject or presenter photo',
            placeholder: true,
          }),
          k.rect(k.box(6, 10, 29, 11), '$primary', { radius: s(2) }),
          k.text('QUICK TUTORIAL', k.box(6, 10, 29, 11), {
            size: s(4),
            weight: 800,
            color: '$background',
            placeholder: true,
          }),
          k.text('CREATE\nBETTER', k.box(6, 31, 51, 37), {
            font: '$heading',
            size: s(14),
            lineHeight: 1.1,
            align: 'start',
            placeholder: true,
          }),
          k.text('One simple idea at a time', k.box(6, 78, 51, 10), {
            size: s(4.2),
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.rect(k.box(80, 82, 16, 12), '$background', { radius: s(1) }),
          k.text('EP. 01', k.box(80, 82, 16, 12), { size: s(4.2), weight: 700, placeholder: true }),
        ],
      },
    ];
  },
};

export const eventSocialPost: TemplateDefinition = {
  id: 'event-social-post',
  name: 'Community event social post',
  description:
    'Share a landscape event announcement with an oversized date, headline and venue details. Edit this 1200 × 630 post for social feeds and community groups.',
  category: 'social',
  tags: ['event', 'facebook', 'landscape', 'announcement', 'community', 'social', 'date'],
  size: { a4: 'facebook-post', letter: 'facebook-post' },
  theme: templateTheme('sunset', 'modern'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 34, 100), '$primary'),
          k.text('JULY', k.box(4, 14, 26, 13), {
            size: s(6),
            weight: 700,
            spacing: 0.15,
            color: '$background',
            placeholder: true,
          }),
          k.text('12', k.box(4, 30, 26, 38), {
            font: '$heading',
            size: s(30),
            weight: 800,
            lineHeight: 1,
            color: '$background',
            placeholder: true,
          }),
          k.text('SAVE THE DATE', k.box(4, 77, 26, 10), {
            size: s(3.4),
            weight: 600,
            color: '$background',
          }),
          k.text('Let’s get\ntogether.', k.box(41, 14, 52, 38), {
            font: '$heading',
            size: s(12),
            weight: 700,
            lineHeight: 1.1,
            align: 'start',
            placeholder: true,
          }),
          k.text('A neighbourhood picnic', k.box(41, 57, 52, 10), {
            size: s(4.7),
            weight: 600,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text('Riverside Park · From 12 pm\nBring something to share.', k.box(41, 73, 52, 17), {
            size: s(3.9),
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

export const testimonialPost: TemplateDefinition = {
  id: 'testimonial-post',
  name: 'Customer testimonial post',
  description:
    'Give a customer’s own words room to shine with a square quote card, attribution and business handle. Replace the sample quote and name with your approved testimonial.',
  category: 'social',
  tags: ['testimonial', 'review', 'customer', 'quote', 'business', 'instagram', 'square'],
  size: { a4: 'instagram-post', letter: 'instagram-post' },
  theme: templateTheme('berry', 'editorial'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: solidFill('$surface'),
        elements: [
          k.rect(k.box(7, 7, 86, 86), '$background', { radius: s(4) }),
          k.icon('quote', { x: k.x(14), y: k.y(15), w: s(12), h: s(12) }, '$primary', {
            strokeWidth: 1.4,
          }),
          k.text('A few kind words', k.box(32, 17, 54, 7), {
            size: s(3.4),
            weight: 600,
            align: 'end',
            color: '$muted',
          }),
          k.text(
            '“Thoughtful service and lovely details. We felt welcome from the start.”',
            k.box(14, 34, 72, 34),
            {
              font: '$heading',
              size: s(5.5),
              lineHeight: 1.4,
              align: 'start',
              valign: 'top',
              placeholder: true,
            },
          ),
          k.text('Your customer’s name', k.box(14, 74, 72, 6), {
            size: s(3.4),
            weight: 700,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text('@yourbusiness', k.box(14, 83, 72, 5), {
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

export const tipsPin: TemplateDefinition = {
  id: 'tips-pin',
  name: 'Five tips infographic pin',
  description:
    'Turn useful advice into a vertical infographic with five numbered tips and a website footer. Customise this 1000 × 1500 Pinterest pin for any topic.',
  category: 'social',
  tags: ['pinterest', 'pin', 'tips', 'infographic', 'list', 'advice', 'vertical'],
  size: { a4: 'pinterest-pin', letter: 'pinterest-pin' },
  theme: templateTheme('mint', 'clean'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    const tips = [
      ['Clear a little space', 'Keep only what you need within reach.'],
      ['Let the light in', 'Choose a comfortable, well-lit spot.'],
      ['Pick one priority', 'Give your next task your full attention.'],
      ['Make time to pause', 'Stretch, sip water and look away.'],
      ['Leave it ready', 'Set up tomorrow before you finish.'],
    ];
    return [
      {
        background: solidFill('$background'),
        elements: [
          k.rect(k.box(0, 0, 100, 28), '$primary'),
          k.text('5 ways to reset\nyour workspace', k.box(8, 6, 84, 16), {
            font: '$heading',
            size: s(8),
            weight: 700,
            lineHeight: 1.15,
            align: 'start',
            color: '$background',
            placeholder: true,
          }),
          ...tips.flatMap(([title, detail], i) => {
            const top = 33 + i * 11;
            return [
              k.ellipse({ x: k.x(8), y: k.y(top + 1), w: s(8), h: s(8) }, '$surface'),
              k.text(
                `${i + 1}`,
                { x: k.x(8), y: k.y(top + 1), w: s(8), h: s(8) },
                { size: s(4), weight: 800, color: '$primary' },
              ),
              k.text(title ?? '', k.box(21, top, 71, 4.5), {
                font: '$heading',
                size: s(4.3),
                weight: 700,
                align: 'start',
                placeholder: true,
              }),
              k.text(detail ?? '', k.box(21, top + 5, 71, 4.5), {
                size: s(2.9),
                align: 'start',
                color: '$muted',
                placeholder: true,
              }),
            ];
          }),
          k.text('More everyday ideas at example.com', k.box(8, 92, 84, 4), {
            size: s(2.8),
            weight: 600,
            color: '$primary',
            placeholder: true,
          }),
        ],
      },
    ];
  },
};

export const profileBanner: TemplateDefinition = {
  id: 'profile-banner',
  name: 'Creative profile cover',
  description:
    'Refresh a profile with a wide cover banner, replaceable portrait, tagline and handle. Customise this 851 × 315 Facebook cover for your personal or business page.',
  category: 'social',
  tags: ['profile', 'banner', 'cover', 'facebook', 'brand', 'creator', 'photo'],
  size: { a4: 'facebook-cover', letter: 'facebook-cover' },
  theme: templateTheme('violet', 'tech'),
  build: (page) => {
    const k = createKit(page);
    const { s } = k;
    return [
      {
        background: libraryFill('soft-gradient'),
        elements: [
          k.text('Make room\nfor good ideas.', k.box(7, 16, 58, 40), {
            font: '$heading',
            size: s(12),
            weight: 700,
            lineHeight: 1.1,
            align: 'start',
            color: '$primary',
            placeholder: true,
          }),
          k.text('Design · Community · Everyday inspiration', k.box(7, 65, 58, 11), {
            size: s(4),
            align: 'start',
            placeholder: true,
          }),
          k.text('@yourhandle', k.box(7, 81, 58, 8), {
            size: s(3.9),
            weight: 600,
            align: 'start',
            color: '$muted',
            placeholder: true,
          }),
          k.graphic(
            'photo-placeholder',
            { x: k.x(73), y: k.y(20), w: s(56), h: s(56) },
            {
              radius: s(28),
              name: 'Profile photo',
              alt: 'Replace with a profile photo',
              placeholder: true,
            },
          ),
        ],
      },
    ];
  },
};

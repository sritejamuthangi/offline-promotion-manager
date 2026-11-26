import type { TemplateCategory } from '@/core/templates';

/** Shared public copy for category landing pages and their search descriptions. */
export const TEMPLATE_CATEGORY_INFO = {
  business: {
    title: 'Free business templates',
    description:
      'Create business cards, sale and property flyers, price lists and loyalty cards. Customise branding, contact details and QR codes with free business templates.',
  },
  events: {
    title: 'Free event templates',
    description:
      'Promote concerts, markets, exhibitions, charity runs and meetups with editable posters, flyers and tickets. Add your date, venue and booking details.',
  },
  education: {
    title: 'Free education templates',
    description:
      'Create certificates, class timetables, study planners, reading trackers and school posters. Free editable templates for learners and educators.',
  },
  greetings: {
    title: 'Free cards and invitation templates',
    description:
      'Make birthday, wedding and baby shower invitations, thank-you cards and seasonal greetings. Personalise your message, colours and decorative artwork.',
  },
  food: {
    title: 'Free food and drink templates',
    description:
      'Create restaurant, bakery and drinks menus, recipe cards and catering flyers. Edit dishes and prices, then match the colours and fonts to your business.',
  },
  signs: {
    title: 'Free sign templates',
    description:
      'Make Wi-Fi signs, opening hours, direction arrows, reserved table cards and recycling labels. Customise clear signs for shops, offices and shared spaces.',
  },
  social: {
    title: 'Free social media templates',
    description:
      'Create quote posts, launch stories, video thumbnails, infographic pins and profile covers. Edit words, colours, fonts and images on your device.',
  },
} satisfies Record<TemplateCategory, { title: string; description: string }>;

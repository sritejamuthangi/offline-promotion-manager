import type { TemplateCategory } from '@/core/templates';

/** Shared public copy for category landing pages and their search descriptions. */
export const TEMPLATE_CATEGORY_INFO = {
  business: {
    title: 'Free business templates',
    description:
      'Create sale flyers, business cards and hiring posters. Customise your branding, contact details and QR codes with free, editable business templates.',
  },
  events: {
    title: 'Free event templates',
    description:
      'Promote concerts, festivals and community gatherings with editable event posters. Add your date, venue, colours and booking details.',
  },
  education: {
    title: 'Free education templates',
    description:
      'Celebrate achievement and share learning opportunities with editable certificates and workshop flyers for schools, courses and community groups.',
  },
  greetings: {
    title: 'Free cards and invitation templates',
    description:
      'Make birthday invitations and thoughtful thank-you cards. Personalise your message, colours and decorative artwork with free templates.',
  },
  food: {
    title: 'Free food and drink templates',
    description:
      'Create restaurant menus and café promotions. Edit dishes, prices and opening hours, then match the colours and fonts to your business.',
  },
  signs: {
    title: 'Free sign templates',
    description:
      'Make clear Wi-Fi signs and notices for shops, offices and shared spaces. Edit the message, network details and QR codes to suit your venue.',
  },
  social: {
    title: 'Free social media templates',
    description:
      'Create square quote posts and vertical launch stories. Customise your words, colours, fonts and images in a free local-first design editor.',
  },
} satisfies Record<TemplateCategory, { title: string; description: string }>;

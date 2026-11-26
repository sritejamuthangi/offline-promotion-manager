import type { TemplateDefinition } from '@/core/templates';
import { businessCard, hiringPoster, saleFlyer } from './business';
import { certificate, workshopFlyer } from './education';
import { eventPoster } from './events';
import { cafeSpecial, restaurantMenu } from './food';
import { birthdayInvitation, thankYouCard } from './greetings';
import { noticeSign, wifiSign } from './signs';
import { announcementStory, quotePost } from './social';

/**
 * Templates bundled with the app, shared by the catalogue and public-page build.
 * Adding a template: write it in the matching category file and list it here;
 * the unit and browser tests check every template automatically.
 */
export const TEMPLATES: readonly TemplateDefinition[] = [
  eventPoster,
  saleFlyer,
  certificate,
  birthdayInvitation,
  restaurantMenu,
  wifiSign,
  quotePost,
  businessCard,
  hiringPoster,
  workshopFlyer,
  thankYouCard,
  cafeSpecial,
  noticeSign,
  announcementStory,
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

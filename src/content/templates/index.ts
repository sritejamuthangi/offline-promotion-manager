import type { TemplateDefinition } from '@/core/templates';
import {
  businessCard,
  grandOpening,
  hiringPoster,
  loyaltyCard,
  productFlyer,
  realEstateFlyer,
  saleFlyer,
  servicePriceList,
} from './business';
import {
  certificate,
  classroomRules,
  classTimetable,
  readingChallenge,
  scienceFair,
  studyPlanner,
  workshopFlyer,
} from './education';
import {
  charityRun,
  communityMarket,
  eventPoster,
  eventTicket,
  exhibitionPoster,
  meetupFlyer,
  movieNight,
} from './events';
import {
  bakeryMenu,
  cafeSpecial,
  cateringFlyer,
  drinksMenu,
  foodTruckMenu,
  recipeCard,
  restaurantMenu,
} from './food';
import {
  anniversaryCard,
  babyShower,
  birthdayInvitation,
  congratulationsCard,
  holidayCard,
  thankYouCard,
  weddingInvitation,
} from './greetings';
import {
  directionalSign,
  noticeSign,
  openingHours,
  quietZone,
  recyclingSign,
  reservedSign,
  wifiSign,
} from './signs';
import {
  announcementStory,
  eventSocialPost,
  profileBanner,
  quotePost,
  testimonialPost,
  tipsPin,
  tutorialThumbnail,
} from './social';

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
  grandOpening,
  classTimetable,
  communityMarket,
  weddingInvitation,
  bakeryMenu,
  openingHours,
  tutorialThumbnail,
  servicePriceList,
  studyPlanner,
  charityRun,
  babyShower,
  foodTruckMenu,
  directionalSign,
  eventSocialPost,
  realEstateFlyer,
  readingChallenge,
  exhibitionPoster,
  congratulationsCard,
  recipeCard,
  reservedSign,
  testimonialPost,
  loyaltyCard,
  scienceFair,
  movieNight,
  holidayCard,
  cateringFlyer,
  quietZone,
  tipsPin,
  productFlyer,
  classroomRules,
  meetupFlyer,
  anniversaryCard,
  drinksMenu,
  recyclingSign,
  profileBanner,
  eventTicket,
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

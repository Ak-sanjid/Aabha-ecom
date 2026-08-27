import { pgEnum } from 'drizzle-orm/pg-core';

export const localeEnum = pgEnum('locale', ['EN', 'BN']);

export const userRoleEnum = pgEnum('user_role', ['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']);

export const authProviderEnum = pgEnum('auth_provider', [
  'PASSWORD',
  'GOOGLE',
  'FACEBOOK',
  'OTP',
  'GUEST',
]);

export const accountOriginEnum = pgEnum('account_origin', [
  'SELF_REGISTERED',
  'GUEST_CHECKOUT',
  'ADMIN_CREATED',
  'POS',
  'SOCIAL',
]);

export const addressTypeEnum = pgEnum('address_type', ['SHIPPING', 'BILLING']);

export const otpPurposeEnum = pgEnum('otp_purpose', [
  'LOGIN',
  'REGISTER',
  'PASSWORD_RESET',
  'PHONE_VERIFY',
]);

export const otpChannelEnum = pgEnum('otp_channel', ['SMS', 'WHATSAPP', 'EMAIL']);

/**
 * The two parallel category systems: the left-hand section panel shown on
 * listing pages, and the top navigation bar. They are curated independently.
 */
export const categorySystemEnum = pgEnum('category_system', ['SIDE_PANEL', 'TOP_BAR']);

/** Drives distinct, non-clashing accents for men's vs women's/makeup pages. */
export const audienceSegmentEnum = pgEnum('audience_segment', ['UNISEX', 'WOMEN', 'MEN', 'MAKEUP']);

export const menuLocationEnum = pgEnum('menu_location', [
  'HEADER_PRIMARY',
  'HEADER_SECONDARY',
  'TOP_CATEGORY_BAR',
  'SIDE_CATEGORY_PANEL',
  'MEGA_CATEGORY',
  'MEGA_BRAND',
  'FOOTER',
  'MOBILE_DRAWER',
]);

export const themeTokenTypeEnum = pgEnum('theme_token_type', [
  'COLOR',
  'FONT',
  'RADIUS',
  'SPACING',
  'SHADOW',
  'SIZE',
  'TEXT',
  'ASSET',
  'FLAG',
]);

export const publishStateEnum = pgEnum('publish_state', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const productStatusEnum = pgEnum('product_status', [
  'DRAFT',
  'ACTIVE',
  'OUT_OF_STOCK',
  'ARCHIVED',
]);

export const mediaTypeEnum = pgEnum('media_type', ['IMAGE', 'GIF', 'VIDEO']);

export const orderStatusEnum = pgEnum('order_status', [
  'PLACED',
  'PENDING_VERIFICATION',
  'CONFIRMED',
  'PACKED',
  'HANDED_TO_COURIER',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
  'ON_HOLD',
]);

export const orderChannelEnum = pgEnum('order_channel', [
  'WEBSITE',
  'FACEBOOK',
  'INSTAGRAM',
  'WHATSAPP',
  'PHONE',
  'POS',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'COD',
  'BKASH',
  'NAGAD',
  'ROCKET',
  'SSLCOMMERZ',
  'POS_CASH',
  'POS_CARD',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'UNPAID',
  'PENDING',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'FAILED',
]);

export const courierProviderEnum = pgEnum('courier_provider', [
  'PATHAO',
  'REDX',
  'STEADFAST',
  'CARRYBEE',
  'MANUAL',
]);

export const couponTypeEnum = pgEnum('coupon_type', [
  'PERCENTAGE',
  'FIXED',
  'FREE_SHIPPING',
  'BUNDLE',
]);

export const reviewSourceEnum = pgEnum('review_source', ['ONSITE', 'FACEBOOK', 'IMPORTED']);

export const marketingEventNameEnum = pgEnum('marketing_event_name', [
  'PAGE_VIEW',
  'VIEW_CONTENT',
  'ADD_TO_CART',
  'ADD_TO_WISHLIST',
  'INITIATE_CHECKOUT',
  'PURCHASE',
  'REAL_PURCHASE',
  'CANCEL_PURCHASE',
  'ORDER_ON_HOLD',
  'ORDER_RECOVERED',
  'ORDER_CONFIRMED',
  'ORDER_PROCESSING',
  'ORDER_SHIPPING',
  'ORDER_DELIVERED',
  'ORDER_COMPLETED',
  'SEARCH',
]);

export const audiencePlatformEnum = pgEnum('audience_platform', [
  'FACEBOOK_CUSTOM_AUDIENCE',
  'GOOGLE_CUSTOMER_MATCH',
]);

export const syncStatusEnum = pgEnum('sync_status', [
  'PENDING',
  'IN_PROGRESS',
  'SUCCESS',
  'FAILED',
]);

export const APP_CONFIG = {
  MESSAGE: {
    MAX_LENGTH: 2000,
    THROTTLE_MS: 1500,
  },
  FILE_UPLOAD: {
    MAX_SIZE_BYTES: 5 * 1024 * 1024,
    ALLOWED_TYPES: ['svg+xml', 'png', 'jpeg', 'jpg'],
  },
  TOKEN: {
    VERIFY_EMAIL_TTL_SECONDS: 24 * 60 * 60,
    RESET_PASSWORD_TTL_SECONDS: 60 * 60,
    REFRESH_COOKIE_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
    CSRF_COOKIE_MAX_AGE_MS: 24 * 60 * 60 * 1000,
  },
  CALENDAR: {
    EVENT_DURATION_MS: 60 * 60 * 1000,
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
  },
} as const;
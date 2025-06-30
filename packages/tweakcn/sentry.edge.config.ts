import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8f0d054ee7a9cc8d9ac2d014b5a4c8f4@o4509397809037312.ingest.us.sentry.io/4509397821030400",

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // ...

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});

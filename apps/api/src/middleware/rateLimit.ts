import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 20 : 500, // higher limit in dev/test
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many authentication requests. Please try again later."
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const whatsappRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "WhatsApp rate limit exceeded."
    }
  }
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 120,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "AI request rate limit exceeded. Please wait and try again."
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

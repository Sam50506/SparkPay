import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const limiters = {
  strict: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m") }),
  normal: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m") }),
  loose:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(50, "1 m") }),
};

export async function rateLimit(req, res, type = "normal") {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const { success } = await limiters[type].limit(ip);
    if (!success) {
      res.status(429).json({ error: "Too many requests, please slow down." });
      return false;
    }
    return true;
  } catch (e) {
    // Fail CLOSED: if Upstash is down, block the request rather than allow unlimited traffic
    console.error("Rate limit error:", e.message);
    res.status(503).json({ error: "Service temporarily unavailable, please try again shortly." });
    return false;
  }
}

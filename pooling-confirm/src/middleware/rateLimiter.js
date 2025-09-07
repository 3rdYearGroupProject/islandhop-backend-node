const logger = require('../config/logger');

/**
 * Rate limiting middleware
 * Simple in-memory rate limiter for demonstration
 * In production, use Redis-based rate limiting
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = 15 * 60 * 1000; // 15 minutes
    this.maxRequests = 100; // Max 100 requests per window
  }

  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      // Clean old entries
      this.cleanup(now);
      
      // Get or create user requests
      if (!this.requests.has(key)) {
        this.requests.set(key, []);
      }
      
      const userRequests = this.requests.get(key);
      
      // Filter requests within window
      const windowStart = now - this.windowMs;
      const recentRequests = userRequests.filter(time => time > windowStart);
      
      if (recentRequests.length >= this.maxRequests) {
        logger.warn(`Rate limit exceeded for IP: ${key}`);
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil(this.windowMs / 1000)
        });
      }
      
      // Add current request
      recentRequests.push(now);
      this.requests.set(key, recentRequests);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': this.maxRequests,
        'X-RateLimit-Remaining': this.maxRequests - recentRequests.length,
        'X-RateLimit-Reset': new Date(now + this.windowMs).toISOString()
      });
      
      next();
    };
  }
  
  cleanup(now) {
    const windowStart = now - this.windowMs;
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

module.exports = new RateLimiter();

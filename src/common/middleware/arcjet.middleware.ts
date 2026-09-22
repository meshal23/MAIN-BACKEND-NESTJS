import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ArcjetService } from '../../lib/security/arcjet.service';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class ArcjetMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ArcjetMiddleware.name);
  private rateLimitMap = new Map<string, RateLimitRecord>();
  private readonly maxRequests = 10;
  private readonly windowMs = 60 * 60 * 1000; // 1 hour

  constructor(private readonly arcjet: ArcjetService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Get client IP based on environment
    let clientIp = req.ip;

    // For testing/development: use a fixed IP to track rate limits
    // For production: use the real client IP
    if ((process.env.NODE_ENV !== 'production' || process.env.USE_TEST_IP === 'true') &&
        (clientIp === '::1' || clientIp === '127.0.0.1' || !clientIp)) {
      clientIp = '192.0.2.1'; // Test IP for localhost
      this.logger.debug('Using test IP for rate limit tracking');
    } else {
      // Production: extract real client IP from headers
      clientIp =
        clientIp ||
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        (req.headers['cf-connecting-ip'] as string) ||
        req.socket.remoteAddress ||
        '127.0.0.1';
    }

    this.logger.debug(`Request from IP: ${clientIp}, Path: ${req.path}, Env: ${process.env.NODE_ENV}`);

    // Check in-memory rate limit first
    const now = Date.now();
    const record = this.rateLimitMap.get(clientIp);

    if (record && now < record.resetTime) {
      record.count++;
      this.logger.debug(`Rate limit - IP: ${clientIp}, Count: ${record.count}/${this.maxRequests}`);

      if (record.count > this.maxRequests) {
        this.logger.warn(`Rate limit exceeded for ${clientIp}: ${record.count}/${this.maxRequests}`);
        res.status(429);
        return res.json({
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded: ${record.count}/${this.maxRequests} requests per hour`,
          reason: 'RATE_LIMITED',
        });
      }
    } else {
      // Reset the counter
      this.rateLimitMap.set(clientIp, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      this.logger.debug(`Rate limit reset for ${clientIp}`);
    }

    // Also check Arcjet remote rules
    const decision = await this.arcjet.protect(req, clientIp);
    this.logger.debug(`Arcjet decision - Denied: ${decision.isDenied()}`);

    if (decision.isDenied()) {
      this.logger.warn(`Request blocked by Arcjet from ${clientIp}`);
      res.status(429);
      return res.json({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Your request has been blocked by security rules.',
        reason: decision.reason,
      });
    }

    next();
  }
}

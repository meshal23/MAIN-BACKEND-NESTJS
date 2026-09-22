import { Injectable, Logger } from '@nestjs/common';
import arcjet, { fixedWindow } from '@arcjet/node';
import { Request } from 'express';

@Injectable()
export class ArcjetService {
  private readonly logger = new Logger(ArcjetService.name);
  private aj: ReturnType<typeof arcjet>;

  constructor() {
    // Initialize Arcjet with local rate limiting rule
    // Remote rules from Dashboard (Shield + additional rate limits) will be applied automatically
    this.aj = arcjet({
      key: process.env.ARCJET_KEY!,
      rules: [
        // Local rate limiting: 10 requests per hour per IP
        fixedWindow({
          max: 10,
          window: '1h',
          characteristics: ['ip.src'],
        }),
      ],
    });
    this.logger.log(`Arcjet initialized with key: ${process.env.ARCJET_KEY?.substring(0, 20)}...`);
    this.logger.log('Rate limit: 10 requests/hour per IP');
  }

  /**
   * Protect a request using Arcjet rules.
   * Remote rules from Dashboard take precedence.
   *
   * @param req - Express request object
   * @param ip - Client IP address
   * @returns ArcjetDecision
   */
  async protect(req: Request, ip?: string): Promise<any> {
    try {
      const clientIp = ip || req.ip || '127.0.0.1';
      this.logger.debug(`Protecting request from ${clientIp}`);

      const decision = await this.aj.protect(req, {
        ipSrc: clientIp,
      });

      this.logger.debug(`Decision: isDenied=${decision.isDenied()}, reason=${decision.reason}`);

      if (decision.isDenied()) {
        this.logger.warn(`Request DENIED from ${clientIp}: ${decision.reason}`);
      }

      return decision;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Arcjet error: ${errorMessage}`, error);
      // Return allow decision on error
      return { isDenied: () => false, reason: 'error' };
    }
  }
}

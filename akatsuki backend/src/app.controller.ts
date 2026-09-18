/**
 * ===== app.controller.ts =====
 *
 * WHAT THIS FILE DOES:
 * This is the root controller for the app. It handles the `/health` endpoint.
 *
 * IMPORTANT FUNCTIONS:
 * - healthCheck() → returns { status: "ok" }
 *   This is used to verify the server is running and reachable.
 *   Load balancers, monitoring tools, and you (during development) will call this.
 *
 * DATA FLOW:
 * 1. Browser/Postman sends GET /health
 * 2. NestJS routes it to this controller
 * 3. healthCheck() returns a simple JSON object
 * 4. No database call, no auth needed — it's a public endpoint
 *
 * WHERE TO MODIFY LATER:
 * - You could add a database connectivity check (e.g., try a simple query)
 * - You could return the app version or uptime
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check — verify the server is running' })
  @ApiResponse({ status: 200, description: 'Server is healthy' })
  healthCheck() {
    return { status: 'ok' };
  }
}

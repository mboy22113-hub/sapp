/**
 * ===== main.ts =====
 *
 * WHAT THIS FILE DOES:
 * This is the ENTRY POINT of the entire application.
 * When you run `npm run start:dev`, Node.js executes THIS file first.
 *
 * IMPORTANT FUNCTIONS:
 * - bootstrap() → creates the NestJS app, configures middleware, starts listening
 *
 * WHAT IT CONFIGURES (in order):
 * 1. Creates the NestJS application from AppModule
 * 2. Adds Helmet — sets security headers (prevents common web attacks)
 * 3. Enables CORS — allows the React frontend to call this API
 * 4. Adds global ValidationPipe — automatically validates incoming request bodies
 * 5. Sets up Swagger — generates API documentation at /api/docs
 * 6. Starts listening on the configured PORT
 *
 * WHERE TO MODIFY LATER:
 * - Change CORS origin to your production frontend URL
 * - Add global interceptors (e.g., for logging or response transformation)
 * - Add global exception filters for custom error formatting
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Create the NestJS application
  const app = await NestFactory.create(AppModule);

  // 2. Security headers — protects against clickjacking, XSS, etc.
  app.use(helmet());

  // 3. CORS — allow your React frontend to call this API
  //    In production, replace '*' with your actual frontend URL
  //    e.g., origin: 'https://safetrack.example.com'
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 4. Global validation — automatically validates request bodies using DTOs
  //    whitelist: true → strips properties that aren't in the DTO
  //    forbidNonWhitelisted: true → rejects requests with unexpected properties
  //    transform: true → automatically converts types (e.g., string "5" → number 5)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 5. Swagger API documentation
  //    After starting the server, visit http://localhost:3000/api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SafeTrack API')
    .setDescription('Safety Inspection & Compliance Platform — REST API')
    .setVersion('1.0')
    .addBearerAuth()  // Adds a "Bearer token" button in Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // 6. Start listening
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 SafeTrack API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at:   http://localhost:${port}/api/docs\n`);
}

bootstrap();

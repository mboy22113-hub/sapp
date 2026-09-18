/**
 * ===== create-upload-url.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates request to request a signed Supabase Storage upload URL.
 * Restricts files to allowed safety formats (images & PDFs) and max 10MB.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export class CreateUploadUrlDto {
  @ApiProperty({
    description: 'Original name of the evidence file',
    example: 'fire_hazard_photo.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  file_name: string;

  @ApiProperty({
    description: 'MIME content type of the file',
    example: 'image/jpeg',
    enum: ALLOWED_MIME_TYPES,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(ALLOWED_MIME_TYPES, {
    message: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
  })
  file_type: string;

  @ApiProperty({
    description: 'File size in bytes (max 10 MB = 10,485,760 bytes)',
    example: 1048576,
    maximum: 10485760,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(10485760, { message: 'File size cannot exceed 10 MB (10,485,760 bytes).' })
  file_size: number;
}

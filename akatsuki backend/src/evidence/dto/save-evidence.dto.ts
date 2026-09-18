/**
 * ===== save-evidence.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates the metadata submitted after the frontend finishes uploading
 * the file directly to Supabase Storage.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class SaveEvidenceDto {
  @ApiProperty({
    description: 'Original file name',
    example: 'fire_hazard_photo.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  file_name: string;

  @ApiProperty({
    description: 'MIME type of the uploaded file',
    example: 'image/jpeg',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  file_type: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(10485760)
  file_size: number;

  @ApiProperty({
    description: 'Storage path where file was saved inside the Supabase bucket',
    example: 'findings/a11a0709-b1c4-4b47-8141-94943fcf3121/1726000000-photo.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  storage_path: string;
}

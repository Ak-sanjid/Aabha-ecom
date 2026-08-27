import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateThemeTokenDto {
  @ApiProperty({ example: 'color.primary' })
  @IsString()
  key!: string;

  @ApiProperty({ example: '#C9A227' })
  @IsString()
  value!: string;

  @ApiPropertyOptional({
    description: 'Per-audience overrides, e.g. { "MEN": "#8C7A5B" }',
    example: { MEN: '#8C7A5B' },
  })
  @IsOptional()
  segmentValues?: Record<string, string>;
}

export class UpdateThemeDraftDto {
  @ApiProperty({ type: [UpdateThemeTokenDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateThemeTokenDto)
  tokens!: UpdateThemeTokenDto[];
}

export class CreateMenuItemDto {
  @ApiProperty({
    enum: [
      'HEADER_PRIMARY',
      'HEADER_SECONDARY',
      'TOP_CATEGORY_BAR',
      'SIDE_CATEGORY_PANEL',
      'MEGA_CATEGORY',
      'MEGA_BRAND',
      'FOOTER',
      'MOBILE_DRAWER',
    ],
  })
  @IsEnum([
    'HEADER_PRIMARY',
    'HEADER_SECONDARY',
    'TOP_CATEGORY_BAR',
    'SIDE_CATEGORY_PANEL',
    'MEGA_CATEGORY',
    'MEGA_BRAND',
    'FOOTER',
    'MOBILE_DRAWER',
  ])
  location!:
    | 'HEADER_PRIMARY'
    | 'HEADER_SECONDARY'
    | 'TOP_CATEGORY_BAR'
    | 'SIDE_CATEGORY_PANEL'
    | 'MEGA_CATEGORY'
    | 'MEGA_BRAND'
    | 'FOOTER'
    | 'MOBILE_DRAWER';

  @ApiProperty({ example: 'Skincare' })
  @IsString()
  labelEn!: string;

  @ApiProperty({ example: 'স্কিনকেয়ার' })
  @IsString()
  labelBn!: string;

  @ApiProperty({ example: '/category/skincare' })
  @IsString()
  href!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupKey?: string;

  @ApiPropertyOptional({ enum: ['UNISEX', 'WOMEN', 'MEN', 'MAKEUP'] })
  @IsOptional()
  @IsEnum(['UNISEX', 'WOMEN', 'MEN', 'MAKEUP'])
  segment?: 'UNISEX' | 'WOMEN' | 'MEN' | 'MAKEUP';

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class UpdateMenuItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  labelEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  labelBn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  href?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class ReorderMenuEntryDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position!: number;
}

export class ReorderMenuDto {
  @ApiProperty({ type: [ReorderMenuEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderMenuEntryDto)
  items!: ReorderMenuEntryDto[];
}

import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsDateString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CLIENT_ACTIVITY_EVENTS,
  CLIENT_ACTIVITY_MODULES,
  ClientActivityEventName,
  ClientActivityModule,
} from '../client-activity.catalog';

export class TrackClientEventDto {
  @IsIn(CLIENT_ACTIVITY_EVENTS as readonly string[])
  eventName: ClientActivityEventName;

  @IsIn(CLIENT_ACTIVITY_MODULES as readonly string[])
  module: ClientActivityModule;

  @IsString()
  @MaxLength(200)
  pagePath: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_-]{8,64}$/, {
    message: 'sessionId debe ser un identificador alfanumérico temporal válido.',
  })
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^\d+$/, { message: 'entityId solo admite identificadores numéricos.' })
  entityId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  frontendVersion?: string;
}

export class TrackClientEventsBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => TrackClientEventDto)
  events: TrackClientEventDto[];
}

export class QueryClientActivitySummaryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(CLIENT_ACTIVITY_MODULES as readonly string[])
  module?: ClientActivityModule;
}


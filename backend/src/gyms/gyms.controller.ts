import { Controller, Get, Query, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { GymsService } from './gyms.service';

@Controller('gyms')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Get()
  async search(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm: string,
  ) {
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (isNaN(latN) || isNaN(lngN)) throw new BadRequestException('lat and lng are required');
    try {
      return await this.gymsService.search(latN, lngN, parseFloat(radiusKm) || 60);
    } catch {
      throw new InternalServerErrorException('Could not fetch gym data');
    }
  }
}

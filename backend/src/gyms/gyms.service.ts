import { Injectable, Logger } from '@nestjs/common';

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class GymsService {
  private readonly logger = new Logger(GymsService.name);

  async search(lat: number, lng: number, radiusKm: number) {
    const apiKey = process.env.GOOGLE_MAPS_KEY as string;
    const queries = ['Megatlon', 'SportClub', 'Sport Club'];
    const all: any[] = [];

    for (const textQuery of queries) {
      try {
        const res = await fetch(PLACES_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.location,places.formattedAddress',
          } as HeadersInit,
          body: JSON.stringify({
            textQuery,
            locationBias: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: radiusKm * 1000,
              },
            },
            maxResultCount: 20,
            languageCode: 'es',
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          this.logger.warn(`Places '${textQuery}': HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        this.logger.log(`Places '${textQuery}': ${(data.places || []).length} results`);
        all.push(...(data.places || []));
      } catch (err) {
        this.logger.warn(`Places '${textQuery}' failed: ${err.message}`);
      }
    }

    // Deduplicate by place id
    const seen = new Set<string>();
    return all
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .map((p) => {
        const name: string = p.displayName?.text || '';
        return {
          id: p.id,
          name,
          lat: p.location.latitude,
          lng: p.location.longitude,
          address: p.formattedAddress || '',
          chain: name.toLowerCase().includes('megatlon') ? 'Megatlon' : 'SportClub',
        };
      })
      // Enforce exact radius (locationBias is a hint, not a hard limit)
      .filter((g) => haversineKm(lat, lng, g.lat, g.lng) <= radiusKm);
  }
}

export type RouteCoordinate = {
  lat: number;
  lng: number;
};

export const BRAZIL_BOUNDS = {
  east: -28.8,
  north: 5.3,
  south: -33.8,
  west: -73.9,
};

export function isInsideBrazilBounds(point: RouteCoordinate) {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat <= BRAZIL_BOUNDS.north &&
    point.lat >= BRAZIL_BOUNDS.south &&
    point.lng <= BRAZIL_BOUNDS.east &&
    point.lng >= BRAZIL_BOUNDS.west
  );
}

export function formatDuration(seconds: number) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

export function normalizeCoordinate(value: unknown): RouteCoordinate | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const point = value as Partial<RouteCoordinate>;
  const lat = Number(point.lat);
  const lng = Number(point.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

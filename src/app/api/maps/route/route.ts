import { NextResponse } from "next/server";
import { formatDuration, isInsideBrazilBounds, normalizeCoordinate } from "../_lib";

type HeiGitRouteResponse = {
  features?: {
    geometry?: {
      coordinates?: [number, number][];
    };
    properties?: {
      summary?: {
        distance?: number;
        duration?: number;
      };
    };
  }[];
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "MISSING_API_KEY" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const origin = normalizeCoordinate(body?.origin);
  const destination = normalizeCoordinate(body?.destination);

  if (!origin || !destination) {
    return NextResponse.json({ error: "INVALID_COORDINATES" }, { status: 400 });
  }

  if (!isInsideBrazilBounds(origin) || !isInsideBrazilBounds(destination)) {
    return NextResponse.json(
      {
        error: "OUTSIDE_BRAZIL",
        message: "A rota precisa ter origem e destino no Brasil.",
      },
      { status: 400 },
    );
  }

  const response = await fetch(
    "https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson",
    {
      body: JSON.stringify({
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ],
      }),
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "ROUTE_PROVIDER_ERROR", status: response.status },
      { status: 502 },
    );
  }

  const data = (await response.json()) as HeiGitRouteResponse;
  const feature = data.features?.[0];
  const summary = feature?.properties?.summary;
  const coordinates = feature?.geometry?.coordinates;

  if (!summary?.distance || !summary.duration || !coordinates?.length) {
    return NextResponse.json({ error: "ROUTE_NOT_FOUND" }, { status: 404 });
  }

  const distanceKm = Number((summary.distance / 1000).toFixed(1));

  return NextResponse.json({
    distanceKm,
    distanceLabel: `${distanceKm.toLocaleString("pt-BR")} km`,
    durationLabel: formatDuration(summary.duration),
    durationSeconds: Math.round(summary.duration),
    geometry: coordinates.map(([lng, lat]) => ({ lat, lng })),
    provider: "heigit-openrouteservice",
  });
}

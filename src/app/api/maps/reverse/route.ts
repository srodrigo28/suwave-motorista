import { NextResponse } from "next/server";

const BRAZIL_BOUNDS = {
  east: -28.8,
  north: 5.3,
  south: -33.8,
  west: -73.9,
};

type ReverseFeature = {
  properties?: {
    label?: string;
    locality?: string;
    name?: string;
    region?: string;
  };
};

type ReverseResponse = {
  features?: ReverseFeature[];
};

function isInsideBrazilBounds(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat <= BRAZIL_BOUNDS.north &&
    lat >= BRAZIL_BOUNDS.south &&
    lng <= BRAZIL_BOUNDS.east &&
    lng >= BRAZIL_BOUNDS.west
  );
}

export async function GET(request: Request) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "MISSING_API_KEY" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!isInsideBrazilBounds(lat, lng)) {
    return NextResponse.json({ error: "INVALID_COORDINATES" }, { status: 400 });
  }

  const providerUrl = new URL("https://api.openrouteservice.org/geocode/reverse");
  providerUrl.searchParams.set("point.lat", String(lat));
  providerUrl.searchParams.set("point.lon", String(lng));
  providerUrl.searchParams.set("boundary.country", "BRA");
  providerUrl.searchParams.set("size", "1");
  providerUrl.searchParams.set("lang", "pt-BR");

  const response = await fetch(providerUrl, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "REVERSE_GEOCODE_PROVIDER_ERROR", status: response.status },
      { status: 502 },
    );
  }

  const data = (await response.json()) as ReverseResponse;
  const properties = data.features?.[0]?.properties;

  return NextResponse.json({
    label: properties?.label ?? properties?.name ?? null,
    locality: properties?.locality ?? null,
    provider: "openrouteservice",
    region: properties?.region ?? null,
  });
}

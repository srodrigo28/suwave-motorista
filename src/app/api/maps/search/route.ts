import { NextResponse } from "next/server";
import { isInsideBrazilBounds } from "../_lib";

type RoutePlace = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  locality?: string;
  region?: string;
};

type GeocodeFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    gid?: string;
    id?: string;
    label?: string;
    locality?: string;
    name?: string;
    region?: string;
  };
};

type GeocodeResponse = {
  features?: GeocodeFeature[];
};

export async function GET(request: Request) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "MISSING_API_KEY" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 3) {
    return NextResponse.json({ places: [] });
  }

  const providerUrl = new URL("https://api.openrouteservice.org/geocode/search");
  providerUrl.searchParams.set("text", query);
  providerUrl.searchParams.set("boundary.country", "BRA");
  providerUrl.searchParams.set("size", "6");
  providerUrl.searchParams.set("lang", "pt-BR");

  const response = await fetch(providerUrl, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "GEOCODE_PROVIDER_ERROR", status: response.status },
      { status: 502 },
    );
  }

  const data = (await response.json()) as GeocodeResponse;
  const places = (data.features ?? [])
    .map((feature, index): RoutePlace | null => {
      const [lng, lat] = feature.geometry?.coordinates ?? [];
      const point = { lat: Number(lat), lng: Number(lng) };

      if (!isInsideBrazilBounds(point)) {
        return null;
      }

      const properties = feature.properties ?? {};

      return {
        id: properties.gid ?? properties.id ?? `${point.lat},${point.lng},${index}`,
        label: properties.label ?? properties.name ?? query,
        lat: point.lat,
        lng: point.lng,
        locality: properties.locality,
        region: properties.region,
      };
    })
    .filter((place): place is RoutePlace => place !== null);

  return NextResponse.json({ places });
}

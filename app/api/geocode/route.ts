
import { NextResponse } from "next/server";

type MapLocation = {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
};

type GeocodeResult = {
  lat: string;
  lon: string;
};

const cache = new Map<string, MapLocation | null>();

// Keep public Nominatim requests in a single queue.
let requestQueue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function geocode(
  name: string,
  query: string,
  description?: string
): Promise<MapLocation | null> {
  const cacheKey = query.toLowerCase().trim();

  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return Promise.resolve(
      cached
        ? { ...cached, name, description }
        : null
    );
  }

  const task = requestQueue.then(async () => {
    const previous = cache.get(cacheKey);
    if (previous !== undefined) {
      return previous
        ? { ...previous, name, description }
        : null;
    }

    const remaining = 1100 - (Date.now() - lastRequestAt);
    if (lastRequestAt && remaining > 0) {
      await delay(remaining);
    }

    lastRequestAt = Date.now();

    const url = new URL(
      "https://nominatim.openstreetmap.org/search"
    );

    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");

    try {
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en",
          // Replace the example email with your contact email.
          "User-Agent":
            "ElsewhereTripPlanner/1.0 (contact: your-email@example.com)",
        },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Geocoder returned ${response.status}`);
      }

      const results =
        (await response.json()) as GeocodeResult[];

      const first = results[0];

      if (!first) {
        cache.set(cacheKey, null);
        return null;
      }

      const latitude = Number(first.lat);
      const longitude = Number(first.lon);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        cache.set(cacheKey, null);
        return null;
      }

      const location: MapLocation = {
        name,
        latitude,
        longitude,
        description,
      };

      cache.set(cacheKey, location);
      return location;
    } catch (error) {
      console.error("Geocoding failed:", query, error);
      return null;
    }
  });

  requestQueue = task.then(
    () => undefined,
    () => undefined
  );

  return task;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("destination" in body) ||
      typeof body.destination !== "string" ||
      !("places" in body) ||
      !Array.isArray(body.places)
    ) {
      return NextResponse.json(
        { error: "Invalid destination or places." },
        { status: 400 }
      );
    }

    const destination = body.destination.trim();

    if (!destination || destination.length > 100) {
      return NextResponse.json(
        { error: "Invalid destination." },
        { status: 400 }
      );
    }

    const places = body.places
      .filter(
        (place: unknown): place is string =>
          typeof place === "string" &&
          place.trim().length > 0 &&
          place.length <= 150
      )
      .map((place: string) => place.trim());

    // Destination + at most seven unique itinerary locations.
    const uniquePlaces = [
      destination,
      ...places.filter(
        (place) =>
          place.toLowerCase() !== destination.toLowerCase()
      ),
    ].filter(
      (place, index, all) =>
        all.findIndex(
          (item) =>
            item.toLowerCase() === place.toLowerCase()
        ) === index
    ).slice(0, 8);

    const locations: MapLocation[] = [];

    // Sequential geocoding avoids parallel requests.
    for (const place of uniquePlaces) {
      const query =
        place.toLowerCase() === destination.toLowerCase()
          ? destination
          : `${place}, ${destination}`;

      const location = await geocode(
        place,
        query,
        place === destination
          ? "Trip destination"
          : "Suggested itinerary stop"
      );

      if (location) {
        locations.push(location);
      }
    }

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Geocode API error:", error);

    return NextResponse.json(
      { error: "Unable to locate the trip destinations." },
      { status: 500 }
    );
  }
}

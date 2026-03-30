type ReverseGeocodeResult = {
  label: string;
  source: "reverse-geocoded";
};

type NominatimResponse = {
  address?: {
    amenity?: string;
    city?: string;
    city_district?: string;
    country?: string;
    county?: string;
    hamlet?: string;
    locality?: string;
    neighbourhood?: string;
    postcode?: string;
    quarter?: string;
    road?: string;
    state?: string;
    state_district?: string;
    suburb?: string;
    town?: string;
    tourism?: string;
    village?: string;
  };
  display_name?: string;
  name?: string;
};

function pickPlaceLabel(payload: NominatimResponse) {
  const address = payload.address;

  if (!address) {
    return payload.display_name?.split(",").slice(0, 4).join(", ");
  }

  const landmark =
    payload.name ?? address.tourism ?? address.amenity ?? address.road;
  const locality =
    address.neighbourhood ??
    address.suburb ??
    address.quarter ??
    address.locality ??
    address.hamlet ??
    address.village ??
    address.town ??
    address.city ??
    address.city_district;
  const region = address.county ?? address.state_district ?? address.state;
  const state = address.state;
  const country = address.country;

  return (
    [landmark, locality, region, state, country]
      .filter((part, index, items) => Boolean(part) && items.indexOf(part) === index)
      .join(", ") ||
    payload.display_name?.split(",").slice(0, 4).join(", ")
  );
}

export async function reverseGeocodeLocation(input: {
  latitude: number;
  longitude: number;
}): Promise<ReverseGeocodeResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("lat", input.latitude.toString());
    url.searchParams.set("lon", input.longitude.toString());
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "memory-lane-demo/0.1"
      },
      next: {
        revalidate: 86400
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as NominatimResponse;
    const label = pickPlaceLabel(payload);

    if (!label) {
      return null;
    }

    return {
      label,
      source: "reverse-geocoded"
    };
  } catch {
    return null;
  }
}

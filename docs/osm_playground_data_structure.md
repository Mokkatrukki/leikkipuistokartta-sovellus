# OSM Playground Data Structure Notes (Oulu)

This document outlines observations about the structure of playground data retrieved from the Overpass API for the Oulu region, specifically regarding how playground names and other properties are stored.

## Overpass API Query

The data was fetched using the following Overpass API query:

```
[out:json][timeout:25];
area["name"="Oulu"]->.a;
(
  node["leisure"="playground"](area.a);
  way["leisure"="playground"](area.a);
  relation["leisure"="playground"](area.a);
);
out body;
>;
out skel qt;
```

## GeoJSON Conversion

The JSON output from Overpass is converted to GeoJSON using `osmtogeojson`.
The relevant data for each playground is found in the `properties` object of each GeoJSON feature.

## Playground Name Property

Based on sample data from districts in Oulu (e.g., Kaijonharju), playground names are consistently found directly as a `name` property within the `feature.properties` object.

**Example (Named Playground):**
```json
{
  "leisure": "playground",
  "name": "Kaijonharjun keskusleikkipuisto",
  "type": "multipolygon",
  "id": "relation/2527692"
}
```

**Example (Unnamed Playground):**
An unnamed playground simply lacks the `name` property in its `properties` object.
```json
{
  "leisure": "playground",
  "id": "way/575687760"
}
```

There was no observed usage of `properties.tags.name` for storing the primary name in this dataset. The application logic should prioritize checking `feature.properties.name`.

## Other Notable Properties

Other observed properties within `feature.properties` for playgrounds include:

*   `id`: The OSM element ID (e.g., "way/35995092", "relation/2527692").
*   `leisure`: Should always be "playground".
*   `access`: e.g., "yes", "private".
*   `operator`: e.g., "Oulun kaupunki".
*   `website`: URL to a website with more information.
*   `addr:housenumber`, `addr:street`: Address details.
*   `dog`: e.g., "no".
*   `surface`: e.g., "unpaved".
*   `type`: For relations, indicates the type (e.g., "multipolygon").

## Application Logic Considerations

- When determining if a playground is named, check for the existence and non-emptiness of `feature.properties.name`.
- When displaying a playground's name, use `feature.properties.name`.
- The `InfoPanel` in the application displays the full `properties` object for each playground for debugging and detailed inspection.

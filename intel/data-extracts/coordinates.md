# Geographic Coordinates - Ora Companies

All companies are located in the Ora industrial area, 1630 Gamle Fredrikstad, Norway.
Coordinates are in [longitude, latitude] format for MapLibre GL compatibility.

## Coordinate Sources
- **OSM**: OpenStreetMap Nominatim geocoding (address-level precision)
- **Web**: Coordinates found on company/map websites (Waze, NG Metall site)
- **Estimated**: Interpolated from nearby verified addresses or Borg Havn industrial area boundary

## Summary Table

| # | Company | Address | Longitude | Latitude | Source | Confidence |
|---|---------|---------|-----------|----------|--------|------------|
| 1 | FREVAR KF | Habornveien 61 | 10.9665 | 59.1850 | OSM | verified |
| 2 | Kronos Titan AS | Titangata 1 | 10.9550 | 59.1896 | OSM | verified |
| 3 | Kemira Chemicals AS | Oraveien 14 | 10.9560 | 59.1865 | OSM | verified |
| 4 | Denofa AS | Oraveien 15B | 10.9561 | 59.1928 | OSM | verified |
| 5 | Batteriretur AS | Kortbolgen 15B | 10.9729 | 59.1886 | OSM | verified |
| 6 | Metallco Stene AS | Borg Havnevei 11 | 10.9570 | 59.1830 | estimated | estimated |
| 7 | SAREN Energi AS (BIO-EL) | Habornveien 61 | 10.9665 | 59.1850 | OSM | verified |
| 8 | Metallco Kabel AS | Titangata 14 | 10.9625 | 59.1889 | OSM | verified |
| 9 | Stene Stal Gjenvinning AS | Borg Havnevei 16 | 10.9575 | 59.1822 | estimated | estimated |
| 10 | NG Metall AS | Borg Havnevei 7 / Loytnant Dons vei 4 | 10.9640 | 59.1833 | web | verified |
| 11 | Fredrikstad Fjernvarme AS | Oraveien 2, inngang E | 10.9521 | 59.1910 | OSM | verified |
| 12 | Borg Havn IKS | Oraveien 27 | 10.9582 | 59.1846 | OSM | verified |

## Notes

### Co-located Companies
- **FREVAR KF** and **SAREN Energi AS (BIO-EL)** share the same address (Habornveien 61).
  The SAREN Energy BIO-EL plant is operated by FREVAR KF staff. For map visualization,
  consider offsetting one marker slightly to avoid overlap.

### Estimated Coordinates
- **Metallco Stene AS** (Borg Havnevei 11): Address not in OSM. Estimated based on
  Borg Havn industrial area boundary (59.1795-59.1855, 10.9534-10.9593) and proximity
  to NG Metall (Borg Havnevei 7).
- **Stene Stal Gjenvinning AS** (Borg Havnevei 16): Address not in OSM. Estimated at
  southern end of Borg Havnevei near the harbor area.

### Address Verification Sources
| Company | Address Source |
|---------|--------------|
| FREVAR KF | frevar.no/kontakt-oss, gulesider.no |
| Kronos Titan AS | kronosww.com, proff.no, opencorpdata.com |
| Kemira Chemicals AS | proff.no, gulesider.no |
| Denofa AS | denofa.no/en/contact, proff.no, yelp.com |
| Batteriretur AS | batteriretur.no/en/kontakt, proff.no |
| Metallco Stene AS | metallco.com/avdelinger/fredrikstad.php |
| SAREN Energi AS | sarenenergy.com/en/contact-us |
| Metallco Kabel AS | metallco.com/avdelinger/bil-fredrikstad2.php |
| Stene Stal Gjenvinning | stenestaalgjenvinning.no/kontakt-oss |
| NG Metall AS | ngmetall.no/lokasjoner/fredrikstad-ng |
| Fredrikstad Fjernvarme | ffas.no, fjernkontrollen.no |
| Borg Havn IKS | borg-havn.no/kontakt-oss |

## MapLibre GeoJSON Format

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "FREVAR KF", "industry": "Waste-to-energy", "address": "Habornveien 61" },
      "geometry": { "type": "Point", "coordinates": [10.9665, 59.1850] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Kronos Titan AS", "industry": "Titanium dioxide production", "address": "Titangata 1" },
      "geometry": { "type": "Point", "coordinates": [10.9550, 59.1896] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Kemira Chemicals AS", "industry": "Water treatment chemicals", "address": "Oraveien 14" },
      "geometry": { "type": "Point", "coordinates": [10.9560, 59.1865] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Denofa AS", "industry": "Soybean processing", "address": "Oraveien 15B" },
      "geometry": { "type": "Point", "coordinates": [10.9561, 59.1928] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Batteriretur AS", "industry": "Battery recycling", "address": "Kortbolgen 15B" },
      "geometry": { "type": "Point", "coordinates": [10.9729, 59.1886] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Metallco Stene AS", "industry": "Metal recycling", "address": "Borg Havnevei 11" },
      "geometry": { "type": "Point", "coordinates": [10.9570, 59.1830] }
    },
    {
      "type": "Feature",
      "properties": { "name": "SAREN Energi AS", "industry": "Waste-to-energy / Steam", "address": "Habornveien 61" },
      "geometry": { "type": "Point", "coordinates": [10.9665, 59.1850] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Metallco Kabel AS", "industry": "Cable recycling", "address": "Titangata 14" },
      "geometry": { "type": "Point", "coordinates": [10.9625, 59.1889] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Stene Stal Gjenvinning AS", "industry": "Steel recycling", "address": "Borg Havnevei 16" },
      "geometry": { "type": "Point", "coordinates": [10.9575, 59.1822] }
    },
    {
      "type": "Feature",
      "properties": { "name": "NG Metall AS", "industry": "Metal trading", "address": "Borg Havnevei 7" },
      "geometry": { "type": "Point", "coordinates": [10.9640, 59.1833] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Fredrikstad Fjernvarme AS", "industry": "District heating", "address": "Oraveien 2" },
      "geometry": { "type": "Point", "coordinates": [10.9521, 59.1910] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Borg Havn IKS", "industry": "Port operations", "address": "Oraveien 27" },
      "geometry": { "type": "Point", "coordinates": [10.9582, 59.1846] }
    }
  ]
}
```

## Map Center and Zoom

For MapLibre initialization, use:
- **Center:** [10.960, 59.187] (approximate centroid of all 12 companies)
- **Zoom:** 14.5 (shows the full Ora industrial area)
- **Bounds:** SW [10.950, 59.180] to NE [10.975, 59.195]

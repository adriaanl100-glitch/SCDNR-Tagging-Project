# Data Schema & Sync Contract

## Catch Record (client-side, camelCase)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string (UUID v4) | yes | Generated on save |
| `tagType` | `"CR"` \| `"K"` | yes | T-Bar or Nylon Dart |
| `tagNumber` | string | yes | CR: 5 digits; K: 6 digits |
| `vialNumber` | string | no | Fin clip vial ID |
| `capturedAt` | ISO-8601 string | yes | Auto on save |
| `species` | string | yes | From controlled dropdown |
| `lengthInches` | number | yes | CR ≥ 10; K ≥ 18 |
| `measurementType` | `"Tail"` \| `"Fork"` | yes | Auto-default by species |
| `measurementAccuracy` | `"Measured"` \| `"Estimated"` | yes | |
| `locationName` | string | yes | Landmark reference |
| `latitude` | number | yes | From GPS or map |
| `longitude` | number | yes | From GPS or map |
| `gridCellId` | string | no | 1-mile grid cell ID |
| `condition` | `"Good"` \| `"Fair"` \| `"Poor"` | yes | |
| `photoBase64` | string | yes | JPEG data URL, max ~200KB |
| `syncStatus` | `"pending"` \| `"synced"` \| `"failed"` | yes | |
| `createdAt` | ISO-8601 string | yes | Record creation time |

## Species List & Validation Rules

| Species | Tag CR | Tag K | Min length | Measurement default | Notes |
|---------|--------|-------|------------|---------------------|-------|
| Red Drum | ✓ | ✓ | CR 10" / K 18" | Tail | |
| Black Drum | ✓ | ✓ | CR 10" / K 18" | Tail | |
| Spotted Seatrout | ✓ | ✓ | CR 10" / K 18" | Tail | **DO NOT TAG** warning |
| Southern Flounder | ✓ | ✗ | CR 10" | Tail | K disabled |
| Summer Flounder | ✓ | ✗ | CR 10" | Tail | K disabled |
| Sheepshead | ✓ | ✓ | CR 10" / K 18" | Fork | |
| Black Sea Bass | ✓ | ✓ | CR 10" / K 18" | Fork | |
| Cobia | ✓ | ✓ | CR 10" / K 18" | Fork | |
| Bluefish | ✓ | ✓ | CR 10" / K 18" | Fork | |
| Tarpon | ✓ | ✓ | CR 10" / K 18" | Fork | |
| King Mackerel | ✗ | ✓ | K 18" | Fork | CR disabled |
| Spanish Mackerel | ✗ | ✓ | K 18" | Fork | CR disabled |
| Billfish | ✗ | ✓ | K 18" | Fork | CR disabled |
| Tuna | ✗ | ✓ | K 18" | Fork | CR disabled |

## Sync Payload (POST to webhook)

Same fields as catch record. Server expects `Content-Type: application/json`.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tagType": "CR",
  "tagNumber": "12345",
  "vialNumber": "",
  "capturedAt": "2026-06-25T14:30:00.000Z",
  "species": "Red Drum",
  "lengthInches": 24,
  "measurementType": "Tail",
  "measurementAccuracy": "Measured",
  "locationName": "Wando River",
  "latitude": 32.8234,
  "longitude": -79.9123,
  "gridCellId": "32.820_-79.920",
  "condition": "Good",
  "photoBase64": "data:image/jpeg;base64,...",
  "syncStatus": "pending"
}
```

## Webhook Response

```json
{
  "success": true,
  "rowId": 42,
  "imageUrl": "https://drive.google.com/file/d/..."
}
```

HTTP 200 on success. Any other status retains record locally with `syncStatus: "failed"`.

## Google Sheet Column Order

| Col | Header |
|-----|--------|
| A | Record ID |
| B | Tag Type |
| C | Tag Number |
| D | Vial Number |
| E | Captured At |
| F | Species |
| G | Length (in) |
| H | Measurement Type |
| I | Measurement Accuracy |
| J | Location Name |
| K | Latitude |
| L | Longitude |
| M | Grid Cell ID |
| N | Condition |
| O | Photo URL |
| P | Synced At |

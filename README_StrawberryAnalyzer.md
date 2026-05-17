# Strawberry Plant Health Analyzer — Integration Guide

## What this file does

`strawberryAnalyzer.js` connects your mobile app to Claude (Anthropic's AI) to analyze
photos of strawberry plants. Pass it a photo → get back a structured JSON report covering:

| Field | What it tells you |
|---|---|
| `detectedVariety` | Which of the 20 dataset varieties the plant looks like |
| `healthStatus` | Healthy / Stressed / Diseased / Critical |
| `healthSummary` | Plain-English 1–2 sentence summary |
| `plantNeeds` | Water, sunlight, spacing, pruning guidance |
| `soilNeeds` | Target pH, soil type, amendments, fertilizer |
| `careInstructions` | Ordered list of action steps |
| `alerts` | Disease/pest warnings with severity + action |
| `generalTips` | Seasonal advice for small-scale farmers |

The AI cross-references its visual analysis against your 20-variety GIS dataset to tailor advice
to the specific cultivar it identifies.

---

## Setup (3 steps)

### 1 — Install dependencies

**Expo (recommended):**
```bash
npx expo install expo-image-picker expo-file-system
```

**Bare React Native:**
```bash
npm install react-native-image-picker react-native-fs
```

### 2 — Add your GEMINI API key

### 3 — Copy the file into your project

Place `strawberryAnalyzer.js` anywhere in your source tree, e.g. `src/lib/`.

---

## Usage

### React Native / Expo — camera or gallery photo

```jsx
import * as ImagePicker from 'expo-image-picker';
import { analyzeFromUri } from './lib/strawberryAnalyzer';

export default function ScanScreen() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  async function takePicture() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        const report = await analyzeFromUri(result.assets[0].uri);
        setReport(report);
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <View>
      <Button title="Scan Plant" onPress={takePicture} />
      {loading && <ActivityIndicator />}
      {report && (
        <>
          <Text>Variety: {report.detectedVariety}</Text>
          <Text>Health: {report.healthStatus}</Text>
          <Text>{report.healthSummary}</Text>
          <Text>Water: {report.plantNeeds.water}</Text>
          <Text>Fertilizer: {report.soilNeeds.fertilizer}</Text>
          {report.alerts.map((a, i) => (
            <Text key={i} style={{ color: 'red' }}>
              ⚠ {a.name} ({a.severity}): {a.action}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}
```

### Raw base64 (any framework)

```js
import { analyzeStrawberryImage } from './strawberryAnalyzer';

// base64Jpeg = string of base64-encoded JPEG bytes (no "data:image/..." prefix)
const report = await analyzeStrawberryImage(base64Jpeg);
console.log(report);
```

---

## Example API response

```json
{
  "detectedVariety": "Chandler",
  "varietyConfidence": "Medium",
  "healthStatus": "Stressed",
  "healthSummary": "The plant shows yellowing leaves and slight wilting, indicating underwatering or early iron deficiency.",
  "plantNeeds": {
    "water": "Increase to 1.5 in/week with drip irrigation. Check soil moisture 2 inches deep before each watering.",
    "sunlight": "Ensure at least 8 hours of full sun. Remove any shading material nearby.",
    "spacing": "Plants appear correctly spaced at ~12 inches. No action needed.",
    "pruning": "Remove the 3 older yellowed leaves at the base to redirect energy to new growth."
  },
  "soilNeeds": {
    "phTarget": "5.8 – 6.5",
    "soilType": "Well-drained sandy loam",
    "amendments": "Add 1–2 inches of compost. If pH is above 6.5, apply sulfur at 1 lb per 100 sq ft.",
    "fertilizer": "Apply balanced 10-10-10 slow-release fertilizer at planting. Side-dress with ammonium nitrate at 0.5 lb/100 sq ft six weeks after planting."
  },
  "careInstructions": [
    "Water deeply 2–3 times per week, aiming for 1–2 inches total.",
    "Mulch with 2 inches of straw around the base to retain moisture.",
    "Test soil pH and adjust if outside the 5.8–6.5 range.",
    "Scout for spider mites and aphids weekly; apply insecticidal soap at first sign."
  ],
  "alerts": [
    {
      "type": "Nutrient Deficiency",
      "name": "Iron chlorosis (suspected)",
      "severity": "Mild",
      "action": "Apply chelated iron foliar spray and lower soil pH slightly if above 6.5."
    }
  ],
  "generalTips": "Chandler strawberries thrive in June-bearing schedules. Keep runners trimmed during the first season to direct energy into root and crown development for a stronger harvest next year.",
  "dataSource": "Strawberry GIS Dataset v2026-03-24"
}
```

---


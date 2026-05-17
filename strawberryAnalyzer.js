/**
 * Strawberry Plant Health Analyzer
 * Powered by Google Gemini 1.5 Flash (FREE tier — 1,500 requests/day at no cost)
 * -----------------------------------
 * Drop this module into your mobile app (React Native, Expo, etc.).
 * Call analyzeStrawberryImage(base64ImageString) with a JPEG/PNG photo
 * of the plant and receive a structured JSON report covering:
 *   - Detected variety (matched against the GIS dataset)
 *   - Plant health status
 *   - Soil needs & recommendations
 *   - Plant care instructions
 *   - Alerts for disease or pest risk
 *
 * HOW TO GET YOUR FREE API KEY (takes 2 minutes, no credit card):
 *   1. Go to https://aistudio.google.com/app/apikey
 *   2. Sign in with any Google account
 *   3. Click "Create API key"
 *   4. Paste the key into GEMINI_API_KEY below
 *
 * FREE TIER LIMITS:
 *   - 1,500 requests per day
 *   - 1,000,000 tokens per minute
 *   - No credit card required
 *
 * USAGE EXAMPLE:
 *   import { analyzeStrawberryImage } from './strawberryAnalyzer';
 *
 *   const report = await analyzeStrawberryImage(base64Jpeg);
 *   console.log(report.healthStatus);      // "Healthy" | "Stressed" | "Diseased" | "Critical"
 *   console.log(report.plantNeeds);        // plain-English plant care advice
 *   console.log(report.soilNeeds);         // soil amendment / pH advice
 *   console.log(report.careInstructions);  // watering, fertiliser, spacing etc.
 *   console.log(report.alerts);            // array of disease / pest warnings
 *   console.log(report.detectedVariety);   // matched variety name or "Unknown"
 */

// ─── Configuration ─────────────────────────────────────────────────────────────

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // https://aistudio.google.com/app/apikey
const GEMINI_MODEL   = "gemini-1.5-flash";          // Free tier model
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─── Strawberry GIS Dataset (20 varieties) ─────────────────────────────────────
// Source: Strawberry_GIS_Dataset CSV (verified 2026-03-24)

const STRAWBERRY_DATASET = [
  { variety_id: 1,  common_name: "Chandler",      scientific_name: "Fragaria × ananassa 'Chandler'",      usda_zone_min: "5b", usda_zone_max: "8b", temp_min_f: -10, temp_max_f: 90,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, slow-release at planting",          ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained sandy loam",              sunlight_req: "Full sun", watering_freq: "1–2 in/week, drip preferred",           fruit_season: "June-bearing",  days_to_maturity: 90, plant_spacing_in: 12, yield_lbs_per_plant: 1.5, runner_production: "High", chill_hours_req: 500, heat_tolerance: "Medium", frost_tolerance: "Medium", drought_tolerance: "Low",    disease_resistance: "Botrytis, Leaf scorch",                                    disease_susceptibility: "Root rot, Verticillium wilt",                              pest_vulnerability: "Spider mites, Aphids, Slugs",          best_use: "Fresh / Commercial", container_ok: true,  greenhouse_ok: true  },
  { variety_id: 2,  common_name: "Albion",         scientific_name: "Fragaria × ananassa 'Albion'",         usda_zone_min: "4a", usda_zone_max: "8b", temp_min_f: -20, temp_max_f: 90,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, monthly during fruiting",          ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained, fertile loam",            sunlight_req: "Full sun", watering_freq: "1–2 in/week",                           fruit_season: "Day-neutral",   days_to_maturity: 90, plant_spacing_in: 12, yield_lbs_per_plant: 1.0, runner_production: "Low",  chill_hours_req: 500, heat_tolerance: "High",   frost_tolerance: "Medium", drought_tolerance: "Low",    disease_resistance: "Verticillium wilt, Phytophthora crown rot, Anthracnose",   disease_susceptibility: "Powdery mildew, Botrytis",                                 pest_vulnerability: "Spider mites, Aphids, Thrips",         best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 3,  common_name: "Seascape",       scientific_name: "Fragaria × ananassa 'Seascape'",       usda_zone_min: "4a", usda_zone_max: "9a", temp_min_f: -20, temp_max_f: 90,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, light monthly feeding",             ph_min: 5.5, ph_max: 6.8, soil_type: "Well-drained sandy loam",              sunlight_req: "Full sun", watering_freq: "1 in/week, drip preferred",             fruit_season: "Day-neutral",   days_to_maturity: 90, plant_spacing_in: 12, yield_lbs_per_plant: 1.5, runner_production: "Low",  chill_hours_req: 500, heat_tolerance: "High",   frost_tolerance: "Medium", drought_tolerance: "Medium", disease_resistance: "Verticillium wilt, Red stele",                             disease_susceptibility: "Botrytis, Powdery mildew",                                 pest_vulnerability: "Spider mites, Aphids",                 best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 4,  common_name: "Camarosa",       scientific_name: "Fragaria × ananassa 'Camarosa'",       usda_zone_min: "4a", usda_zone_max: "9a", temp_min_f: -20, temp_max_f: 95,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10 at planting, moderate feeding",      ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained loam or sandy loam",       sunlight_req: "Full sun", watering_freq: "1–2 in/week",                           fruit_season: "June-bearing",  days_to_maturity: 75, plant_spacing_in: 12, yield_lbs_per_plant: 2.0, runner_production: "High", chill_hours_req: 250, heat_tolerance: "High",   frost_tolerance: "Low",    drought_tolerance: "Low",    disease_resistance: "Verticillium wilt, Phytophthora crown rot, Anthracnose",   disease_susceptibility: "Powdery mildew, Common leaf spot",                          pest_vulnerability: "Spider mites, Aphids, Lygus bugs",     best_use: "Fresh / Commercial", container_ok: true,  greenhouse_ok: true  },
  { variety_id: 5,  common_name: "Sweet Charlie",  scientific_name: "Fragaria × ananassa 'Sweet Charlie'",  usda_zone_min: "5a", usda_zone_max: "8b", temp_min_f: -15, temp_max_f: 90,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10 at planting, light feeding",          ph_min: 5.6, ph_max: 6.6, soil_type: "Well-drained, moist loam",              sunlight_req: "Full sun", watering_freq: "1–2 in/week",                           fruit_season: "June-bearing",  days_to_maturity: 65, plant_spacing_in: 12, yield_lbs_per_plant: 0.75,runner_production: "High", chill_hours_req: 500, heat_tolerance: "Medium", frost_tolerance: "Medium", drought_tolerance: "Low",    disease_resistance: "Botrytis, Leaf blight",                                    disease_susceptibility: "Anthracnose, Root rot",                                     pest_vulnerability: "Spider mites, Aphids",                 best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 6,  common_name: "Ozark Beauty",   scientific_name: "Fragaria × ananassa 'Ozark Beauty'",   usda_zone_min: "4a", usda_zone_max: "8b", temp_min_f: -30, temp_max_f: 85,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10 slow-release",                        ph_min: 5.5, ph_max: 6.8, soil_type: "Well-drained loam",                    sunlight_req: "Full sun", watering_freq: "1 in/week",                             fruit_season: "Everbearing",   days_to_maturity: 60, plant_spacing_in: 12, yield_lbs_per_plant: 1.5, runner_production: "High", chill_hours_req: 300, heat_tolerance: "Low",    frost_tolerance: "High",   drought_tolerance: "Low",    disease_resistance: "Gray mold (partial)",                                      disease_susceptibility: "Verticillium wilt, Red stele",                              pest_vulnerability: "Spider mites, Aphids, Slugs",          best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 7,  common_name: "Monterey",       scientific_name: "Fragaria × ananassa 'Monterey'",       usda_zone_min: "4a", usda_zone_max: "8b", temp_min_f: -20, temp_max_f: 90,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, light regular feeding",             ph_min: 5.5, ph_max: 6.8, soil_type: "Well-drained sandy loam",              sunlight_req: "Full sun", watering_freq: "1–2 in/week, drip preferred",           fruit_season: "Day-neutral",   days_to_maturity: 90, plant_spacing_in: 12, yield_lbs_per_plant: 1.5, runner_production: "Low",  chill_hours_req: 400, heat_tolerance: "Medium", frost_tolerance: "Medium", drought_tolerance: "Low",    disease_resistance: "Verticillium wilt, Red stele, Anthracnose",                disease_susceptibility: "Powdery mildew, Botrytis",                                 pest_vulnerability: "Spider mites, Aphids, Thrips",         best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 8,  common_name: "San Andreas",    scientific_name: "Fragaria × ananassa 'San Andreas'",    usda_zone_min: "4a", usda_zone_max: "8b", temp_min_f: -20, temp_max_f: 90,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, monthly during growing season",     ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained, fertile loam",            sunlight_req: "Full sun", watering_freq: "1–2 in/week",                           fruit_season: "Day-neutral",   days_to_maturity: 90, plant_spacing_in: 12, yield_lbs_per_plant: 1.5, runner_production: "Low",  chill_hours_req: 400, heat_tolerance: "Medium", frost_tolerance: "Medium", drought_tolerance: "Low",    disease_resistance: "Red stele, Verticillium wilt, Leaf spot, Leaf scorch",     disease_susceptibility: "Botrytis, Powdery mildew",                                 pest_vulnerability: "Spider mites, Aphids",                 best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 9,  common_name: "Earliglow",      scientific_name: "Fragaria × ananassa 'Earliglow'",      usda_zone_min: "4a", usda_zone_max: "8a", temp_min_f: -20, temp_max_f: 85,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10 slow-release",                        ph_min: 5.5, ph_max: 6.5, soil_type: "Rich, well-drained loam",               sunlight_req: "Full sun", watering_freq: "1 in/week",                             fruit_season: "June-bearing",  days_to_maturity: 55, plant_spacing_in: 12, yield_lbs_per_plant: 1.0, runner_production: "High", chill_hours_req: 500, heat_tolerance: "Low",    frost_tolerance: "High",   drought_tolerance: "Low",    disease_resistance: "Verticillium wilt, Red stele, Leaf scorch, Root rot",      disease_susceptibility: "Powdery mildew",                                            pest_vulnerability: "Spider mites, Aphids, Slugs",          best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 10, common_name: "Portola",        scientific_name: "Fragaria × ananassa 'Portola'",        usda_zone_min: "4a", usda_zone_max: "8b", temp_min_f: -20, temp_max_f: 90,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, monthly during growing season",     ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained, fertile loam",            sunlight_req: "Full sun", watering_freq: "1–2 in/week, drip preferred",           fruit_season: "Day-neutral",   days_to_maturity: 90, plant_spacing_in: 12, yield_lbs_per_plant: 1.5, runner_production: "Low",  chill_hours_req: 400, heat_tolerance: "Medium", frost_tolerance: "Medium", drought_tolerance: "Low",    disease_resistance: "Verticillium wilt, Phytophthora crown rot",                disease_susceptibility: "Botrytis, Powdery mildew",                                 pest_vulnerability: "Spider mites, Thrips, Aphids",         best_use: "Fresh / Commercial", container_ok: true,  greenhouse_ok: true  },
  { variety_id: 11, common_name: "Jewel",          scientific_name: "Fragaria × ananassa 'Jewel'",          usda_zone_min: "4a", usda_zone_max: "8a", temp_min_f: -20, temp_max_f: 85,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, moderate feeding",                   ph_min: 5.5, ph_max: 6.5, soil_type: "Loose, well-drained loam",              sunlight_req: "Full sun", watering_freq: "1 in/week",                             fruit_season: "June-bearing",  days_to_maturity: 75, plant_spacing_in: 12, yield_lbs_per_plant: 1.5, runner_production: "High", chill_hours_req: 500, heat_tolerance: "Low",    frost_tolerance: "Medium", drought_tolerance: "Low",    disease_resistance: "Leaf scorch, Leaf blight",                                 disease_susceptibility: "Verticillium wilt, Botrytis",                              pest_vulnerability: "Spider mites, Aphids, Slugs",          best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 12, common_name: "Tristar",        scientific_name: "Fragaria × ananassa 'Tristar'",        usda_zone_min: "4a", usda_zone_max: "8b", temp_min_f: -30, temp_max_f: 85,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, light regular feeding",             ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained loam",                    sunlight_req: "Full sun", watering_freq: "1 in/week",                             fruit_season: "Day-neutral",   days_to_maturity: 90, plant_spacing_in: 12, yield_lbs_per_plant: 0.75,runner_production: "Low",  chill_hours_req: 400, heat_tolerance: "Low",    frost_tolerance: "High",   drought_tolerance: "Medium", disease_resistance: "Red stele, Verticillium wilt, Leaf diseases",              disease_susceptibility: "Botrytis, Powdery mildew",                                 pest_vulnerability: "Spider mites, Aphids, Tarnished plant bugs", best_use: "Fresh / Ornamental", container_ok: true, greenhouse_ok: true },
  { variety_id: 13, common_name: "Fort Laramie",   scientific_name: "Fragaria × ananassa 'Fort Laramie'",   usda_zone_min: "3a", usda_zone_max: "9a", temp_min_f: -40, temp_max_f: 85,  humidity_pref: "Low",    fertilizer_needs: "Balanced 10-10-10, light annual feeding",               ph_min: 6.0, ph_max: 6.5, soil_type: "Well-drained loam, tolerates varied soils", sunlight_req: "Full sun", watering_freq: "1 in/week",                             fruit_season: "Everbearing",   days_to_maturity: 60, plant_spacing_in: 15, yield_lbs_per_plant: 1.0, runner_production: "High", chill_hours_req: 300, heat_tolerance: "Low",    frost_tolerance: "High",   drought_tolerance: "Medium", disease_resistance: "Botrytis (partial), Verticillium wilt (moderate)",         disease_susceptibility: "Red stele, Leaf spot",                                      pest_vulnerability: "Aphids, Slugs",                        best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 14, common_name: "Quinault",       scientific_name: "Fragaria × ananassa 'Quinault'",       usda_zone_min: "3a", usda_zone_max: "8b", temp_min_f: -40, temp_max_f: 85,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, moderate regular feeding",           ph_min: 5.5, ph_max: 6.5, soil_type: "Moist, well-drained loam",              sunlight_req: "Full sun", watering_freq: "1 in/week, keep consistently moist",    fruit_season: "Everbearing",   days_to_maturity: 60, plant_spacing_in: 15, yield_lbs_per_plant: 1.0, runner_production: "Low",  chill_hours_req: 300, heat_tolerance: "Low",    frost_tolerance: "High",   drought_tolerance: "Low",    disease_resistance: "Botrytis (partial)",                                       disease_susceptibility: "Verticillium wilt, Leaf diseases",                          pest_vulnerability: "Spider mites, Aphids, Slugs",          best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 15, common_name: "Honeoye",        scientific_name: "Fragaria × ananassa 'Honeoye'",        usda_zone_min: "3a", usda_zone_max: "8a", temp_min_f: -40, temp_max_f: 85,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10 slow-release at planting",            ph_min: 5.5, ph_max: 6.5, soil_type: "Rich, well-drained loam",               sunlight_req: "Full sun", watering_freq: "1 in/week",                             fruit_season: "June-bearing",  days_to_maturity: 55, plant_spacing_in: 12, yield_lbs_per_plant: 1.5, runner_production: "High", chill_hours_req: 500, heat_tolerance: "Low",    frost_tolerance: "High",   drought_tolerance: "Low",    disease_resistance: "Gray mold (partial)",                                      disease_susceptibility: "Red stele, Verticillium wilt, Anthracnose, Botrytis, Angular leaf spot", pest_vulnerability: "Spider mites, Aphids, Slugs", best_use: "Fresh / Jam / Commercial", container_ok: true, greenhouse_ok: false },
  { variety_id: 16, common_name: "Eversweet",      scientific_name: "Fragaria × ananassa 'Eversweet'",      usda_zone_min: "4a", usda_zone_max: "9b", temp_min_f: -20, temp_max_f: 100, humidity_pref: "Low",    fertilizer_needs: "Balanced 10-10-10, light regular feeding",               ph_min: 5.8, ph_max: 6.5, soil_type: "Sandy loam, well-drained",               sunlight_req: "Full sun", watering_freq: "1–2 in/week",                           fruit_season: "Everbearing",   days_to_maturity: 60, plant_spacing_in: 12, yield_lbs_per_plant: 1.0, runner_production: "Low",  chill_hours_req: 200, heat_tolerance: "High",   frost_tolerance: "Medium", drought_tolerance: "Medium", disease_resistance: "Botrytis (partial), Leaf diseases",                        disease_susceptibility: "Root rot, Verticillium wilt",                              pest_vulnerability: "Spider mites, Aphids",                 best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 17, common_name: "Camino Real",    scientific_name: "Fragaria × ananassa 'Camino Real'",    usda_zone_min: "5a", usda_zone_max: "9a", temp_min_f: -15, temp_max_f: 95,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, moderate regular feeding",           ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained loam or sandy loam",       sunlight_req: "Full sun", watering_freq: "1–2 in/week",                           fruit_season: "June-bearing",  days_to_maturity: 75, plant_spacing_in: 12, yield_lbs_per_plant: 2.0, runner_production: "High", chill_hours_req: 250, heat_tolerance: "High",   frost_tolerance: "Low",    drought_tolerance: "Low",    disease_resistance: "Verticillium wilt, Phytophthora crown rot, Anthracnose (partial)", disease_susceptibility: "Common leaf spot, Powdery mildew",                      pest_vulnerability: "Lygus bugs, Spider mites, Aphids",     best_use: "Fresh / Commercial", container_ok: true,  greenhouse_ok: true  },
  { variety_id: 18, common_name: "Tribute",        scientific_name: "Fragaria × ananassa 'Tribute'",        usda_zone_min: "4a", usda_zone_max: "8b", temp_min_f: -20, temp_max_f: 85,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, light regular feeding",             ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained loam",                    sunlight_req: "Full sun", watering_freq: "1 in/week",                             fruit_season: "Day-neutral",   days_to_maturity: 90, plant_spacing_in: 12, yield_lbs_per_plant: 1.0, runner_production: "Low",  chill_hours_req: 400, heat_tolerance: "Medium", frost_tolerance: "Medium", drought_tolerance: "Medium", disease_resistance: "Red stele, Verticillium wilt, Leaf diseases",              disease_susceptibility: "Botrytis, Powdery mildew",                                 pest_vulnerability: "Spider mites, Aphids, Tarnished plant bugs", best_use: "Fresh / Jam",   container_ok: true,  greenhouse_ok: true  },
  { variety_id: 19, common_name: "Mara des Bois",  scientific_name: "Fragaria × ananassa 'Mara des Bois'",  usda_zone_min: "4a", usda_zone_max: "9b", temp_min_f: -20, temp_max_f: 95,  humidity_pref: "Medium", fertilizer_needs: "Balanced 10-10-10, light monthly feeding",             ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained, fertile loam",            sunlight_req: "Full sun", watering_freq: "1–2 in/week",                           fruit_season: "Everbearing",   days_to_maturity: 70, plant_spacing_in: 12, yield_lbs_per_plant: 0.75,runner_production: "Low",  chill_hours_req: 400, heat_tolerance: "Medium", frost_tolerance: "Medium", drought_tolerance: "Low",    disease_resistance: "Verticillium wilt, Botrytis (partial)",                    disease_susceptibility: "Powdery mildew, Leaf spot",                                pest_vulnerability: "Spider mites, Aphids",                 best_use: "Fresh / Jam",        container_ok: true,  greenhouse_ok: true  },
  { variety_id: 20, common_name: "Sequoia",        scientific_name: "Fragaria × ananassa 'Sequoia'",        usda_zone_min: "6a", usda_zone_max: "9b", temp_min_f: -10, temp_max_f: 95,  humidity_pref: "Low",    fertilizer_needs: "Balanced 10-10-10, moderate at planting and midseason", ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained sandy loam",              sunlight_req: "Full sun", watering_freq: "1–2 in/week",                           fruit_season: "June-bearing",  days_to_maturity: 75, plant_spacing_in: 12, yield_lbs_per_plant: 1.5, runner_production: "High", chill_hours_req: 200, heat_tolerance: "High",   frost_tolerance: "Low",    drought_tolerance: "Medium", disease_resistance: "Root rot (moderate), Leaf blight",                         disease_susceptibility: "Verticillium wilt, Powdery mildew",                        pest_vulnerability: "Spider mites, Aphids, Lygus bugs",     best_use: "Fresh / Commercial", container_ok: true,  greenhouse_ok: true  },
];

// ─── Prompt builder ─────────────────────────────────────────────────────────────

function buildPrompt() {
  const datasetJSON = JSON.stringify(STRAWBERRY_DATASET, null, 2);

  return `You are an expert strawberry plant agronomist and diagnostics AI assistant.
Your job is to analyze photos of strawberry plants taken by small-scale farmers and return
a structured JSON report in plain English that any farmer can understand.

You have access to the following authoritative strawberry variety dataset (GIS-verified, 2026-03-24):

<dataset>
${datasetJSON}
</dataset>

When given a strawberry plant photo, you must:

1. Identify visual symptoms: leaf color, wilting, spots, powdery residue, stunted growth,
   fruit quality issues, root crown appearance (if visible), pest evidence, etc.

2. Attempt to match the plant to one of the 20 varieties in the dataset based on visual cues
   (leaf shape, fruit color/size, runner density, canopy structure). If confident, use that
   variety's data to enrich your recommendations. If uncertain, state "Unknown / mixed variety"
   and give general strawberry advice.

3. Assess overall health status as exactly one of:
   "Healthy" | "Stressed" | "Diseased" | "Critical"

4. Return ONLY a raw JSON object with EXACTLY this structure (no markdown, no extra text):

{
  "detectedVariety": "Chandler",
  "varietyConfidence": "High",
  "healthStatus": "Stressed",
  "healthSummary": "One or two plain-English sentences summarising what you see.",
  "plantNeeds": {
    "water": "Plain-English watering advice based on visual stress indicators.",
    "sunlight": "Sunlight advice.",
    "spacing": "Spacing/crowding advice.",
    "pruning": "Runner / leaf pruning advice."
  },
  "soilNeeds": {
    "phTarget": "5.8 – 6.5",
    "soilType": "Well-drained sandy loam",
    "amendments": "Plain-English list of amendments to apply.",
    "fertilizer": "What fertilizer to apply and when."
  },
  "careInstructions": [
    "Step 1 as a plain-English sentence.",
    "Step 2 as a plain-English sentence."
  ],
  "alerts": [
    {
      "type": "Disease",
      "name": "Botrytis (gray mold)",
      "severity": "Moderate",
      "action": "Remove infected tissue immediately and apply a copper-based fungicide."
    }
  ],
  "generalTips": "One short paragraph of season-appropriate advice for small-scale farmers.",
  "dataSource": "Strawberry GIS Dataset v2026-03-24"
}

RULES:
- Return ONLY the raw JSON. No markdown fences, no preamble, nothing outside the JSON.
- Use simple language a farmer with no agronomy degree can act on immediately.
- If there are no alerts, return an empty array: "alerts": []
- If the image is not a strawberry plant, set healthStatus to "Unknown" and explain in healthSummary.`;
}

// ─── Main exported function ─────────────────────────────────────────────────────

/**
 * Analyze a strawberry plant image using Google Gemini (free tier).
 *
 * @param {string} base64Image  - Base64-encoded image (JPEG or PNG, no data-URI prefix).
 * @param {string} [apiKey]     - Optional override. Falls back to GEMINI_API_KEY constant.
 * @param {"image/jpeg"|"image/png"} [mediaType] - Defaults to "image/jpeg".
 * @returns {Promise<object>}   - Parsed JSON report object.
 */
async function analyzeStrawberryImage(
  base64Image,
  apiKey = GEMINI_API_KEY,
  mediaType = "image/jpeg"
) {
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error(
      "Gemini API key is missing.\n" +
      "Get your FREE key at: https://aistudio.google.com/app/apikey\n" +
      "Then paste it into GEMINI_API_KEY at the top of strawberryAnalyzer.js"
    );
  }

  const url = `${GEMINI_API_URL}?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mediaType,
              data: base64Image,
            },
          },
          {
            text: buildPrompt(),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,      // Low = more consistent, factual responses
      maxOutputTokens: 1000,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Extract text from Gemini's response structure
  const rawText =
    data?.candidates?.[0]?.content?.parts
      ?.filter((p) => p.text)
      ?.map((p) => p.text)
      ?.join("") ?? "";

  if (!rawText) {
    throw new Error(
      "Gemini returned an empty response. Check your API key and image format."
    );
  }

  // Strip any accidental markdown fences before JSON parsing
  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Return a safe error object so the app never crashes
    return {
      detectedVariety: "Unknown",
      varietyConfidence: "None",
      healthStatus: "Unknown",
      healthSummary:
        "The AI could not produce a valid response. Raw output: " + rawText,
      plantNeeds: {},
      soilNeeds: {},
      careInstructions: [],
      alerts: [],
      generalTips: "",
      dataSource: "Strawberry GIS Dataset v2026-03-24",
      _rawResponse: rawText,
    };
  }
}

// ─── React Native / Expo helper ─────────────────────────────────────────────────

/**
 * Convenience wrapper for React Native apps using expo-image-picker.
 * Pass the local `uri` from the picker result directly — no manual base64 needed.
 *
 * Requires one of:
 *   Expo:    expo install expo-file-system
 *   Bare RN: npm install react-native-fs
 *
 * @param {string} imageUri  - Local file URI from image picker.
 * @param {string} [apiKey]  - Optional API key override.
 * @returns {Promise<object>}
 */
async function analyzeFromUri(imageUri, apiKey = GEMINI_API_KEY) {
  let base64;

  if (typeof require !== "undefined") {
    try {
      // Expo
      const FileSystem = require("expo-file-system");
      base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch {
      try {
        // Bare React Native
        const RNFS = require("react-native-fs");
        base64 = await RNFS.readFile(imageUri, "base64");
      } catch {
        throw new Error(
          "Could not read the image file.\n" +
          "Install expo-file-system (Expo) or react-native-fs (bare RN)."
        );
      }
    }
  } else {
    throw new Error(
      "analyzeFromUri() is for React Native environments only."
    );
  }

  const mediaType = imageUri.toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";

  return analyzeStrawberryImage(base64, apiKey, mediaType);
}

// ─── Exports ────────────────────────────────────────────────────────────────────

module.exports = {
  analyzeStrawberryImage, // Base64 string → report object
  analyzeFromUri,         // File URI      → report object (React Native / Expo)
  STRAWBERRY_DATASET,     // Raw dataset array (useful for UI dropdowns, etc.)
};

// ─── Quick local test (Node.js only) ───────────────────────────────────────────
// Uncomment the lines below and run:  node strawberryAnalyzer.js
//
// const fs = require('fs');
// const img = fs.readFileSync('./test_strawberry.jpg').toString('base64');
// analyzeStrawberryImage(img, 'YOUR_KEY_HERE').then(console.log).catch(console.error);

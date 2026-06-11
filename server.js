/**
 * Granja Node — Backend Server
 * ─────────────────────────────────────────────────────────────────
 * Holds your Gemini API key securely on the server.
 * The browser sends the plant photo here; this server calls Gemini
 * and returns the diagnosis. Users never see your API key.
 *
 * SETUP:
 *   1. npm install
 *   2. Create a .env file:  GEMINI_API_KEY=AIza...
 *   3. node server.js
 */

const express  = require('express');
const multer   = require('multer');
const cors     = require('cors');
const fetch    = require('node-fetch');
require('dotenv').config();

const app    = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB max

app.use(cors());
app.use(express.json());

// Serve the frontend from the /public folder
app.use(express.static('public'));

// ── Strawberry dataset (20 varieties) ───────────────────────────
const STRAWBERRY_DATASET = [
  { variety_id: 1,  common_name: "Chandler",      ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained sandy loam",              watering_freq: "1–2 in/week, drip preferred",        fruit_season: "June-bearing",  fertilizer_needs: "Balanced 10-10-10, slow-release at planting",          disease_resistance: "Botrytis, Leaf scorch",                            disease_susceptibility: "Root rot, Verticillium wilt",                   pest_vulnerability: "Spider mites, Aphids, Slugs"          },
  { variety_id: 2,  common_name: "Albion",         ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained, fertile loam",            watering_freq: "1–2 in/week",                        fruit_season: "Day-neutral",   fertilizer_needs: "Balanced 10-10-10, monthly during fruiting",           disease_resistance: "Verticillium wilt, Phytophthora, Anthracnose",     disease_susceptibility: "Powdery mildew, Botrytis",                      pest_vulnerability: "Spider mites, Aphids, Thrips"          },
  { variety_id: 3,  common_name: "Seascape",       ph_min: 5.5, ph_max: 6.8, soil_type: "Well-drained sandy loam",              watering_freq: "1 in/week, drip preferred",          fruit_season: "Day-neutral",   fertilizer_needs: "Balanced 10-10-10, light monthly feeding",             disease_resistance: "Verticillium wilt, Red stele",                     disease_susceptibility: "Botrytis, Powdery mildew",                      pest_vulnerability: "Spider mites, Aphids"                  },
  { variety_id: 4,  common_name: "Camarosa",       ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained loam or sandy loam",       watering_freq: "1–2 in/week",                        fruit_season: "June-bearing",  fertilizer_needs: "Balanced 10-10-10 at planting, moderate feeding",      disease_resistance: "Verticillium wilt, Phytophthora, Anthracnose",     disease_susceptibility: "Powdery mildew, Common leaf spot",              pest_vulnerability: "Spider mites, Aphids, Lygus bugs"      },
  { variety_id: 5,  common_name: "Sweet Charlie",  ph_min: 5.6, ph_max: 6.6, soil_type: "Well-drained, moist loam",              watering_freq: "1–2 in/week",                        fruit_season: "June-bearing",  fertilizer_needs: "Balanced 10-10-10 at planting, light feeding",         disease_resistance: "Botrytis, Leaf blight",                            disease_susceptibility: "Anthracnose, Root rot",                         pest_vulnerability: "Spider mites, Aphids"                  },
  { variety_id: 6,  common_name: "Ozark Beauty",   ph_min: 5.5, ph_max: 6.8, soil_type: "Well-drained loam",                    watering_freq: "1 in/week",                          fruit_season: "Everbearing",   fertilizer_needs: "Balanced 10-10-10 slow-release",                       disease_resistance: "Gray mold (partial)",                              disease_susceptibility: "Verticillium wilt, Red stele",                  pest_vulnerability: "Spider mites, Aphids, Slugs"           },
  { variety_id: 7,  common_name: "Monterey",       ph_min: 5.5, ph_max: 6.8, soil_type: "Well-drained sandy loam",              watering_freq: "1–2 in/week, drip preferred",        fruit_season: "Day-neutral",   fertilizer_needs: "Balanced 10-10-10, light regular feeding",             disease_resistance: "Verticillium wilt, Red stele, Anthracnose",        disease_susceptibility: "Powdery mildew, Botrytis",                      pest_vulnerability: "Spider mites, Aphids, Thrips"          },
  { variety_id: 8,  common_name: "San Andreas",    ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained, fertile loam",            watering_freq: "1–2 in/week",                        fruit_season: "Day-neutral",   fertilizer_needs: "Balanced 10-10-10, monthly during growing season",     disease_resistance: "Red stele, Verticillium wilt, Leaf spot",          disease_susceptibility: "Botrytis, Powdery mildew",                      pest_vulnerability: "Spider mites, Aphids"                  },
  { variety_id: 9,  common_name: "Earliglow",      ph_min: 5.5, ph_max: 6.5, soil_type: "Rich, well-drained loam",               watering_freq: "1 in/week",                          fruit_season: "June-bearing",  fertilizer_needs: "Balanced 10-10-10 slow-release",                       disease_resistance: "Verticillium wilt, Red stele, Leaf scorch",        disease_susceptibility: "Powdery mildew",                                pest_vulnerability: "Spider mites, Aphids, Slugs"           },
  { variety_id: 10, common_name: "Portola",        ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained, fertile loam",            watering_freq: "1–2 in/week, drip preferred",        fruit_season: "Day-neutral",   fertilizer_needs: "Balanced 10-10-10, monthly during growing season",     disease_resistance: "Verticillium wilt, Phytophthora crown rot",        disease_susceptibility: "Botrytis, Powdery mildew",                      pest_vulnerability: "Spider mites, Thrips, Aphids"          },
  { variety_id: 11, common_name: "Jewel",          ph_min: 5.5, ph_max: 6.5, soil_type: "Loose, well-drained loam",              watering_freq: "1 in/week",                          fruit_season: "June-bearing",  fertilizer_needs: "Balanced 10-10-10, moderate feeding",                  disease_resistance: "Leaf scorch, Leaf blight",                         disease_susceptibility: "Verticillium wilt, Botrytis",                   pest_vulnerability: "Spider mites, Aphids, Slugs"           },
  { variety_id: 12, common_name: "Tristar",        ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained loam",                    watering_freq: "1 in/week",                          fruit_season: "Day-neutral",   fertilizer_needs: "Balanced 10-10-10, light regular feeding",             disease_resistance: "Red stele, Verticillium wilt, Leaf diseases",      disease_susceptibility: "Botrytis, Powdery mildew",                      pest_vulnerability: "Spider mites, Aphids, Tarnished plant bugs"  },
  { variety_id: 13, common_name: "Fort Laramie",   ph_min: 6.0, ph_max: 6.5, soil_type: "Well-drained loam, tolerates varied",   watering_freq: "1 in/week",                          fruit_season: "Everbearing",   fertilizer_needs: "Balanced 10-10-10, light annual feeding",              disease_resistance: "Botrytis (partial), Verticillium wilt (moderate)", disease_susceptibility: "Red stele, Leaf spot",                          pest_vulnerability: "Aphids, Slugs"                         },
  { variety_id: 14, common_name: "Quinault",       ph_min: 5.5, ph_max: 6.5, soil_type: "Moist, well-drained loam",              watering_freq: "1 in/week, keep consistently moist", fruit_season: "Everbearing",   fertilizer_needs: "Balanced 10-10-10, moderate regular feeding",          disease_resistance: "Botrytis (partial)",                               disease_susceptibility: "Verticillium wilt, Leaf diseases",              pest_vulnerability: "Spider mites, Aphids, Slugs"           },
  { variety_id: 15, common_name: "Honeoye",        ph_min: 5.5, ph_max: 6.5, soil_type: "Rich, well-drained loam",               watering_freq: "1 in/week",                          fruit_season: "June-bearing",  fertilizer_needs: "Balanced 10-10-10 slow-release at planting",           disease_resistance: "Gray mold (partial)",                              disease_susceptibility: "Red stele, Verticillium wilt, Anthracnose",     pest_vulnerability: "Spider mites, Aphids, Slugs"           },
  { variety_id: 16, common_name: "Eversweet",      ph_min: 5.8, ph_max: 6.5, soil_type: "Sandy loam, well-drained",              watering_freq: "1–2 in/week",                        fruit_season: "Everbearing",   fertilizer_needs: "Balanced 10-10-10, light regular feeding",             disease_resistance: "Botrytis (partial), Leaf diseases",                disease_susceptibility: "Root rot, Verticillium wilt",                   pest_vulnerability: "Spider mites, Aphids"                  },
  { variety_id: 17, common_name: "Camino Real",    ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained loam or sandy loam",       watering_freq: "1–2 in/week",                        fruit_season: "June-bearing",  fertilizer_needs: "Balanced 10-10-10, moderate regular feeding",          disease_resistance: "Verticillium wilt, Phytophthora, Anthracnose",     disease_susceptibility: "Common leaf spot, Powdery mildew",              pest_vulnerability: "Lygus bugs, Spider mites, Aphids"      },
  { variety_id: 18, common_name: "Tribute",        ph_min: 5.5, ph_max: 6.5, soil_type: "Well-drained loam",                    watering_freq: "1 in/week",                          fruit_season: "Day-neutral",   fertilizer_needs: "Balanced 10-10-10, light regular feeding",             disease_resistance: "Red stele, Verticillium wilt, Leaf diseases",      disease_susceptibility: "Botrytis, Powdery mildew",                      pest_vulnerability: "Spider mites, Aphids, Tarnished plant bugs"  },
  { variety_id: 19, common_name: "Mara des Bois",  ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained, fertile loam",            watering_freq: "1–2 in/week",                        fruit_season: "Everbearing",   fertilizer_needs: "Balanced 10-10-10, light monthly feeding",             disease_resistance: "Verticillium wilt, Botrytis (partial)",            disease_susceptibility: "Powdery mildew, Leaf spot",                     pest_vulnerability: "Spider mites, Aphids"                  },
  { variety_id: 20, common_name: "Sequoia",        ph_min: 5.8, ph_max: 6.5, soil_type: "Well-drained sandy loam",              watering_freq: "1–2 in/week",                        fruit_season: "June-bearing",  fertilizer_needs: "Balanced 10-10-10, moderate at planting and midseason",disease_resistance: "Root rot (moderate), Leaf blight",                 disease_susceptibility: "Verticillium wilt, Powdery mildew",             pest_vulnerability: "Spider mites, Aphids, Lygus bugs"      },
];

function buildPrompt() {
  return `You are an expert strawberry plant agronomist. Analyze the photo and return ONLY a raw JSON object (no markdown, no extra text).

Reference dataset:
${JSON.stringify(STRAWBERRY_DATASET)}

Return exactly this structure:
{
  "detectedVariety": "variety name or Unknown",
  "varietyConfidence": "High|Medium|Low",
  "healthStatus": "Healthy|Stressed|Diseased|Critical|Unknown",
  "healthSummary": "1-2 plain-English sentences about what you see.",
  "plantNeeds": {
    "water": "watering advice",
    "sunlight": "sunlight advice",
    "spacing": "spacing advice",
    "pruning": "pruning/runner advice"
  },
  "soilNeeds": {
    "phTarget": "e.g. 5.8 – 6.5",
    "soilType": "soil type",
    "amendments": "amendment advice",
    "fertilizer": "fertilizer advice"
  },
  "careInstructions": ["step 1", "step 2", "step 3"],
  "alerts": [{"type":"Disease|Pest|Nutrient|Other","name":"name","severity":"Low|Moderate|High|Critical","action":"what to do"}],
  "generalTips": "one paragraph of seasonal advice for small-scale farmers.",
  "dataSource": "Strawberry GIS Dataset v2026-03-24"
}
Rules: plain English, farmer-friendly, no markdown, only raw JSON.`;
}

// ── POST /analyze ────────────────────────────────────────────────
app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server is missing GEMINI_API_KEY. Check your .env file.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded.' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType    = req.file.mimetype || 'image/jpeg';

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: buildPrompt() }
            ]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1200 }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      const msg = err?.error?.message || `Gemini API error ${geminiRes.status}`;
      return res.status(502).json({ error: msg });
    }

    const data    = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') ?? '';

    if (!rawText) {
      return res.status(502).json({ error: 'Gemini returned an empty response.' });
    }

    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const report  = JSON.parse(cleaned);

    return res.json(report);

  } catch (err) {
    console.error('Error in /analyze:', err.message);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Granja Node server running at http://localhost:${PORT}`);
});

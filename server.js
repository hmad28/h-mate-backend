import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// === INISIALISASI ===
const app = express();
const PORT = process.env.PORT || 3000;

// Validasi GEMINI_API_KEY
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY tidak ditemukan!");
  console.error("Set environment variable GEMINI_API_KEY di Railway");
  process.exit(1); // Stop server kalau API key ga ada
}

console.log("✅ GEMINI_API_KEY terdeteksi");

// Inisialisasi Gemini AI
let ai;
try {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  console.log("✅ GoogleGenAI initialized successfully");
} catch (error) {
  console.error("❌ ERROR initializing GoogleGenAI:", error);
  process.exit(1);
}

// === MIDDLEWARE ===
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  })
);
app.use(express.json());

// === HELPER FUNCTION ===
async function generateAIContent(prompt, systemInstruction, isJSON = false) {
  try {
    const config = {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 8192, // Increase significantly to prevent truncation
    };

    // Only set responseMimeType for JSON responses
    if (isJSON) {
      config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Sesuaikan dengan API key Anda
      contents: [{ text: prompt }],
      config: config,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Gagal berkomunikasi dengan AI");
  }
}

// // STRATEGI PARSING YANG LEBIH ROBUST
// function safeJSONParse(text) {
//   // Log untuk debugging
//   console.log("🔍 Parsing AI response...");
//   console.log("Length:", text.length);
  
//   try {
//     // STEP 1: Bersihkan markdown code blocks
//     let cleaned = text
//       .replace(/```json\n?/gi, "")
//       .replace(/```\n?/g, "")
//       .trim();

//     // STEP 2: Coba parse langsung
//     const parsed = JSON.parse(cleaned);
//     console.log("✅ Direct parse successful");
//     return parsed;
    
//   } catch (error) {
//     console.warn("⚠️ Direct parse failed, trying fallbacks...");
    
//     // FALLBACK 1: Ekstrak JSON dari text
//     try {
//       // Cari object JSON terbesar
//       const jsonMatch = text.match(/\{[\s\S]*\}/);
//       if (jsonMatch) {
//         const parsed = JSON.parse(jsonMatch[0]);
//         console.log("✅ Fallback 1 successful (regex extraction)");
//         return parsed;
//       }
//     } catch (e) {
//       console.warn("⚠️ Fallback 1 failed");
//     }

//     // FALLBACK 2: Cari array questions di dalam text
//     try {
//       const questionsMatch = text.match(/"questions"\s*:\s*\[[\s\S]*\]/);
//       if (questionsMatch) {
//         const questionsStr = questionsMatch[0];
//         const parsed = JSON.parse(`{${questionsStr}}`);
//         console.log("✅ Fallback 2 successful (questions extraction)");
//         return parsed;
//       }
//     } catch (e) {
//       console.warn("⚠️ Fallback 2 failed");
//     }

//     // FALLBACK 3: Log dan throw error
//     console.error("❌ All parsing strategies failed");
//     console.log("Preview (first 500 chars):", text.substring(0, 500));
//     console.log("Preview (last 200 chars):", text.substring(text.length - 200));
    
//     throw new Error("Format respons AI tidak valid. Silakan coba lagi.");
//   }
// }

// // VALIDASI YANG LEBIH KETAT
// function validateQuestions(questions) {
//   if (!Array.isArray(questions)) {
//     console.error("❌ Questions is not an array:", typeof questions);
//     return [];
//   }

//   const validated = questions.filter((q, index) => {
//     // Validasi struktur dasar
//     if (!q.question || typeof q.question !== 'string') {
//       console.warn(`⚠️ Q${index + 1}: Invalid question text`);
//       return false;
//     }

//     if (!q.options || !Array.isArray(q.options)) {
//       console.warn(`⚠️ Q${index + 1}: Invalid options array`);
//       return false;
//     }

//     if (q.options.length !== 4) {
//       console.warn(`⚠️ Q${index + 1}: Expected 4 options, got ${q.options.length}`);
//       return false;
//     }

//     // Validasi setiap opsi
//     const validOptions = q.options.every(opt => {
//       const isValid = opt.text && 
//                      opt.text.trim().length > 0 && 
//                      opt.value &&
//                      typeof opt.text === 'string' &&
//                      typeof opt.value === 'string';
      
//       if (!isValid) {
//         console.warn(`⚠️ Q${index + 1}: Invalid option:`, opt);
//       }
      
//       return isValid;
//     });

//     if (!validOptions) {
//       console.warn(`⚠️ Q${index + 1}: Has invalid options`);
//       return false;
//     }

//     return true;
//   });

//   console.log(`✅ Validated ${validated.length}/${questions.length} questions`);
//   return validated;
// }

// EXPORT FUNCTIONS
// module.exports = { safeJSONParse, validateQuestions };

// === ROUTES ===

// 1. UPDATE: Chat Konsultasi Karier
app.post("/api/konsultasi", async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      success: false,
      message: "Pesan harus berupa string dan tidak boleh kosong",
      data: null,
    });
  }

  try {
    const systemInstruction = `
Kamu adalah H-Mate AI Assistant yang dibuat oleh Hammad, seorang developer muda untuk generasi muda Indonesia.

IDENTITAS:
- Nama: H-Mate AI Assistant
- Dibuat oleh: Hammad
- Tujuan: Membantu generasi muda Indonesia menemukan arah karier yang tepat

TUGAS UTAMA:
- Berikan saran karier yang praktis, realistis, dan relevan dengan kondisi Indonesia
- Fokus pada SEMUA bidang karier (tidak hanya digital/teknologi)
- Gunakan bahasa yang friendly tapi tetap informatif
- Berikan contoh konkret dan actionable steps
- Dorong user untuk eksplorasi minat mereka

TOPIK YANG KAMU KUASAI:
1. Karier Teknologi & Digital: Developer, Data Scientist, UI/UX Designer, dll
2. Karier Kesehatan: Dokter, Perawat, Apoteker, Terapis, dll
3. Karier Hukum & Keamanan: Hakim, Jaksa, Polisi, Tentara, Lawyer, dll
4. Karier Pendidikan: Guru, Dosen, Peneliti, Instruktur, dll
5. Karier Bisnis: Marketing, Finance, HR, Entrepreneur, dll
6. Karier Kreatif: Designer, Penulis, Fotografer, Musisi, dll
7. Karier Teknik: Sipil, Mesin, Elektro, Arsitektur, dll
8. Karier Pertanian & Peternakan: Agronomis, Peternak, Food Scientist, dll
9. Karier Sosial: Psikolog, Social Worker, NGO Worker, dll
10. Karier Blue Collar: Chef, Teknisi, Mekanik, Tukang, dll

TIPS EKSPLORASI KARIER:
- Tanyakan tentang mata pelajaran favorit
- Tanyakan preferensi kerja indoor vs outdoor
- Tanyakan apakah suka bekerja dengan orang atau sendiri
- Tanyakan tentang hobi dan passion
- Tanyakan tentang nilai hidup yang penting bagi mereka

GAYA KOMUNIKASI:
- Ramah seperti kakak tingkat yang berpengalaman
- Hindari jargon yang terlalu teknis kecuali diminta
- Berikan motivasi tanpa terdengar menggurui
- Maksimal 3-4 paragraf per jawaban agar mudah dibaca

BATASAN:
- Jangan memberikan medical/legal advice spesifik
- Jika ditanya hal di luar karier/edukasi, arahkan kembali ke topik
- Akui jika tidak tahu dan tawarkan alternatif
- Jika ditanya siapa pembuatmu, jawab dengan jawaban yang bervariasi namun dengan inti: "Aku H-Mate AI Assistant yang dibuat oleh Hammad untuk membantu generasi muda Indonesia menemukan arah karier yang tepat! 😊"

Jawab dalam Bahasa Indonesia yang natural dan enak dibaca.
`;

    let fullPrompt = message;
    if (history && Array.isArray(history) && history.length > 0) {
      const conversationContext = history
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n");
      fullPrompt = `${conversationContext}\nUser: ${message}`;
    }

    const aiResponse = await generateAIContent(
      fullPrompt,
      systemInstruction,
      false
    );

    res.status(200).json({
      success: true,
      message: "Berhasil mendapat respons",
      data: {
        response: aiResponse,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error di /api/konsultasi:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan pada server",
      data: null,
    });
  }
});

// ============================================
// COMPLETE ENHANCED QUESTION GENERATION SYSTEM
// Copy SEMUA kode ini ke backend/server.js
// ============================================

// ============================================
// ENDPOINT: GENERATE QUESTIONS
// ============================================

app.post("/api/generate-questions", async (req, res) => {
  const { questionCount = 25, userAge } = req.body;

  try {
    // Generate UNIQUE random seed
    const randomSeed = Math.floor(Math.random() * 1000000);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const uniqueId = `${randomSeed}-${timestamp}-${randomStr}`;
    
    // Determine age group
    let ageGroup, ageContext, languageLevel, exampleQuestions;
    
    if (!userAge || userAge <= 15) {
      ageGroup = "SMP";
      ageContext = "User adalah siswa SMP (12-15 tahun)";
      languageLevel = `BAHASA: SANGAT SEDERHANA
- Pakai kata sehari-hari: suka, senang, main, belajar, kerja
- HINDARI: produktif, efisien, optimal, preferensi
- Pertanyaan MAX 15 kata, opsi MAX 10 kata`;
      
      exampleQuestions = `
CONTOH BAGUS (SMP):
"Kalau weekend, kamu lebih suka ngapain?"
A. Main bareng temen di luar
B. Santai di rumah sendiri  
C. Belajar hal baru
D. Olahraga atau aktivitas fisik`;
      
    } else if (userAge <= 18) {
      ageGroup = "SMA";
      ageContext = "User adalah siswa SMA (16-18 tahun)";
      languageLevel = `BAHASA: SANTAI TAPI MATURE
- Boleh pakai istilah umum tapi tetap jelas
- Lebih formal dari SMP tapi tetap casual
- Pertanyaan MAX 20 kata, opsi MAX 12 kata`;
      
      exampleQuestions = `
CONTOH BAGUS (SMA):
"Environment kerja yang bikin kamu paling produktif:"
A. Office dengan struktur jelas
B. Outdoor atau field work
C. Remote/WFH yang fleksibel
D. Co-working space yang vibrant`;
      
    } else {
      ageGroup = "MAHASISWA";
      ageContext = "User adalah mahasiswa/profesional (19+ tahun)";
      languageLevel = `BAHASA: PROFESIONAL FRIENDLY
- Boleh pakai terminologi karir
- Semi-formal tapi approachable
- Pertanyaan bisa lebih kompleks`;
      
      exampleQuestions = `
CONTOH BAGUS (MAHASISWA):
"Collaboration style yang cocok dengan kamu:"
A. Agile team dengan daily standups
B. Independent dengan weekly sync
C. Cross-functional team projects
D. Solo contributor dengan clear goals`;
    }
    
    const systemInstruction = `Kamu adalah H-Mate AI (dibuat oleh Hammad), expert career advisor.

🎯 MISSION: Generate ${questionCount} pertanyaan tes minat bakat yang FRESH, UNIK, dan VALID untuk career matching

🔑 UNIQUE SEED: ${uniqueId}
👤 TARGET: ${ageGroup}
📝 ${ageContext}

${languageLevel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 KATEGORI PERTANYAAN (distribusi merata):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. WORK ENVIRONMENT (25%)
2. INTERACTION STYLE (25%)
3. PROBLEM SOLVING (20%)
4. STRESS & PRESSURE (15%)
5. VALUES & MOTIVATION (15%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CRITICAL OUTPUT REQUIREMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HARUS OUTPUT PURE JSON - TIDAK BOLEH ADA TEXT LAIN!

FORMAT WAJIB:
{
  "questions": [
    {
      "id": 1,
      "question": "Pertanyaan UNIK dan REFLEKTIF",
      "options": [
        { "value": "A", "text": "Opsi JELAS dan BERBEDA" },
        { "value": "B", "text": "Opsi JELAS dan BERBEDA" },
        { "value": "C", "text": "Opsi JELAS dan BERBEDA" },
        { "value": "D", "text": "Opsi JELAS dan BERBEDA" }
      ]
    }
  ]
}

JANGAN:
- ❌ Tulis penjelasan di luar JSON
- ❌ Pakai markdown code blocks
- ❌ Tambahkan komentar
- ❌ Tulis "Berikut pertanyaannya:" atau teks lain

LANGSUNG OUTPUT JSON SAJA!

${exampleQuestions}

PENTING: 
- Semua ${questionCount} pertanyaan HARUS lengkap
- Setiap pertanyaan HARUS punya 4 opsi
- Semua field wajib terisi
- Output HANYA JSON, tidak ada text lain`;

    const prompt = `Generate ${questionCount} pertanyaan tes minat bakat.

SEED: ${uniqueId}
TARGET: ${ageGroup}

CRITICAL: Output ONLY valid JSON, no other text!

Format:
{"questions":[{"id":1,"question":"...","options":[{"value":"A","text":"..."},{"value":"B","text":"..."},{"value":"C","text":"..."},{"value":"D","text":"..."}]}]}

Generate NOW!`;

    console.log(`🚀 Generating ${questionCount} questions for ${ageGroup}...`);
    console.log(`   Seed: ${uniqueId}`);

    // Call AI with retry mechanism
    let aiResponse;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`   📡 Attempt ${attempt}/${maxAttempts}...`);

      try {
        aiResponse = await generateAIContent(prompt, systemInstruction, true);
        
        // Validasi response tidak kosong
        if (!aiResponse || aiResponse.trim().length === 0) {
          throw new Error("Empty AI response");
        }

        console.log(`   ✅ Got AI response (${aiResponse.length} chars)`);
        break;
      } catch (error) {
        console.error(`   ❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxAttempts) {
          throw new Error("Failed to get valid AI response after multiple attempts");
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Parse response dengan fallback yang robust
    console.log("🔍 Parsing AI response...");
    const parsedResponse = safeJSONParse(aiResponse);

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      console.error("❌ Invalid response structure:", parsedResponse);
      throw new Error("Response structure invalid - missing questions array");
    }

    // Validate dan filter questions
    console.log("✔️ Validating questions...");
    const validQuestions = validateQuestions(parsedResponse.questions);

    if (validQuestions.length === 0) {
      throw new Error("No valid questions generated");
    }

    console.log(`✅ Generation successful:`);
    console.log(`   Valid: ${validQuestions.length}/${questionCount}`);
    console.log(`   Age: ${userAge || 'default'} (${ageGroup})`);

    // Jika kurang dari target, log warning tapi tetap return
    if (validQuestions.length < questionCount) {
      console.warn(`⚠️ Generated only ${validQuestions.length}/${questionCount} questions`);
    }

    // PASTIKAN ID sequential
    const questionsWithId = validQuestions.map((q, index) => ({
      ...q,
      id: index + 1
    }));

    res.status(200).json({
      success: true,
      message: "Questions generated successfully",
      data: { 
        questions: questionsWithId,
        metadata: {
          seed: randomSeed,
          uniqueId: uniqueId,
          ageGroup: ageGroup,
          timestamp: timestamp,
          generated: questionsWithId.length,
          requested: questionCount
        }
      },
    });
    
  } catch (error) {
    console.error("❌ Generate questions error:", error.message);
    console.error("   Stack:", error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate questions",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      data: null,
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function safeJSONParse(text) {
  console.log("   🔍 Parsing...");
  
  try {
    // STEP 1: Bersihkan markdown
    let cleaned = text
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();

    // STEP 2: Parse langsung
    const parsed = JSON.parse(cleaned);
    console.log("   ✅ Direct parse successful");
    return parsed;
    
  } catch (error) {
    console.warn("   ⚠️ Direct parse failed, trying fallbacks...");
    
    // FALLBACK 1: Ekstrak JSON dari text
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("   ✅ Fallback 1 successful (JSON extraction)");
        return parsed;
      }
    } catch (e) {
      console.warn("   ⚠️ Fallback 1 failed");
    }

    // FALLBACK 2: Ekstrak questions array
    try {
      const questionsMatch = text.match(/"questions"\s*:\s*\[[\s\S]*\]/);
      if (questionsMatch) {
        const parsed = JSON.parse(`{${questionsMatch[0]}}`);
        console.log("   ✅ Fallback 2 successful (questions array extraction)");
        return parsed;
      }
    } catch (e) {
      console.warn("   ⚠️ Fallback 2 failed");
    }

    // Log error detail
    console.error("   ❌ All parsing attempts failed");
    console.log("   Response preview:", text.substring(0, 200) + "...");
    
    throw new Error("Invalid AI response format - cannot parse JSON");
  }
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) {
    console.error("❌ Questions is not array:", typeof questions);
    return [];
  }

  const validated = questions.filter((q, index) => {
    // Check question
    if (!q.question || typeof q.question !== 'string' || q.question.trim().length === 0) {
      console.warn(`⚠️ Q${index + 1}: Invalid question`);
      return false;
    }

    // Check options array
    if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
      console.warn(`⚠️ Q${index + 1}: Invalid options count (${q.options?.length || 0}/4)`);
      return false;
    }

    // Check each option
    const validOptions = q.options.every((opt, optIdx) => {
      if (!opt.text || typeof opt.text !== 'string' || opt.text.trim().length === 0) {
        console.warn(`⚠️ Q${index + 1} Option ${optIdx + 1}: Empty text`);
        return false;
      }
      if (!opt.value || typeof opt.value !== 'string') {
        console.warn(`⚠️ Q${index + 1} Option ${optIdx + 1}: Invalid value`);
        return false;
      }
      return true;
    });

    if (!validOptions) {
      console.warn(`⚠️ Q${index + 1}: Has invalid options`);
      return false;
    }

    return true;
  });

  console.log(`   ✅ Validated ${validated.length}/${questions.length} questions`);
  return validated;
}

// ============================================
// ENDPOINT: ANALYZE RESULTS
// ============================================

app.post("/api/analyze-results", async (req, res) => {
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid answers data",
      data: null,
    });
  }

  try {
    const systemInstruction = `Kamu adalah H-Mate AI (dibuat oleh Hammad), expert career advisor.

🎯 MISSION: Analisis tes minat bakat dan berikan rekomendasi TEPAT dari 100+ profesi

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "personality_type": "Tipe (2-3 kata)",
  "description": "Deskripsi singkat (MAX 200 karakter)",
  "recommended_careers": [
    {
      "title": "Nama Profesi",
      "match_percentage": 85,
      "reason": "Alasan spesifik (MAX 150 karakter)",
      "skills_needed": ["Skill 1", "Skill 2", "Skill 3"]
    }
  ],
  "strengths": ["Kekuatan 1", "Kekuatan 2", "Kekuatan 3", "Kekuatan 4"],
  "development_areas": ["Area 1", "Area 2", "Area 3"],
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}

CRITICAL: Output PURE JSON tanpa markdown atau text lain!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ KRITERIA KETAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. REKOMENDASI (5 karir):
   ✅ HARUS dari MINIMAL 4 sektor berbeda
   ✅ Match % realistis (80-98% top, 65-79% others)
   ✅ Reason SPESIFIK ke jawaban (tidak generic)
   ✅ Skills KONKRET (tidak "komunikasi baik")

2. PERSONALITY TYPE (pilih berdasarkan dominant traits):
   "Natural Leader" | "Analytical Thinker" | "Creative Innovator"
   "Compassionate Helper" | "Technical Problem Solver"
   "Hands-on Doer" | "Strategic Planner" | "Social Communicator"

3. DIVERSITY: Pastikan 5 karir dari MINIMAL 4 sektor berbeda (Tech, Creative, Medical, Business, Education, Law, dll)

PENTING: Analisis harus AKURAT berdasarkan jawaban user!`;

    const answersText = answers
      .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.selectedOption.text}`)
      .join("\n\n");

    const prompt = `Analisis hasil tes ini dan berikan rekomendasi TEPAT dan BERAGAM dari 100+ profesi:

${answersText}

CRITICAL:
1. 5 karir dari MINIMAL 4 sektor berbeda
2. Reason SPESIFIK ke jawaban user
3. Match % realistis
4. Skills KONKRET
5. Output PURE JSON

Analyze NOW!`;

    console.log("🔬 Analyzing test results...");
    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    
    console.log("🔍 Parsing analysis...");
    const parsedResponse = safeJSONParse(aiResponse);

    if (!parsedResponse.personality_type || !parsedResponse.recommended_careers || 
        parsedResponse.recommended_careers.length < 5) {
      throw new Error("Incomplete analysis response");
    }

    // Validate diversity
    const getSector = (title) => {
      const t = title.toLowerCase();
      if (t.includes('engineer') || t.includes('developer') || t.includes('data') || 
          t.includes('cyber') || t.includes('software')) return 'tech';
      if (t.includes('designer') || t.includes('creative') || t.includes('artist')) return 'creative';
      if (t.includes('dokter') || t.includes('nurse') || t.includes('psikolog')) return 'medical';
      if (t.includes('business') || t.includes('manager') || t.includes('entrepreneur')) return 'business';
      if (t.includes('guru') || t.includes('teacher') || t.includes('dosen')) return 'education';
      if (t.includes('polisi') || t.includes('tentara') || t.includes('pengacara')) return 'law';
      return 'other';
    };

    const sectors = parsedResponse.recommended_careers.map(c => getSector(c.title));
    const uniqueSectors = new Set(sectors);
    
    console.log(`✅ Analysis complete:`);
    console.log(`   ${parsedResponse.recommended_careers.length} careers`);
    console.log(`   ${uniqueSectors.size} sectors: ${Array.from(uniqueSectors).join(', ')}`);
    
    if (uniqueSectors.size < 3) {
      console.warn(`⚠️ Low diversity: only ${uniqueSectors.size} sectors`);
    }

    res.status(200).json({
      success: true,
      message: "Analysis successful",
      data: parsedResponse,
    });
    
  } catch (error) {
    console.error("❌ Analyze error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Analysis failed",
      data: null,
    });
  }
});

// ============================================
// NOTES
// ============================================

/*
FEATURES:
✅ Fresh AI generation (unique seed setiap kali)
✅ Age-appropriate language (SMP/SMA/Mahasiswa)
✅ 100+ career database
✅ Diverse recommendations (multi-sector)
✅ Trait-to-career mapping
✅ Validation & logging

TESTING:
POST /api/generate-questions
{ "questionCount": 20, "userAge": 14 } // SMP
{ "questionCount": 20, "userAge": 17 } // SMA
{ "questionCount": 20, "userAge": 21 } // Mahasiswa

POST /api/analyze-results
{ "answers": [...] }

IMPROVEMENTS vs OLD VERSION:
1. Unique seed generation (random + timestamp + string)
2. Comprehensive 100+ career list
3. Diversity enforcement & validation
4. Age-appropriate examples
5. Strict rules for quality
6. Logging for monitoring
*/

// ====================================================
// TAMBAHKAN INI DI server.js SETELAH ENDPOINT ANALYZE-RESULTS
// ====================================================

// 4. UPDATE: Generate Mini Test
app.post("/api/roadmap/mini-test", async (req, res) => {
  const { questionCount = 15 } = req.body;

  console.log(`📝 Generate mini test (${questionCount} questions)...`);

  try {
    const systemInstruction = `
      Kamu adalah H-Mate AI (dibuat oleh Hammad), pembuat tes minat bakat CEPAT untuk menentukan arah karier dari SEMUA bidang.

      TUGAS:
      Generate ${questionCount} pertanyaan singkat dan to-the-point untuk mengetahui minat karier seseorang.

      OUTPUT HARUS BERUPA JSON VALID:
      {
        "questions": [
          {
            "id": 1,
            "question": "Pertanyaan singkat dan jelas",
            "options": [
              { "value": "A", "text": "Opsi A", "category": "technical" },
              { "value": "B", "text": "Opsi B", "category": "health" },
              { "value": "C", "text": "Opsi C", "category": "education" },
              { "value": "D", "text": "Opsi D", "category": "creative" }
            ]
          }
        ]
      }

      KRITERIA:
      - Pertanyaan harus SINGKAT (max 15 kata)
      - Fokus pada: tipe pekerjaan, skill preference, work environment, subject preference
      - Setiap opsi punya category dari: "technical", "health", "law", "education", "engineering", "creative", "business", "agriculture", "social", "service"
      - Bahasa Indonesia yang casual dan mudah dipahami
      - Pertanyaan variatif mencakup SEMUA bidang

      Contoh pertanyaan bagus:
      - "Kamu lebih suka bekerja dengan?"
      - "Lingkungan kerja ideal kamu?"
      - "Mata pelajaran favorit?"
      - "Aktivitas yang paling kamu nikmati?"
      - "Kamu lebih suka indoor atau outdoor?"

      PENTING: 
      - Output HANYA JSON, tanpa teks tambahan
      - JANGAN fokus hanya ke teknologi, variasikan ke semua bidang
      `;

    const prompt = `Buatkan ${questionCount} pertanyaan mini test untuk menentukan arah karier dari SEMUA bidang (teknologi, kesehatan, hukum, pendidikan, dll). Output JSON.`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    const parsedResponse = safeJSONParse(aiResponse);

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error("Struktur respons tidak sesuai format");
    }

    console.log(
      `✅ Generated ${parsedResponse.questions.length} mini test questions`
    );

    res.status(200).json({
      success: true,
      message: "Berhasil generate mini test",
      data: parsedResponse,
    });
  } catch (error) {
    console.error("Error di /api/roadmap/mini-test:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal membuat mini test",
      data: null,
    });
  }
});

// 5. UPDATE: Analyze Mini Test
app.post("/api/roadmap/analyze-mini-test", async (req, res) => {
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Data jawaban tidak valid",
      data: null,
    });
  }

  console.log(`🔍 Analyzing mini test (${answers.length} answers)...`);

  try {
    const systemInstruction = `
Kamu adalah H-Mate AI (dibuat oleh Hammad), developer muda yang menentukan job recommendation dari SEMUA bidang berdasarkan jawaban singkat.

TUGAS:
Analisis jawaban mini test dan berikan 5 rekomendasi karier yang paling cocok dari BERBAGAI bidang.

OUTPUT HARUS BERUPA JSON VALID:
{
  "recommendedJobs": [
    {
      "title": "Nama Profesi",
      "match_score": 90,
      "reason": "Alasan singkat kenapa cocok (1 kalimat)",
      "type": "technical/health/law/education/engineering/creative/business/agriculture/social/service"
    }
  ],
  "summary": "Ringkasan singkat kepribadian kerja user (2-3 kalimat)",
  "strengths": ["Kekuatan 1", "Kekuatan 2", "Kekuatan 3"]
}

KRITERIA:
- Berikan TEPAT 5 rekomendasi job
- PENTING: Job harus dari BERBAGAI bidang, tidak hanya teknologi
- Pertimbangkan semua sektor: Teknologi, Kesehatan, Hukum, Pendidikan, Teknik, Bisnis, Kreatif, Pertanian, Sosial, dll
- Job harus realistis untuk Indonesia
- Match score berdasarkan kecocokan jawaban
- Reason harus singkat dan jelas
- Summary harus motivational tapi realistis

CONTOH REKOMENDASI YANG BAIK:
- Kalau user suka science & membantu orang → Dokter, Apoteker, Peneliti Biomedis
- Kalau user suka outdoor & alam → Peternak, Ahli Pertanian, Surveyor
- Kalau user suka problem solving & keadilan → Pengacara, Hakim, Polisi
- Kalau user kreatif & detail → Arsitek, Designer, Penulis

PENTING: 
- Output HANYA JSON, tanpa teks tambahan
- Sesuaikan dengan jawaban user, jangan paksa ke teknologi
`;

    const answersText = answers
      .map(
        (answer, index) =>
          `Q${index + 1}: ${answer.question}\nJawaban: ${
            answer.selectedOption.text
          } (category: ${answer.selectedOption.category || "unknown"})`
      )
      .join("\n\n");

    const prompt = `Analisis mini test berikut dan berikan 3 rekomendasi karier dari BERBAGAI bidang (bukan hanya teknologi):\n\n${answersText}`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    const parsedResponse = safeJSONParse(aiResponse);

    if (
      !parsedResponse.recommendedJobs ||
      !Array.isArray(parsedResponse.recommendedJobs)
    ) {
      throw new Error("Struktur respons tidak sesuai format");
    }

    console.log(
      `✅ Recommended: ${parsedResponse.recommendedJobs
        .map((j) => j.title)
        .join(", ")}`
    );

    res.status(200).json({
      success: true,
      message: "Analisis mini test berhasil",
      data: parsedResponse,
    });
  } catch (error) {
    console.error("Error di /api/roadmap/analyze-mini-test:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal menganalisis mini test",
      data: null,
    });
  }
});

// 6. ENDPOINT: Generate Roadmap
app.post("/api/roadmap/generate", async (req, res) => {
  const { targetRole, currentStatus, hasGoal, existingSkills = [] } = req.body;

  if (!targetRole || !currentStatus) {
    return res.status(400).json({
      success: false,
      message: "targetRole dan currentStatus wajib diisi",
      data: null,
    });
  }

  console.log(`🗺️ Generating roadmap for: ${targetRole} (${currentStatus})...`);

  try {
    const systemInstruction = `
Kamu adalah career advisor yang membuat roadmap karier terstruktur.

TUGAS:
Buat roadmap karier lengkap untuk mencapai posisi: ${targetRole}

Status user: ${currentStatus}
Skill yang sudah dimiliki: ${
      existingSkills.length > 0 ? existingSkills.join(", ") : "Belum ada"
    }

OUTPUT HARUS BERUPA JSON VALID:
{
  "title": "${targetRole} Career Roadmap",
  "overview": "Ringkasan singkat roadmap (2-3 kalimat)",
  "estimatedTime": "Total waktu estimasi (contoh: 12-18 bulan)",
  "phases": [
    {
      "phase": "Phase 1: Foundation",
      "duration": "3-4 bulan",
      "description": "Deskripsi singkat fase ini",
      "skills": ["Skill 1", "Skill 2", "Skill 3"],
      "learningResources": [
        {
          "name": "Nama resource/course",
          "type": "course/book/tutorial",
          "link": "URL (atau 'search online' kalau ga ada link spesifik)"
        }
      ],
      "certifications": [
        {
          "name": "Nama sertifikasi",
          "provider": "Provider (Google, Meta, dll)",
          "priority": "high/medium/low"
        }
      ],
      "milestones": ["Milestone 1", "Milestone 2"]
    }
  ],
  "careerTips": [
    "Tips karier 1",
    "Tips karier 2",
    "Tips karier 3"
  ]
}

KRITERIA:
- Roadmap harus punya 3-5 phases
- Setiap phase durasi realistis (2-6 bulan)
- Skills berurutan dari fundamental ke advanced
- Learning resources prioritaskan yang gratis/freemium
- Certifications relevan dengan industri Indonesia
- Milestones konkret dan measurable
- Career tips praktis dan actionable

PENTING: Output HANYA JSON, tanpa teks tambahan.
`;

    const prompt = `Buatkan roadmap karier lengkap untuk ${targetRole}. User adalah ${currentStatus}. ${
      existingSkills.length > 0
        ? `Skill yang sudah dimiliki: ${existingSkills.join(", ")}.`
        : ""
    } Output JSON.`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    const parsedResponse = safeJSONParse(aiResponse);

    if (!parsedResponse.phases || !Array.isArray(parsedResponse.phases)) {
      throw new Error("Struktur respons tidak sesuai format");
    }

    console.log(`✅ Roadmap generated: ${parsedResponse.phases.length} phases`);

    res.status(200).json({
      success: true,
      message: "Roadmap berhasil digenerate",
      data: parsedResponse,
    });
  } catch (error) {
    console.error("Error di /api/roadmap/generate:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal generate roadmap",
      data: null,
    });
  }
});

// 7. ENDPOINT: Get Next Steps
app.post("/api/roadmap/next-steps", async (req, res) => {
  const { roadmap, completedPhases = [], currentSkills = [] } = req.body;

  if (!roadmap || !roadmap.phases) {
    return res.status(400).json({
      success: false,
      message: "Data roadmap tidak valid",
      data: null,
    });
  }

  console.log(
    `📍 Getting next steps (completed: ${completedPhases.length} phases)...`
  );

  try {
    const systemInstruction = `
Kamu adalah career mentor yang memberikan guidance untuk langkah selanjutnya.

TUGAS:
Berdasarkan roadmap dan progress user, berikan langkah-langkah konkret selanjutnya.

OUTPUT HARUS BERUPA JSON VALID:
{
  "currentPhase": "Nama fase saat ini",
  "progressPercentage": 45,
  "nextSteps": [
    {
      "step": "Langkah spesifik yang harus dilakukan",
      "priority": "high/medium/low",
      "estimatedTime": "Waktu estimasi"
    }
  ],
  "recommendedCertifications": [
    {
      "name": "Nama sertifikat",
      "reason": "Kenapa penting sekarang",
      "urgency": "high/medium/low"
    }
  ],
  "skillGaps": ["Skill yang masih perlu dipelajari"],
  "motivationalMessage": "Pesan motivasi singkat (2-3 kalimat)"
}

KRITERIA:
- Next steps harus konkret dan actionable (bukan generic)
- Prioritaskan berdasarkan phase saat ini
- Sertifikasi yang direkomendasi relevan dengan progress
- Skill gaps spesifik, bukan umum
- Motivational message personal dan encouraging

PENTING: Output HANYA JSON, tanpa teks tambahan.
`;

    const roadmapSummary = JSON.stringify({
      title: roadmap.title,
      phases: roadmap.phases.map((p, idx) => ({
        index: idx,
        phase: p.phase,
        completed: completedPhases.includes(idx),
      })),
    });

    const prompt = `User sedang mengikuti roadmap berikut:\n${roadmapSummary}\n\nSkill yang sudah dimiliki: ${
      currentSkills.join(", ") || "Belum ada"
    }.\n\nBerikan next steps dan rekomendasi. Output JSON.`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    const parsedResponse = safeJSONParse(aiResponse);

    console.log(`✅ Next steps generated`);

    res.status(200).json({
      success: true,
      message: "Next steps berhasil digenerate",
      data: parsedResponse,
    });
  } catch (error) {
    console.error("Error di /api/roadmap/next-steps:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal generate next steps",
      data: null,
    });
  }
});

// 8. UPDATE: Roadmap Consultation
app.post("/api/roadmap/consultation", async (req, res) => {
  const { message, context } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      success: false,
      message: "Pesan tidak valid",
      data: null,
    });
  }

  console.log(`💬 Roadmap consultation: "${message.substring(0, 50)}..."`);

  try {
    const systemInstruction = `
Kamu adalah H-Mate AI Assistant (dibuat oleh Hammad), developer muda yang menjawab pertanyaan seputar roadmap karier user.

IDENTITAS:
- Nama: H-Mate AI Assistant
- Dibuat oleh: Hammad
- Jika ditanya siapa pembuatmu, jawab: "Aku H-Mate AI Assistant yang dibuat oleh Hammad untuk membantu generasi muda Indonesia menemukan arah karier yang tepat! 😊"

CONTEXT:
${context ? JSON.stringify(context) : "User sedang mengikuti roadmap karier"}

TUGAS:
Jawab pertanyaan user dengan spesifik dan helpful, terkait roadmap karier mereka di SEMUA bidang (bukan hanya teknologi).

GAYA KOMUNIKASI:
- Ramah dan supportive
- Jawaban singkat tapi informatif (2-3 paragraf max)
- Berikan contoh konkret kalau perlu
- Hindari jargon yang terlalu teknis

Jawab dalam Bahasa Indonesia yang natural.
`;

    const aiResponse = await generateAIContent(
      message,
      systemInstruction,
      false
    );

    res.status(200).json({
      success: true,
      message: "Konsultasi berhasil",
      data: {
        response: aiResponse,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error di /api/roadmap/consultation:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal konsultasi",
      data: null,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "H-Mate API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
    data: null,
  });
});

// === START SERVER ===
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server H-Mate berjalan di port ${PORT}`);
  console.log(`📚 Dokumentasi API:`);
  console.log(`   POST /api/konsultasi - Chat konsultasi karier`);
  console.log(`   POST /api/generate-questions - Generate soal tes`);
  console.log(`   POST /api/analyze-results - Analisis hasil tes`);
});

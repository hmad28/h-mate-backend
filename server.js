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

// Helper untuk parse JSON dengan fallback
function safeJSONParse(text) {
  try {
    // Bersihkan dari markdown code blocks
    let cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Coba parse langsung
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON Parse Error:", error.message);
    console.log("Raw response length:", text.length);
    console.log("Raw response preview:", text.substring(0, 1000));
    console.log("Raw response end:", text.substring(text.length - 200));

    // Coba ekstrak JSON dari text
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Fallback parse also failed:", e.message);
    }

    throw new Error("Format respons AI tidak valid. Silakan coba lagi.");
  }
}

// === ROUTES ===

// 1. ENDPOINT: Chat Konsultasi Karier
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
Kamu adalah H-Mate AI Assistant, seorang konselor karier profesional untuk generasi muda Indonesia.

TUGAS UTAMA:
- Berikan saran karier yang praktis, realistis, dan relevan dengan kondisi Indonesia
- Fokus pada bidang digital, teknologi, dan karier masa depan
- Gunakan bahasa yang friendly tapi tetap informatif
- Berikan contoh konkret dan actionable steps
- Dorong user untuk eksplorasi minat mereka

TOPIK YANG KAMU KUASAI:
- Pilihan jurusan kuliah dan prospek kariernya
- Skill yang dibutuhkan untuk berbagai profesi
- Tips membuat portfolio dan CV
- Persiapan interview dan networking
- Jalur karier non-konvensional (freelance, startup, dll)
- Up-skilling dan sertifikasi

GAYA KOMUNIKASI:
- Ramah seperti kakak tingkat yang berpengalaman
- Hindari jargon yang terlalu teknis kecuali diminta
- Berikan motivasi tanpa terdengar menggurui
- Maksimal 3-4 paragraf per jawaban agar mudah dibaca

BATASAN:
- Jangan memberikan medical/legal advice
- Jika ditanya hal di luar karier/edukasi, arahkan kembali ke topik
- Akui jika tidak tahu dan tawarkan alternatif

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

// 2. ENDPOINT: Generate Pertanyaan Tes Minat Bakat
app.post("/api/generate-questions", async (req, res) => {
  const { questionCount = 10 } = req.body;

  try {
    const systemInstruction = `
Kamu adalah pembuat soal tes minat bakat profesional.

TUGAS:
Generate ${questionCount} pertanyaan untuk tes minat bakat.

OUTPUT HARUS BERUPA JSON VALID dengan format berikut:
{
  "questions": [
    {
      "id": 1,
      "question": "Pertanyaan dalam bahasa Indonesia",
      "options": [
        { "value": "A", "text": "Opsi A" },
        { "value": "B", "text": "Opsi B" },
        { "value": "C", "text": "Opsi C" },
        { "value": "D", "text": "Opsi D" }
      ]
    }
  ]
}

KRITERIA PERTANYAAN:
- Variasi topik: kepribadian, ketertarikan, gaya kerja, nilai hidup, skill
- Hindari pertanyaan yang terlalu personal atau sensitif
- Setiap opsi harus berbeda secara signifikan
- Bahasa Indonesia yang mudah dipahami anak muda
- Pertanyaan tidak boleh duplikat atau terlalu mirip

PENTING: 
- Output HANYA JSON, tidak ada teks tambahan
- Pastikan semua string dalam JSON menggunakan escape yang benar
- Tidak ada newline dalam string JSON
`;

    const prompt = `Buatkan ${questionCount} pertanyaan tes minat bakat untuk menentukan karier yang cocok. Output dalam format JSON.`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    const parsedResponse = safeJSONParse(aiResponse);

    // Validasi struktur response
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error("Struktur respons tidak sesuai format");
    }

    res.status(200).json({
      success: true,
      message: "Berhasil generate pertanyaan",
      data: parsedResponse,
    });
  } catch (error) {
    console.error("Error di /api/generate-questions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat membuat pertanyaan",
      data: null,
    });
  }
});

// 3. ENDPOINT: Analisis Hasil Tes
app.post("/api/analyze-results", async (req, res) => {
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Data jawaban tidak valid",
      data: null,
    });
  }

  try {
    const systemInstruction = `
Kamu adalah career analyst profesional untuk generasi muda Indonesia.

TUGAS:
Analisis jawaban tes minat bakat dan berikan rekomendasi karier yang cocok.

OUTPUT HARUS BERUPA JSON VALID dengan format berikut:
{
  "personality_type": "Tipe kepribadian singkat",
  "description": "Deskripsi 2-3 kalimat tentang kepribadian user",
  "recommended_careers": [
    {
      "title": "Nama Profesi",
      "match_percentage": 85,
      "reason": "Kenapa cocok",
      "skills_needed": ["Skill 1", "Skill 2", "Skill 3"]
    }
  ],
  "strengths": ["Kekuatan 1", "Kekuatan 2", "Kekuatan 3"],
  "development_areas": ["Area pengembangan 1", "Area pengembangan 2"],
  "next_steps": ["Action step 1", "Action step 2", "Action step 3"]
}

KRITERIA ANALISIS:
- Berikan 3 rekomendasi karier yang realistis untuk Indonesia
- Prioritaskan profesi yang relevan dengan era digital
- Match percentage berdasarkan kecocokan dengan jawaban
- Skills needed maksimal 3-4 skills yang spesifik
- Next steps maksimal 3 action steps yang singkat dan jelas
- Bahasa motivational tapi tetap realistis
- PENTING: Jaga agar reason, description, dan next_steps tetap SINGKAT (1-2 kalimat)

PENTING:
- Output HANYA JSON, tidak ada teks tambahan
- Pastikan semua string dalam JSON menggunakan escape yang benar
- Tidak ada newline dalam string JSON
`;

    const answersText = answers
      .map(
        (answer, index) =>
          `Pertanyaan ${index + 1}: ${answer.question}\nJawaban: ${
            answer.selectedOption.text
          }`
      )
      .join("\n\n");

    const prompt = `Analisis hasil tes minat bakat berikut dan berikan rekomendasi karier dalam format JSON:\n\n${answersText}`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    const parsedResponse = safeJSONParse(aiResponse);

    // Validasi struktur response
    if (
      !parsedResponse.personality_type ||
      !parsedResponse.recommended_careers
    ) {
      throw new Error("Struktur respons tidak sesuai format");
    }

    res.status(200).json({
      success: true,
      message: "Analisis berhasil",
      data: parsedResponse,
    });
  } catch (error) {
    console.error("Error di /api/analyze-results:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat analisis",
      data: null,
    });
  }
});

// ====================================================
// TAMBAHKAN INI DI server.js SETELAH ENDPOINT ANALYZE-RESULTS
// ====================================================

// 4. ENDPOINT: Generate Mini Test (Quick career interest test)
app.post("/api/roadmap/mini-test", async (req, res) => {
  const { questionCount = 7 } = req.body;

  console.log(`📝 Generate mini test (${questionCount} questions)...`);

  try {
    const systemInstruction = `
Kamu adalah pembuat tes minat bakat CEPAT untuk menentukan arah karier.

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
        { "value": "B", "text": "Opsi B", "category": "creative" },
        { "value": "C", "text": "Opsi C", "category": "analytical" },
        { "value": "D", "text": "Opsi D", "category": "social" }
      ]
    }
  ]
}

KRITERIA:
- Pertanyaan harus SINGKAT (max 15 kata)
- Fokus pada: tipe pekerjaan, skill preference, work environment
- Setiap opsi punya category: "technical", "creative", "analytical", "social", "business"
- Bahasa Indonesia yang casual dan mudah dipahami
- Pertanyaan variatif (jangan semua tipe sama)

Contoh pertanyaan bagus:
- "Kamu lebih suka bekerja dengan?"
- "Lingkungan kerja ideal kamu?"
- "Skill apa yang paling kamu nikmati?"

PENTING: Output HANYA JSON, tanpa teks tambahan.
`;

    const prompt = `Buatkan ${questionCount} pertanyaan mini test untuk menentukan arah karier. Output JSON.`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    const parsedResponse = safeJSONParse(aiResponse);

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error("Struktur respons tidak sesuai format");
    }

    console.log(`✅ Generated ${parsedResponse.questions.length} mini test questions`);

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

// 5. ENDPOINT: Analyze Mini Test
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
Kamu adalah career analyst yang menentukan job recommendation berdasarkan jawaban singkat.

TUGAS:
Analisis jawaban mini test dan berikan 3 rekomendasi karier yang paling cocok.

OUTPUT HARUS BERUPA JSON VALID:
{
  "recommendedJobs": [
    {
      "title": "Nama Profesi",
      "match_score": 90,
      "reason": "Alasan singkat kenapa cocok (1 kalimat)",
      "type": "technical/creative/analytical/social/business"
    }
  ],
  "summary": "Ringkasan singkat kepribadian kerja user (2-3 kalimat)",
  "strengths": ["Kekuatan 1", "Kekuatan 2", "Kekuatan 3"]
}

KRITERIA:
- Berikan TEPAT 3 rekomendasi job
- Job harus realistis untuk Indonesia dan relevan dengan era digital
- Match score berdasarkan kecocokan jawaban
- Reason harus singkat dan jelas
- Summary harus motivational tapi realistis

PENTING: Output HANYA JSON, tanpa teks tambahan.
`;

    const answersText = answers
      .map(
        (answer, index) =>
          `Q${index + 1}: ${answer.question}\nJawaban: ${answer.selectedOption.text} (category: ${answer.selectedOption.category || 'unknown'})`
      )
      .join("\n\n");

    const prompt = `Analisis mini test berikut dan berikan 3 rekomendasi karier:\n\n${answersText}`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    const parsedResponse = safeJSONParse(aiResponse);

    if (!parsedResponse.recommendedJobs || !Array.isArray(parsedResponse.recommendedJobs)) {
      throw new Error("Struktur respons tidak sesuai format");
    }

    console.log(`✅ Recommended: ${parsedResponse.recommendedJobs.map(j => j.title).join(', ')}`);

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
Skill yang sudah dimiliki: ${existingSkills.length > 0 ? existingSkills.join(', ') : 'Belum ada'}

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

    const prompt = `Buatkan roadmap karier lengkap untuk ${targetRole}. User adalah ${currentStatus}. ${existingSkills.length > 0 ? `Skill yang sudah dimiliki: ${existingSkills.join(', ')}.` : ''} Output JSON.`;

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

  console.log(`📍 Getting next steps (completed: ${completedPhases.length} phases)...`);

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

    const prompt = `User sedang mengikuti roadmap berikut:\n${roadmapSummary}\n\nSkill yang sudah dimiliki: ${currentSkills.join(', ') || 'Belum ada'}.\n\nBerikan next steps dan rekomendasi. Output JSON.`;

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

// 8. ENDPOINT: Roadmap Consultation (chat di akhir flow)
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
Kamu adalah career mentor yang menjawab pertanyaan seputar roadmap karier user.

CONTEXT:
${context ? JSON.stringify(context) : 'User sedang mengikuti roadmap karier'}

TUGAS:
Jawab pertanyaan user dengan spesifik dan helpful, terkait roadmap karier mereka.

GAYA KOMUNIKASI:
- Ramah dan supportive
- Jawaban singkat tapi informatif (2-3 paragraf max)
- Berikan contoh konkret kalau perlu
- Hindari jargon yang terlalu teknis

Jawab dalam Bahasa Indonesia yang natural.
`;

    const aiResponse = await generateAIContent(message, systemInstruction, false);

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

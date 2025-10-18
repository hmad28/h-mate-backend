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
Kamu adalah KarirKu AI Assistant, seorang konselor karier profesional untuk generasi muda Indonesia.

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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "KarirKu API is running",
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
  console.log(`🚀 Server KarirKu berjalan di port ${PORT}`);
  console.log(`📚 Dokumentasi API:`);
  console.log(`   POST /api/konsultasi - Chat konsultasi karier`);
  console.log(`   POST /api/generate-questions - Generate soal tes`);
  console.log(`   POST /api/analyze-results - Analisis hasil tes`);
});

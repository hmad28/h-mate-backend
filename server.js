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

// ENDPOINT 1: GENERATE QUESTIONS
app.post("/api/generate-questions", async (req, res) => {
  const { questionCount = 30, userAge } = req.body;

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

1. WORK ENVIRONMENT (25% - ~5 pertanyaan)
   Detect: Indoor vs outdoor, solo vs team, structured vs flexible
   → Tech/Office vs Field/Outdoor, Manager vs Individual contributor

2. INTERACTION STYLE (25% - ~5 pertanyaan)  
   Detect: Introvert vs extrovert, leadership, communication
   → Sales/HR/Teacher vs Engineer/Analyst, Leader vs Specialist

3. PROBLEM SOLVING (20% - ~4 pertanyaan)
   Detect: Analytical vs creative, detail vs big picture
   → Data Scientist/Engineer vs Designer/Artist

4. STRESS & PRESSURE (15% - ~3 pertanyaan)
   Detect: Pressure tolerance, risk-taking, deadline
   → Pilot/Dokter/Polisi vs Librarian/Researcher

5. VALUES & MOTIVATION (15% - ~3 pertanyaan)
   Detect: Help people vs create, stability vs variety
   → Healthcare/Education vs Tech/Business

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 100+ KARIR YANG HARUS BISA DIDETEKSI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNOLOGY: Software Engineer, Data Scientist, Cyber Security Analyst, Network Engineer, DevOps, Mobile Developer, Game Developer, Cloud Engineer

DESIGN: UI/UX Designer, Graphic Designer, Animator, 3D Artist, Interior Designer, Fashion Designer, Product Designer, Photographer

MEDICAL: Dokter, Perawat, Apoteker, Psikolog, Fisioterapis, Bidan, Ahli Gizi, Radiografer, Dokter Hewan

LAW & ORDER: Polisi, Tentara, Pengacara, Jaksa, Hakim, Notaris, Detektif

AVIATION: Pilot, Pramugari, Air Traffic Controller, Aircraft Engineer

ENGINEERING: Civil Engineer, Mechanical Engineer, Electrical Engineer, Architect, Chemical Engineer, Industrial Engineer

BUSINESS: Entrepreneur, Business Analyst, Manager, Akuntan, Financial Analyst, Consultant, Project Manager

MARKETING: Digital Marketing, Social Media Manager, SEO Specialist, Brand Manager, Sales Manager

HR: HR Manager, Recruiter, Training Manager, HR Business Partner

MEDIA: Jurnalis, Reporter, PR Specialist, Content Creator, Video Editor, Podcast Host

EDUCATION: Guru, Dosen, Tutor, Research Scientist, Education Consultant

CULINARY: Chef, Pastry Chef, Food Critic, Restaurant Manager

ARTS: Musisi, Actor, Dancer, Film Director, Voice Actor

GOVERNMENT: PNS, Diplomat, Politisi, Social Worker, NGO Worker

SCIENCE: Physicist, Chemist, Biologist, Environmental Consultant

SPORTS: Atlet, Personal Trainer, Sports Coach, Esports Player

SPECIALIZED: Librarian, Translator, Actuary, Statistician

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CRITICAL RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. VARIASI MAKSIMAL:
   ✅ Gunakan SEED ${uniqueId} untuk generate berbeda
   ✅ Rotasi kategori secara random
   ✅ Mix pertanyaan easy, medium, complex
   ✅ JANGAN pakai template yang sama persis

2. KUALITAS PERTANYAAN:
   ✅ Harus REFLEKTIF (tentang diri user)
   ✅ Situasi KONKRET dan relatable
   ✅ DISCRIMINATIVE (bisa bedain traits)
   ✅ Hindari hypothetical/unrealistic

3. KUALITAS OPSI:
   ✅ 4 opsi WAJIB terisi lengkap
   ✅ Opsi KONKRET tidak ambigu
   ✅ Semua opsi valid choices (tidak ada "obviously better")
   ✅ Map ke trait/career berbeda

4. FORMAT:
   ✅ Output PURE JSON (tidak ada markdown)
   ✅ Tidak ada backticks atau \`\`\`json
   ✅ Valid JSON structure

${exampleQuestions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 JANGAN DITIRU (BURUK):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ "Apa yang kamu suka?" (terlalu vague)
❌ "Kamu orang seperti apa?" (terlalu abstrak)
❌ "Apakah kamu suka kerja?" (yes/no, tidak discriminative)
❌ Opsi generic: "Tergantung situasi" (tidak helpful)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 TIPS PERTANYAAN POWERFUL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SITUATIONAL: "Kalau deadline mepet, kamu..."
✅ BEHAVIORAL: "Biasanya kamu...", "Dalam situasi X..."
✅ FORCED CHOICE: "Kamu lebih suka X atau Y?"
✅ VARIASI STRUKTUR: Jangan semua mulai dengan "Kamu lebih suka..."

PENTING: Gunakan seed untuk ensure UNIQUENESS!`;

    const prompt = `Generate ${questionCount} pertanyaan tes minat bakat yang FRESH dan BERVARIASI.

SEED: ${uniqueId}
TARGET: ${ageGroup}

Requirements:
- Distribusi kategori merata
- Bahasa sesuai age group
- Semua opsi terisi (4 opsi per pertanyaan)
- Output PURE JSON tanpa markdown
- Pertanyaan BERBEDA dari generate sebelumnya

Generate NOW!`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
    const parsedResponse = safeJSONParse(aiResponse);

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error("Invalid response structure");
    }

    // Validate questions
    const validQuestions = parsedResponse.questions.filter(q => {
      if (!q.options || q.options.length !== 4) return false;
      return q.options.every(opt => opt.text && opt.text.trim().length > 0 && opt.value);
    });

    console.log(`✅ Generated ${validQuestions.length}/${questionCount} valid questions`);
    console.log(`   Age: ${userAge || 'default'} | Seed: ${randomSeed}`);

    if (validQuestions.length < questionCount) {
      console.log(`⚠️ Only ${validQuestions.length} valid questions generated`);
    }

    res.status(200).json({
      success: true,
      message: "Questions generated successfully",
      data: { 
        questions: validQuestions,
        metadata: {
          seed: randomSeed,
          uniqueId: uniqueId,
          ageGroup: ageGroup,
          timestamp: timestamp
        }
      },
    });
    
  } catch (error) {
    console.error("❌ Generate questions error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate questions",
      data: null,
    });
  }
});

// ============================================
// ENDPOINT 2: ANALYZE RESULTS
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

3. TRAIT DETECTION:
   ✅ Work: indoor/outdoor, solo/team, structured/flexible
   ✅ Social: introvert/extrovert, leadership
   ✅ Thinking: analytical/creative, detail/big-picture
   ✅ Stress: high/low pressure tolerance
   ✅ Values: helping/creating, stability/variety

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TRAIT → CAREER MAPPING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMPATHY + HELPING + COMMUNICATION:
→ Psikolog, Guru, HR Manager, Social Worker, Konselor

ANALYTICAL + DETAIL + TECHNICAL:
→ Data Scientist, Cyber Security, Financial Analyst, Engineer

CREATIVE + VISUAL + PROBLEM-SOLVING:
→ UI/UX Designer, Architect, Product Designer

LEADERSHIP + EXTROVERT + STRATEGIC:
→ Entrepreneur, Manager, Marketing Manager, Diplomat

PHYSICAL + DISCIPLINE + HIGH-PRESSURE:
→ Polisi, Tentara, Pilot, Atlet, Chef

TECHNICAL + FOCUSED + PROBLEM-SOLVING:
→ Software Engineer, Network Engineer, Data Analyst

SOCIAL + COMMUNICATIVE + PERSUASIVE:
→ Sales Manager, PR Specialist, Jurnalis, Content Creator

INDEPENDENT + ANALYTICAL + RESEARCH:
→ Research Scientist, Data Analyst, Writer, Librarian

HANDS-ON + PRACTICAL + CREATIVE:
→ Chef, Interior Designer, Fashion Designer, Photographer

RISK-TAKING + INNOVATIVE + AMBITIOUS:
→ Entrepreneur, Investor, Startup Founder

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 100+ KARIR DATABASE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECH: Software Engineer, Data Scientist, Cyber Security Analyst, Network Engineer, DevOps, Mobile Developer, Cloud Engineer, Game Developer

DESIGN: UI/UX Designer, Graphic Designer, Animator, Interior Designer, Fashion Designer, Product Designer, Photographer, Video Editor

MEDICAL: Dokter, Perawat, Apoteker, Psikolog, Fisioterapis, Bidan, Ahli Gizi, Terapis, Radiografer

LAW: Polisi, Tentara, Pengacara, Jaksa, Hakim, Notaris, Detektif

AVIATION: Pilot, Pramugari, Air Traffic Controller, Aircraft Engineer

ENGINEERING: Civil Engineer, Mechanical Engineer, Electrical Engineer, Architect, Chemical Engineer, Industrial Engineer

BUSINESS: Entrepreneur, Business Analyst, Management Consultant, Project Manager, Akuntan, Financial Analyst, Auditor

MARKETING: Digital Marketing Specialist, Social Media Manager, SEO Specialist, Brand Manager, Sales Manager

HR: HR Manager, HR Generalist, Recruiter, Training Manager

MEDIA: Jurnalis, Reporter, Editor, PR Specialist, Content Creator, Podcast Host

EDUCATION: Guru, Dosen, Tutor, Research Scientist

CULINARY: Chef, Pastry Chef, Restaurant Manager, Food Critic

ARTS: Musisi, Actor, Dancer, Film Director, Producer, Voice Actor

GOVERNMENT: PNS, Diplomat, Politisi, Social Worker, NGO Worker

SCIENCE: Physicist, Chemist, Biologist, Environmental Consultant

SPORTS: Atlet, Personal Trainer, Sports Coach, Esports Player

SPECIALIZED: Librarian, Translator, Actuary, Statistician, Economist

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 CONTOH BURUK vs ✅ BAGUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ BURUK - Semua satu sektor:
1. Software Engineer
2. Data Scientist
3. Cyber Security
4. Network Engineer
5. DevOps Engineer

✅ BAGUS - Beragam sektor:
1. Software Engineer (Tech)
2. Psikolog (Medical)
3. Marketing Manager (Business)
4. UI/UX Designer (Creative)
5. Guru (Education)

❌ BURUK - Reason generic:
"Cocok karena sesuai kepribadian kamu"

✅ BAGUS - Reason spesifik:
"Cocok karena kamu analytical, detail-oriented, dan suka technical problem-solving"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ RULES WAJIB:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DIVERSITY: 5 karir dari MINIMAL 4 sektor berbeda
2. SPECIFICITY: Reason harus spesifik ke jawaban user
3. REALISM: Skills konkret dan actionable
4. BREVITY: Description max 200 char, reason max 150 char
5. FORMAT: Pure JSON tanpa markdown

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
5. Description & reason SINGKAT
6. Output PURE JSON

Analyze NOW!`;

    const aiResponse = await generateAIContent(prompt, systemInstruction, true);
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
      console.log(`⚠️ Low diversity: only ${uniqueSectors.size} sectors`);
    }

    res.status(200).json({
      success: true,
      message: "Analysis successful",
      data: parsedResponse,
    });
    
  } catch (error) {
    console.error("❌ Analyze error:", error);
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

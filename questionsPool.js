// ============================================
// QUESTIONS POOL DATABASE
// ============================================
// Simpan ini di file terpisah: questionsPool.js

const QUESTIONS_POOL = {
  SMP: {
    work_environment: [
      {
        question: "Kalau disuruh pilih tempat kerja, kamu pilih yang mana?",
        options: [
          {
            value: "A",
            text: "Kantor dengan AC dan komputer",
            category: "indoor_tech",
          },
          {
            value: "B",
            text: "Di luar ruangan, bisa gerak bebas",
            category: "outdoor_active",
          },
          {
            value: "C",
            text: "Rumah sendiri, kerja dari laptop",
            category: "remote_flexible",
          },
          {
            value: "D",
            text: "Keliling-keliling, ketemu orang baru",
            category: "mobile_social",
          },
        ],
      },
      {
        question: "Kamu lebih nyaman kerja bareng siapa?",
        options: [
          {
            value: "A",
            text: "Sendiri aja, fokus tanpa gangguan",
            category: "solo_focused",
          },
          { value: "B", text: "Tim kecil yang kompak", category: "small_team" },
          {
            value: "C",
            text: "Grup besar, rame-rame seru",
            category: "large_group",
          },
          {
            value: "D",
            text: "Tergantung project, fleksibel",
            category: "flexible_collab",
          },
        ],
      },
      {
        question: "Jam kerja yang cocok buat kamu?",
        options: [
          {
            value: "A",
            text: "9-5 teratur, udah pasti",
            category: "structured_time",
          },
          {
            value: "B",
            text: "Fleksibel, yang penting deadline kelar",
            category: "flexible_time",
          },
          {
            value: "C",
            text: "Malam hari, lebih fokus",
            category: "night_owl",
          },
          {
            value: "D",
            text: "Pagi banget, fresh otak",
            category: "early_bird",
          },
        ],
      },
    ],
    interaction_style: [
      {
        question: "Di grup project, kamu biasanya jadi apa?",
        options: [
          {
            value: "A",
            text: "Yang ngatur dan bagi tugas",
            category: "leader_organizer",
          },
          {
            value: "B",
            text: "Yang ngerjain tugas sungguh-sungguh",
            category: "executor_doer",
          },
          {
            value: "C",
            text: "Yang kasih ide-ide kreatif",
            category: "ideator_creative",
          },
          {
            value: "D",
            text: "Yang bantuin semua yang butuh",
            category: "supporter_helper",
          },
        ],
      },
      {
        question: "Kalau ada tugas presentasi, kamu prefer?",
        options: [
          {
            value: "A",
            text: "Jadi presenter, suka ngomong di depan",
            category: "presenter_extrovert",
          },
          {
            value: "B",
            text: "Buat slide-nya, desain bagus",
            category: "designer_visual",
          },
          {
            value: "C",
            text: "Riset materinya, cari data",
            category: "researcher_analytical",
          },
          {
            value: "D",
            text: "Support dari belakang aja",
            category: "support_introvert",
          },
        ],
      },
      {
        question: "Tipe temen yang kamu cari?",
        options: [
          {
            value: "A",
            text: "Banyak temen, circle luas",
            category: "social_extrovert",
          },
          {
            value: "B",
            text: "Beberapa temen deket aja",
            category: "selective_social",
          },
          {
            value: "C",
            text: "Online friend juga oke",
            category: "digital_social",
          },
          {
            value: "D",
            text: "Sendirian juga nyaman kok",
            category: "introverted_solo",
          },
        ],
      },
    ],
    problem_solving: [
      {
        question: "Ada masalah sulit, cara kamu nyelesaiin?",
        options: [
          {
            value: "A",
            text: "Langsung coba-coba sampe berhasil",
            category: "trial_error_hands_on",
          },
          {
            value: "B",
            text: "Pikirin dulu pelan-pelan",
            category: "analytical_thinking",
          },
          {
            value: "C",
            text: "Tanya orang yang lebih tau",
            category: "collaborative_learner",
          },
          {
            value: "D",
            text: "Cari tutorial atau artikel",
            category: "research_learner",
          },
        ],
      },
      {
        question: "Kamu lebih suka tugas yang gimana?",
        options: [
          {
            value: "A",
            text: "Ada instruksi jelas step by step",
            category: "structured_clear",
          },
          {
            value: "B",
            text: "Bebas kreatif, terserah kamu",
            category: "creative_freedom",
          },
          {
            value: "C",
            text: "Ada tantangan dan teka-teki",
            category: "challenging_puzzle",
          },
          {
            value: "D",
            text: "Praktek langsung, bukan teori",
            category: "hands_on_practical",
          },
        ],
      },
    ],
    stress_pressure: [
      {
        question: "Kalau deadline besok, kamu?",
        options: [
          {
            value: "A",
            text: "Tenang aja, udah biasa",
            category: "high_pressure_calm",
          },
          {
            value: "B",
            text: "Grogi tapi tetep ngerjain",
            category: "medium_pressure",
          },
          {
            value: "C",
            text: "Panik, butuh bantuan",
            category: "low_pressure_support",
          },
          {
            value: "D",
            text: "Mending hindarin deadline mepet",
            category: "low_pressure_avoid",
          },
        ],
      },
      {
        question: "Kamu takut sama hal apa di dunia kerja?",
        options: [
          {
            value: "A",
            text: "Salah keputusan, tanggung jawab besar",
            category: "decision_averse",
          },
          {
            value: "B",
            text: "Dikritik atau dimarahin",
            category: "criticism_sensitive",
          },
          {
            value: "C",
            text: "Gagal atau hasilnya jelek",
            category: "failure_averse",
          },
          {
            value: "D",
            text: "Nggak takut, santai aja",
            category: "risk_taker_brave",
          },
        ],
      },
    ],
    values_motivation: [
      {
        question: "Yang paling kamu pengen dari kerja?",
        options: [
          {
            value: "A",
            text: "Gaji besar, bisa beli apa aja",
            category: "financial_motivated",
          },
          {
            value: "B",
            text: "Bantu orang lain, bikin seneng",
            category: "helping_motivated",
          },
          {
            value: "C",
            text: "Bikin sesuatu yang keren",
            category: "creative_motivated",
          },
          {
            value: "D",
            text: "Terkenal atau dihormatin",
            category: "recognition_motivated",
          },
        ],
      },
      {
        question: "Pekerjaan impian kamu tuh yang?",
        options: [
          {
            value: "A",
            text: "Stabil, aman, nggak takut PHK",
            category: "stability_security",
          },
          {
            value: "B",
            text: "Seru, beda-beda tiap hari",
            category: "variety_excitement",
          },
          {
            value: "C",
            text: "Fleksibel, bisa atur sendiri",
            category: "flexibility_autonomy",
          },
          {
            value: "D",
            text: "Punya impact besar ke banyak orang",
            category: "impact_meaning",
          },
        ],
      },
    ],
  },

  SMA: {
    work_environment: [
      {
        question: "Environment kerja yang bikin kamu paling produktif?",
        options: [
          {
            value: "A",
            text: "Office dengan struktur dan sistem jelas",
            category: "structured_corporate",
          },
          {
            value: "B",
            text: "Outdoor atau field work",
            category: "outdoor_field",
          },
          {
            value: "C",
            text: "Remote/WFH yang fleksibel",
            category: "remote_flexible",
          },
          {
            value: "D",
            text: "Co-working space yang vibrant",
            category: "coworking_dynamic",
          },
        ],
      },
      {
        question: "Setup workspace yang ideal untukmu?",
        options: [
          {
            value: "A",
            text: "Meja sendiri, tools lengkap, minimal noise",
            category: "solo_focused_setup",
          },
          {
            value: "B",
            text: "Open space, bisa kolaborasi kapan aja",
            category: "collaborative_open",
          },
          {
            value: "C",
            text: "Hybrid, kadang office kadang remote",
            category: "hybrid_flexible",
          },
          {
            value: "D",
            text: "Mobile, bisa kerja dari mana aja",
            category: "mobile_nomadic",
          },
        ],
      },
    ],
    interaction_style: [
      {
        question: "Leadership style yang sesuai dengan karakter kamu?",
        options: [
          {
            value: "A",
            text: "Delegative - kasih kebebasan ke team",
            category: "delegative_leader",
          },
          {
            value: "B",
            text: "Collaborative - bareng-bareng decide",
            category: "collaborative_leader",
          },
          {
            value: "C",
            text: "Directive - kasih instruksi jelas",
            category: "directive_leader",
          },
          {
            value: "D",
            text: "Prefer jadi specialist, bukan manager",
            category: "individual_contributor",
          },
        ],
      },
      {
        question: "Cara kamu networking paling efektif?",
        options: [
          {
            value: "A",
            text: "Event, conference, ketemu langsung",
            category: "extrovert_networker",
          },
          {
            value: "B",
            text: "Online communities, LinkedIn, Twitter",
            category: "digital_networker",
          },
          {
            value: "C",
            text: "Through projects dan collaboration",
            category: "work_based_networker",
          },
          {
            value: "D",
            text: "Networking bukan prioritas gue",
            category: "network_averse",
          },
        ],
      },
    ],
    problem_solving: [
      {
        question: "Approach kamu ke problem complex?",
        options: [
          {
            value: "A",
            text: "Break down jadi sub-problems kecil",
            category: "analytical_systematic",
          },
          {
            value: "B",
            text: "Cari pattern atau analogy dari case lain",
            category: "pattern_recognition",
          },
          {
            value: "C",
            text: "Brainstorm creative solutions dulu",
            category: "creative_problem_solver",
          },
          {
            value: "D",
            text: "Research best practices yang proven",
            category: "research_based",
          },
        ],
      },
      {
        question: "Tools yang paling sering kamu pakai?",
        options: [
          {
            value: "A",
            text: "Spreadsheet, data, analytics tools",
            category: "data_analytical",
          },
          {
            value: "B",
            text: "Design tools, visual editors",
            category: "visual_creative",
          },
          {
            value: "C",
            text: "Communication apps, collab tools",
            category: "communication_collab",
          },
          {
            value: "D",
            text: "Technical tools, code, terminal",
            category: "technical_tools",
          },
        ],
      },
    ],
    stress_pressure: [
      {
        question: "High-stakes situation yang kamu handle?",
        options: [
          {
            value: "A",
            text: "Bring it on, gue thrives under pressure",
            category: "high_pressure_performer",
          },
          {
            value: "B",
            text: "Bisa handle tapi draining energy",
            category: "medium_pressure_capable",
          },
          {
            value: "C",
            text: "Prefer avoid, performance drop",
            category: "low_pressure_prefer",
          },
          {
            value: "D",
            text: "Neutral, depends on context",
            category: "context_dependent",
          },
        ],
      },
      {
        question: "Failure response kamu gimana?",
        options: [
          {
            value: "A",
            text: "Learning opportunity, iterate fast",
            category: "growth_mindset",
          },
          {
            value: "B",
            text: "Analyze what went wrong systematically",
            category: "analytical_learner",
          },
          {
            value: "C",
            text: "Butuh time to process and recover",
            category: "reflective_processor",
          },
          {
            value: "D",
            text: "Seek support and guidance",
            category: "support_seeker",
          },
        ],
      },
    ],
    values_motivation: [
      {
        question: "Career success metric yang paling meaningful?",
        options: [
          {
            value: "A",
            text: "Financial independence dan wealth",
            category: "financial_success",
          },
          {
            value: "B",
            text: "Impact positif ke society/environment",
            category: "social_impact",
          },
          {
            value: "C",
            text: "Recognition dan influence di industri",
            category: "recognition_influence",
          },
          {
            value: "D",
            text: "Work-life balance dan fulfillment",
            category: "balance_fulfillment",
          },
        ],
      },
      {
        question: "Company culture yang kamu cari?",
        options: [
          {
            value: "A",
            text: "Fast-paced, innovative, risk-taking",
            category: "startup_culture",
          },
          {
            value: "B",
            text: "Stable, established, clear progression",
            category: "corporate_culture",
          },
          {
            value: "C",
            text: "Mission-driven, purpose-oriented",
            category: "mission_culture",
          },
          {
            value: "D",
            text: "Flexible, autonomous, remote-first",
            category: "flexible_culture",
          },
        ],
      },
    ],
  },

  MAHASISWA: {
    work_environment: [
      {
        question: "Organizational structure yang memaksimalkan potensi kamu?",
        options: [
          {
            value: "A",
            text: "Flat hierarchy, direct access to leadership",
            category: "flat_structure",
          },
          {
            value: "B",
            text: "Matrix organization, cross-functional teams",
            category: "matrix_structure",
          },
          {
            value: "C",
            text: "Traditional hierarchy dengan clear reporting",
            category: "traditional_structure",
          },
          {
            value: "D",
            text: "Fully autonomous, self-managed teams",
            category: "autonomous_structure",
          },
        ],
      },
    ],
    interaction_style: [
      {
        question: "Collaboration style yang paling efektif untukmu?",
        options: [
          {
            value: "A",
            text: "Agile/Scrum dengan daily standups",
            category: "agile_collaborative",
          },
          {
            value: "B",
            text: "Independent work dengan weekly sync",
            category: "independent_sync",
          },
          {
            value: "C",
            text: "Deep collaboration, pair programming/working",
            category: "deep_collaboration",
          },
          {
            value: "D",
            text: "Async communication, documentation-first",
            category: "async_documented",
          },
        ],
      },
    ],
    problem_solving: [
      {
        question: "Technical problem-solving approach kamu?",
        options: [
          {
            value: "A",
            text: "First principles thinking, bottom-up",
            category: "first_principles",
          },
          {
            value: "B",
            text: "Design thinking, user-centric iteration",
            category: "design_thinking",
          },
          {
            value: "C",
            text: "Data-driven, hypothesis testing",
            category: "data_driven",
          },
          {
            value: "D",
            text: "Systems thinking, holistic view",
            category: "systems_thinking",
          },
        ],
      },
    ],
    stress_pressure: [
      {
        question: "Crisis management style kamu?",
        options: [
          {
            value: "A",
            text: "Take charge, decisive action under pressure",
            category: "crisis_leader",
          },
          {
            value: "B",
            text: "Systematic triage and prioritization",
            category: "systematic_crisis",
          },
          {
            value: "C",
            text: "Collaborative problem-solving dengan team",
            category: "collaborative_crisis",
          },
          {
            value: "D",
            text: "Prefer prevention over crisis handling",
            category: "preventive_mindset",
          },
        ],
      },
    ],
    values_motivation: [
      {
        question: "Long-term career vision yang align dengan values kamu?",
        options: [
          {
            value: "A",
            text: "Build/scale company, entrepreneurial path",
            category: "entrepreneurial",
          },
          {
            value: "B",
            text: "Deep expertise, thought leader di domain",
            category: "expert_specialist",
          },
          {
            value: "C",
            text: "Leadership position, organizational impact",
            category: "leadership_executive",
          },
          {
            value: "D",
            text: "Portfolio career, multiple ventures/roles",
            category: "portfolio_career",
          },
        ],
      },
    ],
  },
};

// ============================================
// SMART QUESTION SELECTOR
// ============================================



// ============================================
// NEW BACKEND ENDPOINT (SUPER FAST!)
// ============================================



// ============================================
// ANALYSIS TETAP PAKAI AI (ini cepat)
// ============================================
// Endpoint analyze-results TIDAK BERUBAH, tetap pakai AI
// Karena analysis cepat (1-2 detik) dan reliable

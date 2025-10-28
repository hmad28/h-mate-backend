function selectSmartQuestions(ageGroup, count = 30) {
  const pool = QUESTIONS_POOL[ageGroup];
  const selected = [];

  // Calculate distribution
  const distribution = {
    work_environment: Math.ceil(count * 0.25),
    interaction_style: Math.ceil(count * 0.25),
    problem_solving: Math.ceil(count * 0.2),
    stress_pressure: Math.ceil(count * 0.15),
    values_motivation: Math.ceil(count * 0.15),
  };

  // Select questions from each category
  for (const [category, targetCount] of Object.entries(distribution)) {
    const categoryQuestions = pool[category] || [];

    // Shuffle and select
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
    const needed = Math.min(targetCount, shuffled.length);

    // Add to selected with ID
    for (let i = 0; i < needed; i++) {
      selected.push({
        ...shuffled[i],
        id: selected.length + 1,
        category: category,
      });
    }

    // If pool too small, repeat with shuffle
    let repeatCount = targetCount - needed;
    while (repeatCount > 0 && categoryQuestions.length > 0) {
      const reshuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
      const question = reshuffled[0];
      selected.push({
        ...question,
        id: selected.length + 1,
        category: category,
      });
      repeatCount--;
    }
  }

  // Final shuffle
  return selected
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((q, idx) => ({ ...q, id: idx + 1 }));
}

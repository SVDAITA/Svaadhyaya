// Async version — fetches custom quotes from DB (public read, no auth required)
export async function getAllQuotesAsync(supabase) {
  try {
    const { data } = await supabase.from("custom_quotes").select("text,translation,source");
    return [...QUOTES, ...(data || [])];
  } catch {
    return QUOTES;
  }
}

// Sync fallback — used only when async not feasible
export function getAllQuotes() {
  return QUOTES;
}

export const QUOTES = [
  { text: 'स्वाध्यायान्मा प्रमदः', translation: 'Never neglect self-study.', source: 'Taittiriya Upanishad' },
  { text: 'सा विद्या या विमुक्तये', translation: 'That alone is true knowledge which liberates.', source: 'Vishnu Purana' },
  { text: 'शरीरमाद्यं खलु धर्मसाधनम्', translation: 'The body is the primary instrument of dharma.', source: 'Kalidasa' },
  { text: 'ध्यानमूलं गुरोर्मूर्तिः', translation: 'The root of meditation is the Guru\'s form.', source: 'Guru Gita' },
  { text: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत', translation: 'Whenever dharma declines, I arise.', source: 'Bhagavad Gita 4.7' },
  { text: 'योगः कर्मसु कौशलम्', translation: 'Excellence in action is yoga.', source: 'Bhagavad Gita 2.50' },
  { text: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्', translation: 'Lift yourself by your own self; do not let yourself fall.', source: 'Bhagavad Gita 6.5' },
  { text: 'अहिंसा परमो धर्मः', translation: 'Non-violence is the highest dharma.', source: 'Mahabharata' },
  { text: 'ॐ तत् सत्', translation: 'That which is — is truth.', source: 'Bhagavad Gita 17.23' },
  { text: 'Nādam is not sound. It is consciousness vibrating.', source: 'Carnatic philosophy' },
  { text: 'Every riyaz session is a brick in a temple you will never see completed — and that is the point.', source: 'Svadhyaya · Nādam' },
  { text: 'Sangeetam is not just practice. It is seva. Show up for it as you would for God.', source: 'Carnatic tradition' },
  { text: 'The practice never pauses. It only scales down.', source: 'Svadhyaya · Anushthanam' },
  { text: 'The walk is not exercise. It is the threshold between night and day.', source: 'Svadhyaya · Sharīram' },
  { text: 'Read to become, not to know.', source: 'Svadhyaya · Vidyā' },
  { text: 'Financial freedom is not a number. It is a daily practice.', source: 'Svadhyaya · Artha' },
  { text: 'The debt closes. The corpus grows. They cannot both be true — until suddenly they are.', source: 'Svadhyaya · Artha' },
  { text: 'Tech is the vehicle. Music is the destination.', source: 'Svadhyaya · Nādam' },
  { text: 'Never miss twice. In any area. Ever.', source: 'The one rule' },
  { text: 'Your daughter is watching. What kind of man do you want her to see?', source: 'Svadhyaya' },
  { text: 'The man who rises at dawn and sits in silence is building something the world cannot see — yet.', source: 'Svadhyaya' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', source: 'James Clear' },
  { text: 'Compound interest works on habits the same way it works on money.', source: 'James Clear' },
  { text: 'Win the morning, win the day.', source: 'Tim Ferriss' },
  { text: 'Begin with the end in mind.', source: 'Stephen R. Covey' },
  { text: 'Sow a thought, reap a habit; sow a habit, reap a character; sow a character, reap a destiny.', source: 'Ancient wisdom' },
  { text: 'Every note you sing correctly is a prayer answered.', source: 'Carnatic tradition' },
  { text: 'The quality of your practice determines the quality of your life.', source: 'Carnatic tradition' },
  { text: 'Ecstatic and humbler at 45. That is the north star.', source: 'Svadhyaya' },
  { text: 'The 300-book library exists to be read, not owned.', source: 'Svadhyaya · Vidyā' },
  { text: 'Invisible work must become visible. Document it before deployment, not after.', source: 'Svadhyaya · Karma' },
]

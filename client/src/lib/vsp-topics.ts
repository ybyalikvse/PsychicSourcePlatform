export interface Topic {
  id: string;
  name: string;
  icon: string;
  color: string;
  subtopics: Subtopic[];
}

export interface Subtopic {
  id: string;
  name: string;
}

export const topics: Topic[] = [
  {
    id: "love-relationships",
    name: "Love & Relationships",
    icon: "fas fa-heart",
    color: "text-red-500",
    subtopics: [
      { id: "breakup-heartbreak", name: "Breakup & Heartbreak" },
      { id: "toxic-relationships", name: "Toxic Relationships" },
      { id: "dating-loneliness", name: "Dating & Loneliness" },
      { id: "twin-flame", name: "Twin Flame & Soulmate Confusion" },
      { id: "cheating-betrayal", name: "Cheating & Betrayal" },
      { id: "divorce-separation", name: "Divorce & Separation" },
      { id: "communication-conflict", name: "Communication & Conflict" },
      { id: "commitment-stages", name: "Commitment & Relationship Stages" },
      { id: "sexual-intimacy", name: "Sexual Intimacy & Physical Connection" },
      { id: "family-pressures", name: "Family & External Pressures" },
      { id: "love-manifestation", name: "Love Manifestation & Attraction" },
      { id: "astrology-cosmic", name: "Astrology & Cosmic Influences" },
      { id: "spiritual-tools", name: "Spiritual Tools & Guidance" },
      { id: "healing-growth", name: "Healing & Growth" }
    ]
  },
  {
    id: "career-finance",
    name: "Career & Finance",
    icon: "fas fa-chart-line",
    color: "text-green-500",
    subtopics: [
      { id: "career-change", name: "Career Change & Transitions" },
      { id: "financial-stress", name: "Financial Stress & Money Anxiety" },
      { id: "entrepreneurship", name: "Entrepreneurship & Business" },
      { id: "workplace-toxic", name: "Workplace Toxicity" },
      { id: "money-manifestation", name: "Money Manifestation" },
      { id: "budgeting-saving", name: "Budgeting & Saving" },
      { id: "passive-income", name: "Passive Income Strategies" },
      { id: "job-searching", name: "Job Searching & Interviews" }
    ]
  },
  {
    id: "health-wellness",
    name: "Health & Wellness",
    icon: "fas fa-leaf",
    color: "text-emerald-500",
    subtopics: [
      { id: "chronic-illness", name: "Chronic Illness & Pain" },
      { id: "weight-body-image", name: "Weight & Body Image" },
      { id: "fitness-motivation", name: "Fitness & Motivation" },
      { id: "nutrition-diet", name: "Nutrition & Diet" },
      { id: "sleep-issues", name: "Sleep Issues" },
      { id: "energy-fatigue", name: "Energy & Chronic Fatigue" },
      { id: "holistic-healing", name: "Holistic Healing" },
      { id: "addiction-recovery", name: "Addiction & Recovery" }
    ]
  },
  {
    id: "mental-health",
    name: "Anxiety & Mental Health",
    icon: "fas fa-brain",
    color: "text-purple-500",
    subtopics: [
      { id: "anxiety-panic", name: "Anxiety & Panic Attacks" },
      { id: "depression-sadness", name: "Depression & Sadness" },
      { id: "trauma-ptsd", name: "Trauma & PTSD" },
      { id: "self-esteem", name: "Self-Esteem & Confidence" },
      { id: "overthinking", name: "Overthinking & Racing Thoughts" },
      { id: "social-anxiety", name: "Social Anxiety" },
      { id: "therapy-healing", name: "Therapy & Professional Help" },
      { id: "medication-mental-health", name: "Medication & Mental Health" }
    ]
  },
  {
    id: "family-parenting",
    name: "Family & Parenting",
    icon: "fas fa-users",
    color: "text-blue-500",
    subtopics: [
      { id: "difficult-children", name: "Difficult Children & Behavior" },
      { id: "family-drama", name: "Family Drama & Toxic Relatives" },
      { id: "parenting-stress", name: "Parenting Stress & Guilt" },
      { id: "single-parenting", name: "Single Parenting" },
      { id: "blended-families", name: "Blended Families" },
      { id: "teen-struggles", name: "Teen Struggles & Communication" },
      { id: "elderly-parents", name: "Caring for Elderly Parents" },
      { id: "infertility-pregnancy", name: "Infertility & Pregnancy Loss" }
    ]
  },
  {
    id: "life-transitions",
    name: "Life Transitions & Major Change",
    icon: "fas fa-route",
    color: "text-orange-500",
    subtopics: [
      { id: "midlife-crisis", name: "Midlife Crisis & Identity" },
      { id: "moving-relocation", name: "Moving & Relocation" },
      { id: "retirement", name: "Retirement & Aging" },
      { id: "major-decisions", name: "Major Life Decisions" },
      { id: "starting-over", name: "Starting Over" },
      { id: "empty-nest", name: "Empty Nest Syndrome" },
      { id: "life-purpose", name: "Finding Life Purpose" },
      { id: "change-resistance", name: "Resistance to Change" }
    ]
  },
  {
    id: "loss-grieving",
    name: "Loss & Grieving",
    icon: "fas fa-dove",
    color: "text-gray-500",
    subtopics: [
      { id: "death-loved-one", name: "Death of Loved One" },
      { id: "pet-loss", name: "Pet Loss" },
      { id: "job-loss", name: "Job Loss" },
      { id: "friendship-loss", name: "Loss of Friendship" },
      { id: "miscarriage", name: "Miscarriage & Pregnancy Loss" },
      { id: "home-loss", name: "Loss of Home" },
      { id: "identity-loss", name: "Loss of Identity" },
      { id: "grief-stages", name: "Grief Stages & Healing" }
    ]
  },
  {
    id: "meaning-destiny",
    name: "Life, Destiny & Meaning",
    icon: "fas fa-compass",
    color: "text-indigo-500",
    subtopics: [
      { id: "life-purpose", name: "Finding Life Purpose" },
      { id: "spiritual-awakening", name: "Spiritual Awakening" },
      { id: "manifestation", name: "Manifestation & Law of Attraction" },
      { id: "soul-purpose", name: "Soul Purpose & Mission" },
      { id: "synchronicities", name: "Synchronicities & Signs" },
      { id: "meditation-mindfulness", name: "Meditation & Mindfulness" },
      { id: "energy-healing", name: "Energy Healing" },
      { id: "psychic-abilities", name: "Psychic Abilities & Intuition" }
    ]
  }
];

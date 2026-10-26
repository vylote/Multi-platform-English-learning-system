export const TOPIC_ICON_MAP = {
  "Food & Drink": "/assets/topics/food-drink.svg",
  "Travel & Transport": "/assets/topics/travel-transport.svg",
  "Family & Relationships": "/assets/topics/family-relationships.svg",
  "Sports & Entertainment": "/assets/topics/sports-entertainment.svg",
  "Actions & States": "/assets/topics/actions-states.svg",
  "Shopping & Fashion": "/assets/topics/shopping-fashion.svg",
  "Home & Daily Life": "/assets/topics/home-daily-life.svg",
  "Time & Seasons": "/assets/topics/time-seasons.svg",
  "Numbers & Measurement": "/assets/topics/numbers-measurement.svg",
  "Colors & Shapes": "/assets/topics/colors-shapes.svg",
  "Feelings & Senses": "/assets/topics/feelings-senses.svg",
  "Weather & Atmosphere": "/assets/topics/weather-atmosphere.svg",
  "Business & Finance": "/assets/topics/business-finance.svg",
  "Health & Medicine": "/assets/topics/health-medicine.svg",
  "Education & Science": "/assets/topics/education-science.svg",
  "Nature & Environment": "/assets/topics/nature-environment.svg",
  "Emotions & Personality": "/assets/topics/emotions-personality.svg",
  "Communication & Media": "/assets/topics/communication-media.svg",
  "Arts & Literature": "/assets/topics/arts-literature.svg",
  "History & Culture": "/assets/topics/history-culture.svg",
  "Geography & Places": "/assets/topics/geography-places.svg",
  "Work & Professions": "/assets/topics/work-professions.svg",
  "Materials & Substances": "/assets/topics/materials-substances.svg",
  "Buildings & Infrastructure": "/assets/topics/buildings-infrastructure.svg",
  "Technology & IT": "/assets/topics/technology-it.svg",
  "Law & Society": "/assets/topics/law-society.svg",
  "Philosophy & Thinking": "/assets/topics/philosophy-thinking.svg",
  "Abstract Concepts": "/assets/topics/abstract-concepts.svg",
  "Politics & Government": "/assets/topics/politics-government.svg",
  "Military & Warfare": "/assets/topics/military-warfare.svg",
  "Agriculture & Farming": "/assets/topics/agriculture-farming.svg",
  "Industry & Manufacturing": "/assets/topics/industry-manufacturing.svg",
  "Energy & Resources": "/assets/topics/energy-resources.svg",
  "Religion & Spirituality": "/assets/topics/religion-spirituality.svg",
  "Crime & Justice": "/assets/topics/crime-justice.svg",
  "Disasters & Emergencies": "/assets/topics/disasters-emergencies.svg",
};

export function getTopicIconPath(topicName) {
  return TOPIC_ICON_MAP[topicName] || "/assets/icons/mascot.svg";
}

export function TopicIcon({ topicName, className = "w-7 h-7", alt }) {
  const iconSrc = getTopicIconPath(topicName);
  return (
    <img
      src={iconSrc}
      alt={alt || topicName || "Chủ đề"}
      className={`object-contain select-none shrink-0 ${className}`}
      loading="lazy"
    />
  );
}

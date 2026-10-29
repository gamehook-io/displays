// Stat rows by generation: [key, label]. Gen 1 has a single Special stat.
export const statDefinitions = [['hp', 'HP'], ['speed', 'Spe'], ['attack', 'Atk'], ['special_attack', 'SpA'], ['defense', 'Def'], ['special_defense', 'SpD']];
export const statsForGeneration = generation => generation === 1
  ? [['hp', 'HP'], ['speed', 'Spe'], ['attack', 'Atk'], ['defense', 'Def'], ['special', 'Special']]
  : statDefinitions;

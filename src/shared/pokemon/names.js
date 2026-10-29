import pokemon from './pokemon-types.json' with { type: 'json' };

// Species names in the data tables are lowercase and hyphenated ("mr-mime"); title-case them for display.
export const titleCase = text => String(text).replace(/-/g, ' ').replace(/\b[a-z]/g, letter => letter.toUpperCase());
export const speciesName = dex => pokemon[dex]?.name ? titleCase(pokemon[dex].name) : null;

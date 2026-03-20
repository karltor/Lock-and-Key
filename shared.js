// Lagnamn och färger som används av både host.html och play.html
export const ADJECTIVES = ["De Snabba", "De Starka", "De Listiga", "De Modiga", "De Galna", "De Smarta", "De Vilda", "De Mystiska", "De Tysta", "De Lysande"];
export const NOUNS = ["Stormarna", "Örnarna", "Tornen", "Vargarna", "Björnarna", "Hajarna", "Lejonen", "Tigrarna", "Falkarna", "Kobrorna"];
export const TEAM_COLORS = ["#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff", "#e8cbff", "#ffcbf2", "#e2f0cb", "#ffdac1", "#c5a3ff"];

export function getTeamName(index) {
    const adjIndex = Math.floor((index - 1) / NOUNS.length) % ADJECTIVES.length;
    const nounIndex = (index - 1) % NOUNS.length;
    return index <= NOUNS.length ? NOUNS[nounIndex] : `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`;
}

export function getTeamColor(index) {
    return TEAM_COLORS[(index - 1) % TEAM_COLORS.length];
}

// Poängberäkning: 100 * 0.8^(fel inom bonusklues) * 0.9^(extra fel), minimum 10
export function calculatePoints(wrongGuesses, totalBonusClues) {
    const p20 = Math.min(wrongGuesses, totalBonusClues);
    const p10 = Math.max(0, wrongGuesses - totalBonusClues);
    const p = 100 * Math.pow(0.8, p20) * Math.pow(0.9, p10);
    return Math.max(10, Math.floor(p));
}

// Enkel hash för att dölja rätta svar i databasen
export function hashAnswer(str) {
    let hash = 0;
    const s = str.toString().trim().toLowerCase();
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

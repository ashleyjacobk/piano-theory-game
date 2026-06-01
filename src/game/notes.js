export const NOTES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B"
];

export const isEnharmonicallyEquivalent = (note1, note2) => {
    if (!note1 || !note2) return false;
    const clean1 = note1.trim().toUpperCase();
    const clean2 = note2.trim().toUpperCase();
    if (clean1 === clean2) return true;

    const equivalents = {
        "C#": "DB", "DB": "C#",
        "D#": "EB", "EB": "D#",
        "F#": "GB", "GB": "F#",
        "G#": "AB", "AB": "G#",
        "A#": "BB", "BB": "A#",
    };

    return equivalents[clean1] === clean2;
};

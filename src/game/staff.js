export const getBaseNoteLetter = (noteName) => {
  if (!noteName) return "C";
  return noteName.charAt(0).toUpperCase();
};

export const getTrebleStep = (note) => {
  const base = getBaseNoteLetter(note);
  const steps = {
    "C": -2,
    "D": -1,
    "E": 0,
    "F": 1,
    "G": 2,
    "A": 3,
    "B": 4,
  };
  return steps[base] !== undefined ? steps[base] : 0;
};

export const getBassStep = (note) => {
  const base = getBaseNoteLetter(note);
  const steps = {
    "C": 3,
    "D": 4,
    "E": 5,
    "F": 6,
    "G": 7,
    "A": 8,
    "B": 9,
  };
  return steps[base] !== undefined ? steps[base] : 3;
};

// Hebrew letters א–ת (U+05D0–U+05EA). Vowel points and punctuation alone don't count.
export const HEBREW_LETTER_PATTERN = "[\u05D0-\u05EA]";

const hebrewLetter = new RegExp(HEBREW_LETTER_PATTERN);

/** True when the text contains at least one Hebrew letter. */
export const hasHebrew = (text: string): boolean => hebrewLetter.test(text);

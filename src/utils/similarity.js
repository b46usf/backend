const normalizeText = (text = '') =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildTokenSet = (text = '') => new Set(normalizeText(text).split(' ').filter(Boolean));

const calculateJaccardSimilarity = (sourceText = '', targetText = '') => {
  const sourceTokens = buildTokenSet(sourceText);
  const targetTokens = buildTokenSet(targetText);

  if (!sourceTokens.size && !targetTokens.size) {
    return 100;
  }

  const intersectionSize = [...sourceTokens].filter((token) => targetTokens.has(token)).length;
  const unionSize = new Set([...sourceTokens, ...targetTokens]).size;

  return Number(((intersectionSize / unionSize) * 100).toFixed(2));
};

module.exports = {
  calculateJaccardSimilarity,
  normalizeText,
};

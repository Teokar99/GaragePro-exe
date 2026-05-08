export const normalize = (text: string | null | undefined): string => {
  if (!text) return "";

  return text
    .toString()
    .toLowerCase()
    .replace(/\u03c2/g, "\u03c3") // final sigma \u2192 regular sigma so \u0393\u0399\u03a9\u03a1\u0393\u039f\u03a3 and \u0393\u03b9\u03ce\u03c1\u03b3\u03bf\u03c2 match
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const searchMatch = (
  searchTerm: string,
  ...fields: (string | null | undefined)[]
): boolean => {
  const term = normalize(searchTerm);

  return fields.some(field =>
    normalize(field).includes(term)
  );
};

export const normalize = (text: string | null | undefined): string => {
  if (!text) return "";

  return text
    .toString()
    .toLowerCase()
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

export const addLeadingSlash = (str) => {
  return str.startsWith("/") ? str : `/${str}`;
};

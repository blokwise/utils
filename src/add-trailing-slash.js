export const addTrailingSlash = (str) => {
  return str.replace(/\/?(\?|#|$)/, "/$1");
};

import { camelCase } from "./camel-case";
import { upperFirst } from "./upper-first";

export const pascalCase = (str) => {
  return upperFirst(camelCase(str));
};

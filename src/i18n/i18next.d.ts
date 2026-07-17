import "i18next";
import type { english } from "./locales/en";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    returnNull: false;
    resources: {
      translation: typeof english;
    };
  }
}

import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  const validLocale = locale && ["fi", "en"].includes(locale) ? locale : "fi";
  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});

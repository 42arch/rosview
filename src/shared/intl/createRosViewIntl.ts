import { createIntl, createIntlCache } from 'react-intl';
import { getRosViewMessages, type RosViewLocale } from './loadRosViewMessages';

const intlCache = createIntlCache();

function localeFor(lang: RosViewLocale): string {
  if (lang === 'zh') return 'zh-CN';
  if (lang === 'ja') return 'ja-JP';
  return 'en';
}

/** For strings outside `IntlProvider` (e.g. `RosViewer` data effects). */
export function createRosViewIntl(lang: RosViewLocale) {
  return createIntl(
    {
      locale: localeFor(lang),
      defaultLocale: 'en',
      messages: getRosViewMessages(lang),
    },
    intlCache,
  );
}

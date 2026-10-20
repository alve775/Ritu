'use client';
import { usePlanner } from './planner-provider';

export function LanguageSwitch() {
  const { t, language, setLanguage } = usePlanner();
  return (
    <div className="language-switch" role="group" aria-label={t('Language', 'ভাষা')}>
      <button onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>
        EN
      </button>
      <button onClick={() => setLanguage('bn')} aria-pressed={language === 'bn'} lang="bn">
        বাংলা
      </button>
    </div>
  );
}

import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Language
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">App Language</span>
          <LanguageSwitcher />
        </div>
      </section>
    </div>
  );
}

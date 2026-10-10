import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  ShoppingBag,
  Bell,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface TestResultItem {
  id: string;
  name: string;
  category: 'onboarding' | 'sales_ai' | 'order_pos' | 'notifications' | 'merchant_takeover' | 'security';
  status: 'passed' | 'failed' | 'warning';
  durationMs: number;
  summary: string;
  details?: Record<string, any>;
  error?: string;
}

export interface SeniorTestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  healthScore: number;
  results: TestResultItem[];
}

interface SeniorTestRunnerProps {
  onNavigateToMobilePortal?: () => void;
}

export const SeniorTestRunner: React.FC<SeniorTestRunnerProps> = ({ onNavigateToMobilePortal }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SeniorTestSuiteReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});

  const fetchLatestReport = async () => {
    try {
      const res = await fetch('/api/test/latest-results');
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (e: any) {
      console.warn('Could not load latest test report:', e);
    }
  };

  useEffect(() => {
    fetchLatestReport();
  }, []);

  const runFullSuite = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/test/run-senior-suite', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        // Expand any failed or warning tests by default
        const toExpand: Record<string, boolean> = {};
        data.report.results.forEach((r: TestResultItem) => {
          if (r.status !== 'passed') toExpand[r.id] = true;
        });
        setExpandedTests(toExpand);
      } else {
        setError(data.error || 'فشل تشغيل فحص النظام الشامل');
      }
    } catch (e: any) {
      setError(e.message || 'حدث خطأ في الاتصال بالخادم أثناء الفحص');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryIcon = (category: TestResultItem['category']) => {
    switch (category) {
      case 'onboarding':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'sales_ai':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'order_pos':
        return <ShoppingBag className="w-4 h-4 text-amber-400" />;
      case 'notifications':
        return <Bell className="w-4 h-4 text-rose-400" />;
      case 'merchant_takeover':
        return <Smartphone className="w-4 h-4 text-teal-400" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>منظومة الاختبارات الهندسية الشاملة (Senior Test Suite)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                    6/6 End-to-End Tests
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  فحص آلي متكامل يحاكي دورة حياة العميل والتاجر: أونبوردينج المتجر، التفاوض بالعامية، استخراج الأوردر بالجنيه المصري، إشعار الواتساب التلقائي، والتدخل اليدوي بالـ #pause.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onNavigateToMobilePortal && (
              <button
                onClick={onNavigateToMobilePortal}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition active:scale-95 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>فتح بوابة التاجر (PWA)</span>
              </button>
            )}

            <button
              onClick={runFullSuite}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-white" />
                  <span>جاري الفحص الهندسي للسيستم...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>بدء الفحص الشامل للنظام الآن</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Metrics Overview Cards */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-800/80">
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/60">
              <span className="text-[11px] text-slate-400 block mb-1">مؤشر صحة النظام (Health Score)</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black font-mono ${report.healthScore >= 90 ? 'text-emerald-400' : report.healthScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {report.healthScore}%
                </span>
                <span className="text-[10px] text-slate-400">
                  ({report.passedCount}/{report.totalTests} ناجح)
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/60">
              <span className="text-[11px] text-slate-400 block mb-1">سرعة تنفيذ الفحص الكامل</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-cyan-400">
                  {(report.durationMs / 1000).toFixed(2)}s
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({report.durationMs}ms)
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/60">
              <span className="text-[11px] text-slate-400 block mb-1">منظومة الحماية والأمان</span>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">OWASP LLM01 درع مفعل</span>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/60">
              <span className="text-[11px] text-slate-400 block mb-1">حالة البث والربط المباشر</span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">الواتساب + Baileys جاهز</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm">
          <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Tests Breakdown Table / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300">سجل الاختبارات الهندسية الـ 6 المفصلة:</span>
          <span>آخر فحص: {report ? new Date(report.timestamp).toLocaleTimeString('ar-EG') : 'لم يتم الفحص بعد'}</span>
        </div>

        {report?.results.map((test, index) => {
          const isExpanded = !!expandedTests[test.id];

          return (
            <div
              key={test.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                test.status === 'passed'
                  ? 'bg-slate-900/70 border-slate-800/90 hover:border-emerald-500/40'
                  : test.status === 'warning'
                  ? 'bg-amber-950/20 border-amber-800/60'
                  : 'bg-rose-950/20 border-rose-800/70'
              }`}
            >
              <div
                onClick={() => toggleExpand(test.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-slate-950 border border-slate-800">
                    {test.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : test.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400 font-bold">
                        #{index + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {test.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
                        {test.category}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {test.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-slate-400">
                    {test.durationMs}ms
                  </span>

                  <span
                    className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      test.status === 'passed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : test.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {test.status === 'passed' ? 'ناجح ✅' : test.status === 'warning' ? 'تنبيه ⚠️' : 'فشل ❌'}
                  </span>

                  <button className="text-slate-400 hover:text-white p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Details Panel */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 bg-slate-950/60 space-y-3 text-xs">
                  {test.error && (
                    <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 space-y-1">
                      <span className="font-bold block">تفاصيل الخطأ المسجل:</span>
                      <pre className="font-mono text-[11px] whitespace-pre-wrap">{test.error}</pre>
                    </div>
                  )}

                  {test.details && (
                    <div className="space-y-1.5">
                      <span className="text-slate-400 font-bold block flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>البيانات المحللة ومخرجات الفحص (Diagnostics Payload):</span>
                      </span>
                      <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-300/90 overflow-x-auto scrollbar-none whitespace-pre-wrap">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  {test.id === 'TEST_04_MERCHANT_NOTIFICATION' && test.details?.sampleAlertPreview && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                      <span className="text-emerald-300 font-bold block text-xs">
                        نص رسالة التنبيه الفورية المرسلة لصاحب المحل على واتساب:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-950/90 font-mono text-xs text-white whitespace-pre-wrap border border-emerald-900/60">
                        {test.details.sampleAlertPreview}
                      </pre>
                    </div>
                  )}

                  {test.id === 'TEST_05_MERCHANT_TAKEOVER' && (
                    <div className="mt-2 p-3 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-1 text-teal-200">
                      <span className="font-bold block text-xs">طريقة استخدام التاجر لأوامر واتساب:</span>
                      <p className="text-[11px] text-slate-300">
                        التاجر يرسل كلمة <code className="text-amber-300 font-bold font-mono">#pause</code> أو <code className="text-amber-300 font-bold">وقف</code> في شات الواتساب لإسكات البوت فورياً والرد هو بنفسه. وعند الانتهاء يرسل <code className="text-emerald-300 font-bold font-mono">#resume</code> أو <code className="text-emerald-300 font-bold">شغل</code> ليعود البوت للرد التلقائي.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

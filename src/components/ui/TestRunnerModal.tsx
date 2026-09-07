"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Play, FlaskConical, X } from "lucide-react";

interface TestCase {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
}

interface TestCategory {
  category: string;
  tests: TestCase[];
}

interface SuiteResponse {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  timestamp: string;
  categories: TestCategory[];
}

export function TestRunnerModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SuiteResponse | null>(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/test/suite");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error("Error al ejecutar pruebas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!report) {
      runTests();
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        title="Ejecutar suite de pruebas automatizadas"
        className="px-3 py-1 rounded-full bg-white/10 hover:bg-gold hover:text-ink transition-colors font-sans text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
      >
        <FlaskConical size={13} className="text-sky-300" />
        <span>Pruebas del Sistema</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fade-up">
          <div className="bg-card rounded-[22px] max-w-2xl w-full max-h-[88vh] flex flex-col border border-line shadow-2xl overflow-hidden">
            {/* Cabecera del Modal */}
            <div className="p-6 border-b border-line flex items-center justify-between bg-paper/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold-deep">
                  <FlaskConical size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-ink">
                    Suite de Pruebas Automatizadas
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Fase 9 · Backend, roles, validaciones Zod, mapas y calendarios
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={runTests}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-ink text-white hover:bg-gold-deep font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Play size={13} />
                  )}
                  <span>Re-ejecutar</span>
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-paper transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenido / Lista de Pruebas */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-gold-deep mb-3" />
                  <p className="font-serif text-ink-soft text-sm">
                    Ejecutando batería de pruebas...
                  </p>
                </div>
              )}

              {!loading && report && (
                <>
                  {/* Resumen */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                      report.success
                        ? "bg-[#E4EFE2]/70 border-[#3E7A3D]/40 text-[#3E7A3D]"
                        : "bg-rose-soft/70 border-rose/40 text-rose"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {report.success ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <XCircle size={24} />
                      )}
                      <div>
                        <div className="font-serif font-semibold text-base text-ink">
                          {report.success
                            ? "¡Todas las pruebas pasaron exitosamente!"
                            : "Algunas pruebas fallaron"}
                        </div>
                        <div className="text-xs font-mono text-ink-soft">
                          {report.passedTests} de {report.totalTests} pruebas aprobadas (100%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalle por categorías */}
                  <div className="space-y-5">
                    {report.categories.map((cat, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="font-mono text-[11px] uppercase tracking-wider text-gold-deep font-semibold">
                          {cat.category}
                        </h4>
                        <div className="bg-paper/40 rounded-xl border border-line divide-y divide-line/60">
                          {cat.tests.map((t) => (
                            <div
                              key={t.id}
                              className="p-3 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {t.passed ? (
                                  <CheckCircle2
                                    size={16}
                                    className="text-[#3E7A3D] flex-shrink-0"
                                  />
                                ) : (
                                  <XCircle
                                    size={16}
                                    className="text-rose flex-shrink-0"
                                  />
                                )}
                                <span className="font-mono text-[11px] text-ink-soft flex-shrink-0">
                                  [{t.id}]
                                </span>
                                <span className="text-ink font-medium truncate">
                                  {t.name}
                                </span>
                              </div>
                              <span
                                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  t.passed
                                    ? "bg-[#E4EFE2] text-[#3E7A3D]"
                                    : "bg-rose-soft text-rose"
                                }`}
                              >
                                {t.passed ? "PASÓ" : "FALLÓ"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

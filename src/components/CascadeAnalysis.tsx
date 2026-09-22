import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowDown, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  CornerDownRight, 
  Flame, 
  Lightbulb, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { CalculatedTask, ScheduleSimulationResult } from '../types';

interface CascadeAnalysisProps {
  simulation: ScheduleSimulationResult;
  selectedTaskId: string | null;
  delayDays: number;
}

export const CascadeAnalysis: React.FC<CascadeAnalysisProps> = ({
  simulation,
  selectedTaskId,
  delayDays,
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<{ summary?: string; recommendations: string[] } | null>(null);

  const selectedTask = simulation.tasks.find(t => t.id === selectedTaskId);
  const projectDelay = simulation.projectDelayDays;
  const isDirectlyCritical = selectedTask?.isBaselineCritical;
  const slackAvailable = selectedTask?.baselineSlack ?? 0;

  // Determine risk level
  const riskLevel: 'low' | 'medium' | 'high' = 
    projectDelay > 5 || (isDirectlyCritical && delayDays > 3)
      ? 'high'
      : projectDelay > 0
      ? 'medium'
      : 'low';

  const requestAiMitigation = async () => {
    if (!selectedTask || delayDays === 0) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/analyze-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delayedTaskName: selectedTask.name,
          delayDays,
          projectShiftDays: projectDelay,
          affectedTasks: simulation.affectedTaskIds.map(id => {
            const t = simulation.tasks.find(x => x.id === id);
            return t ? `${t.name} (+${t.finishDelayShift}d)` : id;
          }),
          criticalPathTasks: simulation.simulatedCriticalPath.map(id => {
            const t = simulation.tasks.find(x => x.id === id);
            return t?.name || id;
          }),
        }),
      });

      const data = await response.json();
      setAiAdvice(data);
    } catch (err) {
      console.error('Error fetching AI advice:', err);
      // Fallback
      setAiAdvice({
        summary: 'Recomendações baseadas nas melhores práticas do Guia PMBOK.',
        recommendations: [
          'Aplique paralelização (Fast-tracking) nas atividades seguintes do caminho crítico.',
          'Considere alocar recursos extras (Crashing) na próxima tarefa para recuperar o atraso.',
          'Negocie a data de entrega dos marcos secundários para manter o foco na entrega principal.',
        ],
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Análise Detalhada do Efeito Cascata
            </h3>
            <p className="text-xs text-slate-500">
              Rastreamento de causa e efeito: como o atraso desta atividade se propaga pelas dependências
            </p>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Classificação de Risco:</span>
          {riskLevel === 'high' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Alto Risco de Prazo
            </span>
          ) : riskLevel === 'medium' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Impacto Moderado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Risco Controlado (Sob Folga)
            </span>
          )}
        </div>
      </div>

      {delayDays === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">Nenhum atraso simulado no momento</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Selecione uma tarefa no controle de atraso acima ou clique em <strong>+ / -</strong> em qualquer barra do Gantt para visualizar a reação em cadeia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Visual Timeline of Cascade Steps (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>Trilha de Propagação (Causa & Efeito)</span>
            </h4>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {/* Step 1: Root Cause */}
              <div className="relative">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white shadow-2xs">
                  1
                </div>
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>Origem: {selectedTask?.name}</span>
                    </span>
                    <span className="text-xs font-extrabold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
                      +{delayDays}d atraso
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 mt-1">
                    Esta atividade teve sua duração estendida de <strong>{selectedTask?.duration} dias</strong> para{' '}
                    <strong>{(selectedTask?.duration || 0) + delayDays} dias</strong>.
                  </p>
                  <div className="mt-2 text-[11px] text-amber-800 font-medium flex items-center gap-2">
                    {isDirectlyCritical ? (
                      <span className="flex items-center gap-1 text-rose-700 font-bold">
                        <Flame className="w-3 h-3" /> Tarefa crítica: não possui folga para absorver atraso.
                      </span>
                    ) : (
                      <span>
                        Folga disponível no plano: <strong>{slackAvailable} dias</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Intermediate ripple reactions */}
              {simulation.cascadeChain.filter(s => s.type !== 'direct_source').map((step, idx) => {
                const isAbsorbed = step.type === 'slack_absorbed';

                return (
                  <div key={step.taskId} className="relative">
                    <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white shadow-2xs ${
                      isAbsorbed ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}>
                      {idx + 2}
                    </div>

                    <div className={`rounded-xl p-3.5 border ${
                      isAbsorbed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-orange-50/70 border-orange-200 text-orange-950'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 opacity-60" />
                          <span>{step.taskName}</span>
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isAbsorbed ? 'bg-emerald-200/70 text-emerald-900' : 'bg-orange-200/70 text-orange-900'
                        }`}>
                          {isAbsorbed ? 'Folga Absorvida' : `+${step.daysDelayed}d adiada`}
                        </span>
                      </div>
                      <p className="text-xs mt-1 opacity-90">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Step 3: Final Delivery Milestone */}
              <div className="relative">
                <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white shadow-2xs ${
                  projectDelay > 0 ? 'bg-rose-600' : 'bg-emerald-600'
                }`}>
                  ★
                </div>

                <div className={`rounded-xl p-3.5 border ${
                  projectDelay > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wide">
                      Marco Final do Projeto
                    </span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-white/70">
                      {projectDelay > 0 ? `+${projectDelay} dias de atraso` : 'Prazo Cumprido'}
                    </span>
                  </div>
                  <p className="text-xs mt-1">
                    {projectDelay > 0 ? (
                      <>
                        A entrega final passou do <strong>Dia {simulation.baselineProjectDuration}</strong> para o{' '}
                        <strong>Dia {simulation.simulatedProjectDuration}</strong>.
                      </>
                    ) : (
                      <>
                        As folgas internas absorveram todo o atraso de {delayDays} dias. A entrega permanece no{' '}
                        <strong>Dia {simulation.baselineProjectDuration}</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Management & Recovery Insights (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Plano de Mitigação & Recuperação</span>
                </h4>

                <button
                  type="button"
                  onClick={requestAiMitigation}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Analisando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Análise com IA</span>
                    </>
                  )}
                </button>
              </div>

              {aiAdvice?.summary && (
                <div className="text-xs font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/80 mb-3">
                  {aiAdvice.summary}
                </div>
              )}

              <div className="space-y-2 text-xs">
                {(aiAdvice?.recommendations || [
                  `Fast-tracking: verifique se alguma tarefa sucessora (${simulation.affectedTaskIds.slice(0, 2).join(', ') || 'da cadeia'}) pode iniciar antes do término total de ${selectedTask?.name}.`,
                  `Crashing: avalie alocar mais 1 recurso na tarefa crítica para comprimir o cronograma em ${Math.min(delayDays, 3)} dias.`,
                  `Proteja as tarefas paralelas que tiveram folga reduzida para evitar que novos atrasos criem caminhos críticos múltiplos.`,
                ]).map((rec, rIdx) => (
                  <div key={rIdx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      {rIdx + 1}
                    </span>
                    <span className="text-slate-700 leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick PM Concept card */}
            <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100 text-xs text-indigo-950 space-y-2">
              <span className="font-bold flex items-center gap-1 text-indigo-900">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                Como funciona a Folga no Caminho Crítico?
              </span>
              <p className="text-indigo-900/80 leading-relaxed">
                Tarefas com <strong>Folga {'>'} 0</strong> possuem margem de segurança. Um atraso menor ou igual à folga <em>não afeta a entrega final</em>. Já tarefas no <strong>Caminho Crítico (Folga = 0)</strong> transferem 100% de qualquer atraso diretamente para o prazo final do projeto.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

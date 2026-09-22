import React from 'react';
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  HelpCircle, 
  Sliders, 
  TrendingUp, 
  Zap,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { CalculatedTask, ScheduleSimulationResult } from '../types';

interface DelayControllerProps {
  simulation: ScheduleSimulationResult;
  selectedTaskId: string | null;
  delayDays: number;
  onSelectTask: (taskId: string) => void;
  onChangeDelay: (days: number) => void;
  showBaselineComparison: boolean;
  onToggleBaselineComparison: (show: boolean) => void;
}

export const DelayController: React.FC<DelayControllerProps> = ({
  simulation,
  selectedTaskId,
  delayDays,
  onSelectTask,
  onChangeDelay,
  showBaselineComparison,
  onToggleBaselineComparison,
}) => {
  const currentTask = simulation.tasks.find(t => t.id === selectedTaskId) || simulation.tasks[0];
  const delayPresets = [0, 1, 2, 3, 5, 7, 10, 15];

  // Quick metrics
  const isDirectlyCritical = currentTask?.isBaselineCritical;
  const taskSlack = currentTask?.baselineSlack ?? 0;
  const projectDelay = simulation.projectDelayDays;
  const affectedCount = simulation.affectedTaskIds.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Simulador de Impacto e Atraso</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                O que acontece se atrasar?
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Escolha uma tarefa e ajuste o atraso para ver o efeito cascata imediato em todo o cronograma.
            </p>
          </div>
        </div>

        {/* Baseline comparison toggle */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 select-none transition-colors">
            <input
              type="checkbox"
              checked={showBaselineComparison}
              onChange={(e) => onToggleBaselineComparison(e.target.checked)}
              className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
            />
            <span>Exibir Comparativo com Linha de Base</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
        {/* Left Column: Task selector & Delay slider (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Task Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              1. Selecione a Tarefa para Testar Atraso
            </label>
            <div className="relative">
              <select
                value={selectedTaskId || ''}
                onChange={(e) => onSelectTask(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-900 text-sm rounded-xl py-2.5 px-3.5 pr-8 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-colors cursor-pointer"
              >
                {simulation.tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    [{task.id}] {task.name} ({task.duration}d) — {task.isBaselineCritical ? '⚠️ No Caminho Crítico (Folga: 0d)' : `🛡️ Folga: ${task.baselineSlack}d`}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Task Info Pill */}
            {currentTask && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500">
                  Fase: <strong className="text-slate-700 font-semibold">{currentTask.phase}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">
                  Duração Original: <strong className="text-slate-700 font-semibold">{currentTask.duration} dias</strong>
                </span>
                <span className="text-slate-300">•</span>
                {isDirectlyCritical ? (
                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-semibold border border-rose-200/80">
                    <Flame className="w-3 h-3 text-rose-600" />
                    Caminho Crítico (Qualquer atraso estende o projeto)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200/80">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Folga Total: {taskSlack} dia{taskSlack > 1 ? 's' : ''} (Pode atrasar até {taskSlack}d sem afetar a entrega)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Delay Slider & Presets */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span>2. Inserir Atraso na Tarefa</span>
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-base font-extrabold px-2.5 py-0.5 rounded-lg border ${
                  delayDays > 0 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-slate-200/70 text-slate-700 border-slate-300'
                }`}>
                  +{delayDays} {delayDays === 1 ? 'dia' : 'dias'}
                </span>
                {delayDays > 0 && (
                  <button
                    type="button"
                    onClick={() => onChangeDelay(0)}
                    className="text-xs text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title="Zerar atraso desta tarefa"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Slider input */}
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={delayDays}
              onChange={(e) => onChangeDelay(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-3"
            />

            {/* Preset quick buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1 font-medium">Atalhos:</span>
              {delayPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeDelay(preset)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    delayDays === preset
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {preset === 0 ? 'Sem Atraso' : `+${preset}d`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Impact Cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-2 gap-2.5 h-full">
            {/* Project Finish Shift Card */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              projectDelay > 0 
                ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  Impacto na Entrega
                </span>
                {projectDelay > 0 ? (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>

              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {projectDelay > 0 ? `+${projectDelay} dias` : '0 dias'}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {projectDelay > 0 ? (
                    <span>O prazo final foi postergado</span>
                  ) : delayDays > 0 ? (
                    <span className="text-emerald-700 font-semibold">Absorvido pela folga existente!</span>
                  ) : (
                    <span>Cronograma 100% no prazo</span>
                  )}
                </div>
              </div>

              <div className="text-xs pt-2 border-t border-current/10 flex items-center justify-between font-medium">
                <span>Original: {simulation.baselineProjectDuration}d</span>
                <ArrowRight className="w-3 h-3 opacity-60" />
                <span className="font-bold">Novo: {simulation.simulatedProjectDuration}d</span>
              </div>
            </div>

            {/* Affected Tasks Count Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Efeito Cascata
                </span>
                <TrendingUp className="w-4 h-4 text-slate-500" />
              </div>

              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {delayDays > 0 ? affectedCount : 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {affectedCount === 1 ? 'tarefa empurrada' : 'tarefas empurradas'}
                </div>
              </div>

              <div className="text-xs pt-2 border-t border-slate-200/60 text-slate-600 font-medium">
                {delayDays > 0 ? (
                  <span>{simulation.cascadeChain.length} nós na cadeia de reação</span>
                ) : (
                  <span>Nenhum atraso simulado</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Explanation Banner */}
          <div className="text-xs rounded-xl p-2.5 bg-indigo-50/70 border border-indigo-100 text-indigo-900 flex items-start gap-2">
            <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              {delayDays === 0 ? (
                <span>Mova o seletor acima para simular o que acontece quando esta tarefa atrasa.</span>
              ) : isDirectlyCritical ? (
                <span>
                  <strong>Atenção:</strong> Como <strong>{currentTask.name}</strong> está no caminho crítico, cada dia de atraso reflete <strong>1:1</strong> no atraso da entrega final.
                </span>
              ) : delayDays <= taskSlack ? (
                <span>
                  <strong>Folga protegida:</strong> O atraso de {delayDays}d foi totalmente absorvido pela folga de {taskSlack}d. O projeto final <strong>não</strong> sofreu atraso!
                </span>
              ) : (
                <span>
                  <strong>Folga estourada:</strong> A tarefa absorveu {taskSlack}d de folga, mas os {delayDays - taskSlack}d excedentes empurraram as tarefas seguintes e a entrega final.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

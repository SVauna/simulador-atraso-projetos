import React from 'react';
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Flame, 
  Minus, 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp,
  Clock,
  CornerDownRight,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { CalculatedTask, ScheduleSimulationResult } from '../types';

interface SimpleCascadeViewProps {
  simulation: ScheduleSimulationResult;
  selectedTaskId: string | null;
  delayDays: number;
  onSelectTask: (taskId: string) => void;
  onChangeDelay: (days: number) => void;
  onOpenInstructionGuide?: () => void;
}

export const SimpleCascadeView: React.FC<SimpleCascadeViewProps> = ({
  simulation,
  selectedTaskId,
  delayDays,
  onSelectTask,
  onChangeDelay,
  onOpenInstructionGuide,
}) => {
  const selectedTask = simulation.tasks.find(t => t.id === selectedTaskId);
  const projectDelay = simulation.projectDelayDays;
  const isDirectlyCritical = selectedTask?.isBaselineCritical;

  // Maximum days for the relative bar widths
  const maxProjectDays = Math.max(simulation.simulatedProjectDuration, simulation.baselineProjectDuration, 1);

  return (
    <div className="space-y-6">
      {/* 1. Big High-Level Delivery Impact Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        projectDelay > 0
          ? 'bg-gradient-to-r from-rose-50 via-white to-amber-50 border-rose-200 shadow-sm'
          : delayDays > 0
          ? 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-emerald-200 shadow-sm'
          : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                projectDelay > 0 ? 'bg-rose-500 animate-ping' : delayDays > 0 ? 'bg-emerald-500' : 'bg-indigo-500'
              }`} />
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {projectDelay > 0 ? (
                  <span className="text-rose-950">Atraso Total no Projeto: +{projectDelay} dias</span>
                ) : delayDays > 0 ? (
                  <span className="text-emerald-950">O Projeto Continua no Prazo! (Atraso Absorvido)</span>
                ) : (
                  <span>Cronograma em Dia (Sem Atrasos Simulados)</span>
                )}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {projectDelay > 0 ? (
                <>
                  O atraso de <strong>{delayDays} dias</strong> na tarefa <strong>"{selectedTask?.name}"</strong> estourou as folgas e empurrou a entrega final do <strong>Dia {simulation.baselineProjectDuration}</strong> para o <strong>Dia {simulation.simulatedProjectDuration}</strong>.
                </>
              ) : delayDays > 0 ? (
                <>
                  A tarefa <strong>"{selectedTask?.name}"</strong> atrasou {delayDays} dias, mas tinha folga suficiente ({selectedTask?.baselineSlack}d). Suas sucessoras não atrasaram a entrega final.
                </>
              ) : (
                <>
                  Clique em qualquer tarefa abaixo ou ajuste os botões <strong>+ / -</strong> para ver o impacto em tempo real de forma simples e direta.
                </>
              )}
            </p>
          </div>

          {/* Quick Before & After Timeline Comparison */}
          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-6 min-w-[280px]">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Prazo Original
              </span>
              <span className="text-xl font-extrabold text-slate-700">
                {simulation.baselineProjectDuration} dias
              </span>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-400">
                Prazo Simulado
              </span>
              <span className={`text-xl font-extrabold ${
                projectDelay > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {simulation.simulatedProjectDuration} dias
              </span>
            </div>
          </div>
        </div>

        {/* Visual Timeline Comparison Bar (Antes vs Depois) */}
        <div className="mt-5 pt-4 border-t border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Linha do Tempo Visual do Projeto:</span>
            <span className="font-mono text-slate-500">
              {simulation.baselineProjectDuration}d base → {simulation.simulatedProjectDuration}d atual
            </span>
          </div>

          {/* Timeline track */}
          <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden relative flex items-center p-1 border border-slate-200">
            {/* Baseline ghost bar */}
            <div
              style={{
                width: `${(simulation.baselineProjectDuration / maxProjectDays) * 100}%`,
              }}
              className="h-full bg-slate-300/80 rounded-md border-r-2 border-slate-500 flex items-center justify-end px-2 text-[10px] font-bold text-slate-700"
            >
              Meta: D{simulation.baselineProjectDuration}
            </div>

            {/* Simulated delayed extension */}
            {projectDelay > 0 && (
              <div
                style={{
                  width: `${(projectDelay / maxProjectDays) * 100}%`,
                }}
                className="h-full bg-rose-500 rounded-r-md flex items-center justify-center text-[10px] font-bold text-white shadow-xs ml-0.5 animate-pulse"
              >
                +{projectDelay}d atraso
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Domino / Chain Flow (Efeito Dominó da Tarefa Atrasada) */}
      {delayDays > 0 && selectedTask && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Efeito Dominó: O que aconteceu quando "{selectedTask.name}" atrasou?
              </h4>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Passo a passo simplificado
            </span>
          </div>

          {/* Domino Step Cards in Flex Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Domino 1: Origin */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
                  1. Origem do Atraso
                </span>
                <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                  +{delayDays}d
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {selectedTask.name}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Duração subiu de {selectedTask.duration}d para {selectedTask.simulatedDuration}d.
              </p>
            </div>

            {/* Domino 2: Chain Ripple */}
            <div className={`rounded-xl p-3.5 space-y-1.5 border ${
              simulation.affectedTaskIds.length > 0
                ? 'bg-orange-50/80 border-orange-200'
                : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  simulation.affectedTaskIds.length > 0 ? 'text-orange-800' : 'text-emerald-800'
                }`}>
                  2. Impacto nas Dependentes
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  simulation.affectedTaskIds.length > 0 ? 'bg-orange-200/80 text-orange-900' : 'bg-emerald-200/80 text-emerald-900'
                }`}>
                  {simulation.affectedTaskIds.length} tarefas
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {simulation.affectedTaskIds.length > 0
                  ? `${simulation.affectedTaskIds.length} tarefa(s) empurrada(s)`
                  : 'Nenhuma tarefa empurrada'}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {simulation.affectedTaskIds.length > 0
                  ? 'Tarefas que dependem desta tiveram suas datas postergadas.'
                  : 'A folga de tempo absorveu o impacto antes de afetar as próximas.'}
              </p>
            </div>

            {/* Domino 3: Final Delivery */}
            <div className={`rounded-xl p-3.5 space-y-1.5 border ${
              projectDelay > 0
                ? 'bg-rose-50/80 border-rose-200'
                : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  projectDelay > 0 ? 'text-rose-800' : 'text-emerald-800'
                }`}>
                  3. Data Final de Entrega
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  projectDelay > 0 ? 'bg-rose-200/80 text-rose-900' : 'bg-emerald-200/80 text-emerald-900'
                }`}>
                  {projectDelay > 0 ? `+${projectDelay}d` : 'No prazo'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {projectDelay > 0 ? `Entrega no Dia ${simulation.simulatedProjectDuration}` : `Entrega no Dia ${simulation.baselineProjectDuration}`}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {projectDelay > 0
                  ? `O projeto atrasará ${projectDelay} dias em relação ao planejado inicialmente.`
                  : 'A entrega final permanece exatamente na data combinada.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Simplified Task Cards List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Todas as Tarefas do Projeto (Visão em Cartões)
            </h3>
            <p className="text-xs text-slate-500">
              Clique em <strong>+ / -</strong> para alterar o atraso de qualquer tarefa e ver o resultado na hora.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Caminho Crítico (Sem Folga)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ml-2" />
            <span>Com Folga Segura</span>
          </div>
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {simulation.tasks.map((task) => {
            const isSelected = selectedTaskId === task.id;
            const isDirectlyDelayed = task.id === selectedTaskId && delayDays > 0;
            const isPushed = task.finishDelayShift > 0 && !isDirectlyDelayed;
            const isCritical = task.isSimulatedCritical;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-200/70 shadow-sm'
                    : isDirectlyDelayed
                    ? 'border-amber-400 bg-amber-50/30'
                    : isPushed
                    ? 'border-orange-300 bg-orange-50/20'
                    : isCritical
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Card Top: ID, Phase & Status Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-7 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                      isDirectlyDelayed
                        ? 'bg-amber-500 text-white'
                        : isPushed
                        ? 'bg-orange-500 text-white'
                        : isCritical
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium truncate">
                      {task.phase}
                    </span>
                  </div>

                  {/* Status pill */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isDirectlyDelayed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        +{delayDays}d de atraso
                      </span>
                    ) : isPushed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                        Empurrada (+{task.finishDelayShift}d)
                      </span>
                    ) : isCritical ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-600" />
                        Crítica
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Folga: {task.simulatedSlack}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Middle: Name & Dates */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {task.name}
                  </h4>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Início: Dia {task.simulatedES + 1} → Término: Dia {task.simulatedEF}</span>
                    <span className="font-semibold text-slate-700">{task.simulatedDuration} dias</span>
                  </div>
                </div>

                {/* Card Mini Timeline Bar */}
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      style={{
                        marginLeft: `${(task.simulatedES / maxProjectDays) * 100}%`,
                        width: `${(task.simulatedDuration / maxProjectDays) * 100}%`,
                      }}
                      className={`h-full rounded-full ${
                        isDirectlyDelayed
                          ? 'bg-amber-500'
                          : isPushed
                          ? 'bg-orange-500'
                          : isCritical
                          ? 'bg-rose-500'
                          : 'bg-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Card Bottom: Quick Delay Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    {task.assignee ? `Responsável: ${task.assignee}` : 'Simular atraso:'}
                  </span>

                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      aria-label={`Diminuir atraso da tarefa ${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task.id);
                        if (task.id === selectedTaskId) {
                          onChangeDelay(Math.max(0, delayDays - 1));
                        } else {
                          onChangeDelay(0);
                        }
                      }}
                      disabled={task.id === selectedTaskId && delayDays <= 0}
                      className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded cursor-pointer"
                      title="Diminuir atraso"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className={`px-2 py-0.5 text-xs font-bold ${
                      task.id === selectedTaskId && delayDays > 0 ? 'text-amber-700 bg-amber-50 rounded' : 'text-slate-700'
                    }`}>
                      {task.id === selectedTaskId && delayDays > 0 ? `+${delayDays}d` : '0d'}
                    </span>

                    <button
                      type="button"
                      aria-label={`Aumentar atraso da tarefa ${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task.id);
                        if (task.id === selectedTaskId) {
                          onChangeDelay(delayDays + 1);
                        } else {
                          onChangeDelay(1);
                        }
                      }}
                      className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                      title="Aumentar atraso em +1 dia"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Guide Helper Banner */}
      {onOpenInstructionGuide && (
        <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-white rounded-2xl border border-indigo-100/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Lightbulb className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Quer saber o que mais pode ser desenvolvido e como estruturar instruções perfeitas?
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Acesse o guia com os 4 detalhes essenciais, exemplos reais (e-commerce, obras, marketing, apps) e construtor passo a passo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenInstructionGuide}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all cursor-pointer flex-shrink-0 shadow-2xs hover:shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Abrir Guia & Construtor</span>
          </button>
        </div>
      )}
    </div>
  );
};

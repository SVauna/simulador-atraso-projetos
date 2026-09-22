import React, { useMemo } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  GitCommit,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { CalculatedTask, ScheduleSimulationResult } from '../types';

interface NetworkGraphProps {
  simulation: ScheduleSimulationResult;
  selectedTaskId: string | null;
  delayDays: number;
  onSelectTask: (taskId: string) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  simulation,
  selectedTaskId,
  delayDays,
  onSelectTask,
}) => {
  // Group tasks into topological stages/ranks for column layout
  const rankedColumns = useMemo(() => {
    const ranks = new Map<string, number>();

    // Calculate rank as length of longest path of predecessors
    simulation.tasks.forEach(task => {
      if (!task.predecessors || task.predecessors.length === 0) {
        ranks.set(task.id, 0);
      } else {
        const predRanks = task.predecessors.map(p => ranks.get(p) ?? 0);
        ranks.set(task.id, Math.max(...predRanks, 0) + 1);
      }
    });

    const columns: Record<number, CalculatedTask[]> = {};
    let maxRank = 0;

    simulation.tasks.forEach(task => {
      const r = ranks.get(task.id) || 0;
      if (r > maxRank) maxRank = r;
      if (!columns[r]) columns[r] = [];
      columns[r].push(task);
    });

    const colArray: Array<{ rank: number; tasks: CalculatedTask[] }> = [];
    for (let i = 0; i <= maxRank; i++) {
      if (columns[i] && columns[i].length > 0) {
        colArray.push({ rank: i, tasks: columns[i] });
      }
    }

    return colArray;
  }, [simulation.tasks]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Diagrama de Rede CPM / PERT (Fluxo de Dependências)
          </h3>
          <span className="text-xs text-slate-500 hidden sm:inline">
            • Mostra o cálculo clássico de Início/Fim mais cedo e Folga por bloco
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-rose-500 bg-rose-50 inline-block" />
            <span className="font-semibold text-rose-700">Caminho Crítico (Folga: 0d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-amber-500 bg-amber-50 inline-block" />
            <span className="font-semibold text-amber-800">Origem do Atraso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-orange-400 bg-orange-50 inline-block" />
            <span className="font-semibold text-orange-700">Impactado em Cascata</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-slate-200 bg-white inline-block" />
            <span>Normal com Folga</span>
          </div>
        </div>
      </div>

      {/* Anatomical CPM Block Key Explainer */}
      <div className="px-4 py-2 bg-indigo-50/50 border-b border-indigo-100/60 flex items-center justify-between text-xs text-indigo-900 overflow-x-auto">
        <div className="flex items-center gap-3 font-mono">
          <span className="font-sans font-bold text-slate-700">Estrutura do Bloco CPM:</span>
          <span className="bg-white px-2 py-0.5 rounded border border-indigo-200">
            [ES: Início Cedo] | [D: Duração] | [EF: Fim Cedo]
          </span>
          <span className="text-slate-400">→</span>
          <span className="bg-white px-2 py-0.5 rounded border border-indigo-200">
            [Nome da Tarefa & Responsável]
          </span>
          <span className="text-slate-400">→</span>
          <span className="bg-white px-2 py-0.5 rounded border border-indigo-200">
            [LS: Início Tarde] | [Folga Total] | [LF: Fim Tarde]
          </span>
        </div>
      </div>

      {/* Network Columns Canvas */}
      <div className="p-6 overflow-x-auto bg-slate-50/40">
        <div className="flex items-start gap-8 min-w-max">
          {rankedColumns.map(({ rank, tasks }, colIdx) => (
            <div key={rank} className="flex flex-col gap-5 min-w-[240px] max-w-[280px]">
              {/* Stage Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>Fase / Etapa {colIdx + 1}</span>
                <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700 font-mono">
                  {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
                </span>
              </div>

              {/* Task Cards in this Column */}
              <div className="flex flex-col gap-4">
                {tasks.map((task) => {
                  const isSelected = selectedTaskId === task.id;
                  const isCritical = task.isSimulatedCritical;
                  const isDelayedSource = task.isDirectlyDelayed;
                  const isCascaded = task.isCascadedDelayed;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className={`rounded-xl border-2 transition-all cursor-pointer shadow-xs overflow-hidden ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md'
                          : isDelayedSource
                          ? 'border-amber-500 bg-amber-50/20 ring-1 ring-amber-300'
                          : isCritical
                          ? 'border-rose-500 bg-rose-50/20'
                          : isCascaded
                          ? 'border-orange-400 bg-orange-50/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Top Bar: ES | Duration | EF */}
                      <div className="grid grid-cols-3 text-center border-b border-slate-200 bg-slate-100/70 text-[10px] font-mono py-1 text-slate-700">
                        <div className="border-r border-slate-200" title="Início Mais Cedo (Early Start)">
                          <span className="text-[8px] text-slate-400 block font-sans">ES</span>
                          <span className="font-bold">D{task.simulatedES + 1}</span>
                        </div>
                        <div className="border-r border-slate-200 font-bold" title="Duração Total da Atividade">
                          <span className="text-[8px] text-slate-400 block font-sans">DUR</span>
                          <span className={task.directDelay > 0 ? 'text-amber-700 font-extrabold' : ''}>
                            {task.simulatedDuration}d
                          </span>
                        </div>
                        <div title="Término Mais Cedo (Early Finish)">
                          <span className="text-[8px] text-slate-400 block font-sans">EF</span>
                          <span className="font-bold">D{task.simulatedEF}</span>
                        </div>
                      </div>

                      {/* Middle: ID, Name, Assignee */}
                      <div className="p-3 bg-white">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isDelayedSource 
                              ? 'bg-amber-100 text-amber-800' 
                              : isCritical
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {task.id}
                          </span>

                          {isDelayedSource ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              +{task.directDelay}d atraso
                            </span>
                          ) : isCritical ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" />
                              Crítico
                            </span>
                          ) : isCascaded ? (
                            <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                              +{task.finishDelayShift}d cascata
                            </span>
                          ) : null}
                        </div>

                        <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {task.name}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                          <span className="truncate">{task.assignee || task.phase}</span>
                        </div>

                        {/* Predecessors list indicator */}
                        {task.predecessors && task.predecessors.length > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1">
                            <span>Predecessoras:</span>
                            <span className="font-mono font-medium text-slate-600">
                              {task.predecessors.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Bar: LS | Slack / Float | LF */}
                      <div className="grid grid-cols-3 text-center border-t border-slate-200 bg-slate-50 text-[10px] font-mono py-1 text-slate-700">
                        <div className="border-r border-slate-200" title="Início Mais Tarde (Late Start)">
                          <span className="text-[8px] text-slate-400 block font-sans">LS</span>
                          <span>D{task.simulatedLS + 1}</span>
                        </div>
                        <div 
                          className={`border-r border-slate-200 font-bold ${
                            task.simulatedSlack === 0 
                              ? 'text-rose-600 bg-rose-50/60' 
                              : 'text-emerald-700 bg-emerald-50/60'
                          }`} 
                          title="Folga Total (Total Float)"
                        >
                          <span className="text-[8px] opacity-75 block font-sans">FOLGA</span>
                          <span>{task.simulatedSlack}d</span>
                        </div>
                        <div title="Término Mais Tarde (Late Finish)">
                          <span className="text-[8px] text-slate-400 block font-sans">LF</span>
                          <span>D{task.simulatedLF}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

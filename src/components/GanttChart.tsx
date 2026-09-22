import React, { useState, useMemo, useRef } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  Maximize2,
  Minimize2,
  Plus,
  Minus
} from 'lucide-react';
import { CalculatedTask, ScheduleSimulationResult } from '../types';

interface GanttChartProps {
  simulation: ScheduleSimulationResult;
  selectedTaskId: string | null;
  delayDays: number;
  onSelectTask: (taskId: string) => void;
  onChangeDelay: (days: number) => void;
  showBaselineComparison: boolean;
  onEditTask?: (task: CalculatedTask) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  simulation,
  selectedTaskId,
  delayDays,
  onSelectTask,
  onChangeDelay,
  showBaselineComparison,
  onEditTask,
}) => {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Maximum timeline duration in days
  const maxDays = useMemo(() => {
    const maxSim = simulation.simulatedProjectDuration || 10;
    const maxBase = simulation.baselineProjectDuration || 10;
    return Math.max(maxSim, maxBase, 15) + 3;
  }, [simulation.simulatedProjectDuration, simulation.baselineProjectDuration]);

  // Pixel width per day column
  const dayColWidth = 36; // px per day
  const totalChartWidth = maxDays * dayColWidth;

  // Track coordinates of task bars to draw SVG dependency lines
  const taskCoordinates = useMemo(() => {
    const coords: Record<string, { startX: number; endX: number; centerY: number; simulatedStartX: number; simulatedEndX: number }> = {};
    const rowHeight = 52; // height per row
    const headerHeight = 44;

    simulation.tasks.forEach((task, index) => {
      const centerY = headerHeight + index * rowHeight + rowHeight / 2;
      const startX = task.baselineES * dayColWidth;
      const endX = task.baselineEF * dayColWidth;
      const simulatedStartX = task.simulatedES * dayColWidth;
      const simulatedEndX = task.simulatedEF * dayColWidth;

      coords[task.id] = { startX, endX, centerY, simulatedStartX, simulatedEndX };
    });

    return coords;
  }, [simulation.tasks, dayColWidth]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Gantt Header Bar */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Cronograma Visual (Gráfico de Gantt Interativo)
          </h3>
          <span className="text-xs text-slate-500 hidden sm:inline">
            • Linhas de conexão indicam dependências entre tarefas
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-indigo-500 inline-block" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
            <span className="font-semibold text-rose-700">Caminho Crítico</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-amber-500 ring-2 ring-amber-300 inline-block" />
            <span className="font-semibold text-amber-800">Atraso Direto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-orange-400 inline-block" />
            <span className="font-semibold text-orange-700">Empurrado (Cascata)</span>
          </div>
          {showBaselineComparison && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2 border border-dashed border-slate-400 bg-slate-100 inline-block" />
              <span>Linha de Base</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-xs bg-emerald-200 border border-emerald-400 inline-block" />
            <span>Folga</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Body: Left info column + Right scrollable timeline */}
      <div className="flex overflow-hidden relative">
        {/* Left Task Metadata Column (fixed width) */}
        <div className="w-72 sm:w-80 md:w-96 flex-shrink-0 border-r border-slate-200 bg-white z-20 shadow-xs">
          {/* Column Header */}
          <div className="h-11 border-b border-slate-200 bg-slate-50/90 px-3 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-8">ID</span>
              <span>Tarefa / Responsável</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Atrasar</span>
              <span className="w-12 text-right">Duração</span>
            </div>
          </div>

          {/* Task rows */}
          <div className="divide-y divide-slate-100">
            {simulation.tasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              const isHovered = hoveredTaskId === task.id;
              const isCritical = task.isSimulatedCritical;
              const isDelayedSource = task.isDirectlyDelayed;
              const isCascaded = task.isCascadedDelayed;

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  className={`h-[52px] px-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/80 font-medium'
                      : isHovered
                      ? 'bg-slate-50'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Left: ID & Name */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className={`w-7 h-5 flex items-center justify-center rounded-md font-mono text-[10px] font-bold ${
                      isDelayedSource 
                        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300' 
                        : isCritical
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.id}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`truncate font-semibold ${
                          isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'
                        }`}>
                          {task.name}
                        </span>
                        {isCritical && (
                          <span title="Caminho Crítico" className="flex-shrink-0">
                            <Flame className="w-3 h-3 text-rose-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                        <span>{task.phase}</span>
                        {task.assignee && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600">{task.assignee}</span>
                          </>
                        )}
                        {task.isSimulatedCritical ? (
                          <span className="text-rose-600 font-semibold">• Crítica</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">• Folga: {task.simulatedSlack}d</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick +/- Stepper & Duration badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Stepper buttons */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-md shadow-2xs overflow-hidden">
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
                        className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer"
                        title="Diminuir atraso"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`px-1.5 text-[10px] font-bold ${
                        isSelected && delayDays > 0 ? 'text-amber-700 bg-amber-50' : 'text-slate-700'
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
                        className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                        title="Aumentar atraso em +1 dia"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Total Duration */}
                    <span className="w-12 text-right font-mono font-medium text-slate-700">
                      {task.simulatedDuration}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Scrollable Timeline View */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-x-auto relative select-none"
          style={{ minWidth: '400px' }}
        >
          <div style={{ width: `${totalChartWidth}px` }} className="relative">
            {/* Header: Days Axis */}
            <div className="h-11 border-b border-slate-200 bg-slate-50/90 flex items-center sticky top-0 z-10">
              {Array.from({ length: maxDays }).map((_, dayIndex) => {
                const dayNum = dayIndex + 1;
                const isProjectEnd = dayNum === simulation.simulatedProjectDuration;
                const isBaselineEnd = dayNum === simulation.baselineProjectDuration;

                return (
                  <div
                    key={dayIndex}
                    style={{ width: `${dayColWidth}px` }}
                    className={`h-full border-r border-slate-200/60 flex flex-col items-center justify-center text-[10px] ${
                      isProjectEnd
                        ? 'bg-rose-100/60 font-bold text-rose-800'
                        : isBaselineEnd && showBaselineComparison
                        ? 'bg-indigo-50 font-bold text-indigo-700'
                        : dayNum % 5 === 0
                        ? 'bg-slate-100/50 font-semibold text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    <span>D{dayNum}</span>
                    {isProjectEnd && (
                      <span className="text-[8px] leading-tight text-rose-600 font-extrabold uppercase tracking-tight">Fim</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Background Vertical Grid Lines */}
            <div className="absolute inset-0 pointer-events-none flex" style={{ top: '44px' }}>
              {Array.from({ length: maxDays }).map((_, dayIndex) => {
                const dayNum = dayIndex + 1;
                const isProjectEnd = dayNum === simulation.simulatedProjectDuration;
                const isBaselineEnd = dayNum === simulation.baselineProjectDuration;

                return (
                  <div
                    key={dayIndex}
                    style={{ width: `${dayColWidth}px` }}
                    className={`h-full border-r ${
                      isProjectEnd
                        ? 'border-r-2 border-r-rose-400 bg-rose-50/20'
                        : isBaselineEnd && showBaselineComparison
                        ? 'border-r border-dashed border-r-indigo-300'
                        : dayNum % 5 === 0
                        ? 'border-r-slate-200/80 bg-slate-50/30'
                        : 'border-r-slate-100'
                    }`}
                  />
                );
              })}
            </div>

            {/* SVG Dependency Lines Overlay */}
            <svg 
              className="absolute inset-0 pointer-events-none z-10"
              style={{ width: `${totalChartWidth}px`, height: `${44 + simulation.tasks.length * 52}px` }}
            >
              <defs>
                <marker
                  id="arrow-normal"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                </marker>
                <marker
                  id="arrow-critical"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                </marker>
                <marker
                  id="arrow-delayed"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                </marker>
              </defs>

              {simulation.tasks.map((task) => {
                const targetCoord = taskCoordinates[task.id];
                if (!targetCoord) return null;

                return (task.predecessors || []).map((predId) => {
                  const sourceCoord = taskCoordinates[predId];
                  if (!sourceCoord) return null;

                  const startX = sourceCoord.simulatedEndX;
                  const startY = sourceCoord.centerY;
                  const endX = targetCoord.simulatedStartX;
                  const endY = targetCoord.centerY;

                  const isCriticalLink = task.isSimulatedCritical && simulation.simulatedCriticalPath.includes(predId);
                  const isDelayPropagating = (predId === selectedTaskId && delayDays > 0) || (task.startDelayShift > 0);

                  // Calculate curved path bezier
                  const midX = startX + Math.max(12, (endX - startX) / 2);
                  const pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                  return (
                    <path
                      key={`${predId}->${task.id}`}
                      d={pathData}
                      fill="none"
                      stroke={
                        isDelayPropagating 
                          ? '#f59e0b' 
                          : isCriticalLink 
                          ? '#f43f5e' 
                          : '#cbd5e1'
                      }
                      strokeWidth={isDelayPropagating || isCriticalLink ? 2 : 1.25}
                      strokeDasharray={isDelayPropagating ? '4,3' : 'none'}
                      markerEnd={`url(#arrow-${isDelayPropagating ? 'delayed' : isCriticalLink ? 'critical' : 'normal'})`}
                      className={isDelayPropagating ? 'animate-pulse' : ''}
                    />
                  );
                });
              })}
            </svg>

            {/* Task Bars Rows */}
            <div className="relative z-10">
              {simulation.tasks.map((task, index) => {
                const isSelected = selectedTaskId === task.id;
                const isHovered = hoveredTaskId === task.id;
                const isCritical = task.isSimulatedCritical;
                const isDelayedSource = task.isDirectlyDelayed;
                const isCascaded = task.isCascadedDelayed;

                // Coordinates for simulated bar
                const barLeft = task.simulatedES * dayColWidth;
                const barWidth = Math.max(12, task.simulatedDuration * dayColWidth);

                // Coordinates for baseline bar (ghost)
                const baseLeft = task.baselineES * dayColWidth;
                const baseWidth = Math.max(12, task.duration * dayColWidth);

                // Slack extension coordinates
                const slackWidth = task.simulatedSlack * dayColWidth;
                const slackLeft = barLeft + barWidth;

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    style={{ height: '52px' }}
                    className={`relative flex items-center border-b border-slate-100 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50/40' : isHovered ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    {/* Baseline Ghost Bar (if toggle enabled and dates differ) */}
                    {showBaselineComparison && (
                      <div
                        style={{
                          left: `${baseLeft}px`,
                          width: `${baseWidth}px`,
                          top: '6px',
                          height: '14px',
                        }}
                        className="absolute rounded-sm border border-dashed border-slate-400 bg-slate-200/50 text-[9px] font-mono text-slate-500 flex items-center px-1.5 overflow-hidden z-10"
                        title={`Linha de Base Original: Dia ${task.baselineES + 1} até Dia ${task.baselineEF}`}
                      >
                        <span className="truncate">Base: {task.duration}d</span>
                      </div>
                    )}

                    {/* Main Active / Simulated Gantt Bar */}
                    <div
                      style={{
                        left: `${barLeft}px`,
                        width: `${barWidth}px`,
                        height: showBaselineComparison ? '24px' : '30px',
                        marginTop: showBaselineComparison ? '14px' : '0px',
                      }}
                      className={`absolute rounded-lg shadow-2xs flex items-center justify-between px-2.5 text-xs text-white font-medium transition-all group overflow-hidden ${
                        isDelayedSource
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 ring-2 ring-amber-300 ring-offset-1 text-amber-950 font-bold'
                          : isCritical
                          ? 'bg-gradient-to-r from-rose-500 to-rose-600 ring-1 ring-rose-400'
                          : isCascaded
                          ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-amber-950'
                          : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        {isDelayedSource ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-950 flex-shrink-0" />
                        ) : isCritical ? (
                          <Flame className="w-3.5 h-3.5 text-rose-200 flex-shrink-0" />
                        ) : null}
                        <span className="truncate font-semibold">{task.name}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono opacity-90 flex-shrink-0">
                        <span>{task.simulatedDuration}d</span>
                        {task.finishDelayShift > 0 && (
                          <span className="bg-black/20 px-1 rounded-sm text-[10px] font-bold">
                            +{task.finishDelayShift}d
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Slack Bar Extension (Total Float) */}
                    {task.simulatedSlack > 0 && (
                      <div
                        style={{
                          left: `${slackLeft}px`,
                          width: `${slackWidth}px`,
                          height: showBaselineComparison ? '24px' : '30px',
                          marginTop: showBaselineComparison ? '14px' : '0px',
                        }}
                        className="absolute rounded-r-lg border border-dashed border-emerald-400 bg-emerald-50/70 text-emerald-800 text-[10px] font-semibold flex items-center justify-center overflow-hidden px-1 pointer-events-none"
                        title={`Folga disponível: ${task.simulatedSlack} dias`}
                      >
                        <span className="truncate">Folga: {task.simulatedSlack}d</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Instructions */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">Dica de uso:</span>
          <span>Clique em qualquer barra ou use os botões <strong>+ / -</strong> para simular atrasos imediatos naquela tarefa.</span>
        </div>
        <div className="text-slate-500 font-mono text-[11px]">
          Duração total do projeto: <strong>{simulation.simulatedProjectDuration} dias</strong>
        </div>
      </div>
    </div>
  );
};

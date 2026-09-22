import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  GitMerge, 
  TrendingUp, 
  AlertTriangle, 
  Info,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  Plus
} from 'lucide-react';
import { ProjectPlan, CalculatedTask } from './types';
import { PROJECT_TEMPLATES } from './data/templates';
import { calculateScheduleSimulation } from './utils/cpmEngine';
import { Header } from './components/Header';
import { DelayController } from './components/DelayController';
import { GanttChart } from './components/GanttChart';
import { NetworkGraph } from './components/NetworkGraph';
import { SimpleCascadeView } from './components/SimpleCascadeView';
import { CascadeAnalysis } from './components/CascadeAnalysis';
import { PlanInputModal } from './components/PlanInputModal';
import { InstructionGuideModal } from './components/InstructionGuideModal';

export default function App() {
  // Current active project plan
  const [currentPlan, setCurrentPlan] = useState<ProjectPlan>(PROJECT_TEMPLATES[0]);

  // Selected task to simulate delay on (default to T4 or first task)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    PROJECT_TEMPLATES[0].tasks[3]?.id || PROJECT_TEMPLATES[0].tasks[0]?.id || null
  );

  // Simulated delay in days (start with 3 days so the user immediately sees the visual impact upon loading!)
  const [delayDays, setDelayDays] = useState<number>(3);

  // Toggle baseline comparison overlay
  const [showBaselineComparison, setShowBaselineComparison] = useState<boolean>(true);

  // Active view tab: 'simple' | 'gantt' | 'network'
  const [activeVisualizer, setActiveVisualizer] = useState<'simple' | 'gantt' | 'network'>('simple');

  // Modal to receive new plan
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);

  // Modal for intuitive instruction guide & builder
  const [isInstructionGuideOpen, setIsInstructionGuideOpen] = useState<boolean>(false);

  // Calculate schedule and cascade simulation
  const simulation = useMemo(() => {
    return calculateScheduleSimulation(currentPlan.tasks, selectedTaskId, delayDays);
  }, [currentPlan.tasks, selectedTaskId, delayDays]);

  // Handler to select another template
  const handleSelectTemplate = (template: ProjectPlan) => {
    setCurrentPlan(template);
    setSelectedTaskId(template.tasks[0]?.id || null);
    setDelayDays(0);
  };

  // Handler to apply a newly inputted/generated plan
  const handleApplyPlan = (newPlan: ProjectPlan) => {
    setCurrentPlan(newPlan);
    setSelectedTaskId(newPlan.tasks[0]?.id || null);
    setDelayDays(0);
  };

  // Handler to reset simulation
  const handleResetSimulation = () => {
    setDelayDays(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* App Header */}
      <Header
        currentPlan={currentPlan}
        onSelectTemplate={handleSelectTemplate}
        onOpenPlanModal={() => setIsPlanModalOpen(true)}
        onOpenInstructionGuide={() => setIsInstructionGuideOpen(true)}
        onResetSimulation={handleResetSimulation}
        isSimulated={delayDays > 0}
        projectDelayDays={simulation.projectDelayDays}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cycle Error Banner if invalid dependency */}
        {simulation.hasCycles && (
          <div className="rounded-xl bg-rose-50 border border-rose-300 p-4 text-xs text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Ciclo de Dependência Detectado!</strong>
              <p className="mt-0.5 text-rose-800">
                Uma ou mais tarefas dependem de si mesmas direta ou indiretamente (ex: A depende de B que depende de A). Remova a dependência circular no editor para recalcular o cronograma.
              </p>
            </div>
          </div>
        )}

        {/* 1. Delay Simulator Controller Cockpit */}
        <DelayController
          simulation={simulation}
          selectedTaskId={selectedTaskId}
          delayDays={delayDays}
          onSelectTask={setSelectedTaskId}
          onChangeDelay={setDelayDays}
          showBaselineComparison={showBaselineComparison}
          onToggleBaselineComparison={setShowBaselineComparison}
        />

        {/* 2. Visualizer Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs self-start">
            <button
              type="button"
              onClick={() => setActiveVisualizer('simple')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeVisualizer === 'simple'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Visão Simplificada (Efeito Dominó)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveVisualizer('gantt')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeVisualizer === 'gantt'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Gráfico de Gantt</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveVisualizer('network')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeVisualizer === 'network'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GitMerge className="w-4 h-4" />
              <span>Diagrama de Rede CPM</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-medium text-slate-700">Duração Total:</span>
            <span className="font-bold text-slate-900">{simulation.simulatedProjectDuration} dias</span>
            {simulation.projectDelayDays > 0 && (
              <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                (+{simulation.projectDelayDays} dias de impacto)
              </span>
            )}
          </div>
        </div>

        {/* 3. Primary Visualizer (Simple Cascade, Gantt or Network) */}
        {activeVisualizer === 'simple' ? (
          <SimpleCascadeView
            simulation={simulation}
            selectedTaskId={selectedTaskId}
            delayDays={delayDays}
            onSelectTask={setSelectedTaskId}
            onChangeDelay={setDelayDays}
            onOpenInstructionGuide={() => setIsInstructionGuideOpen(true)}
          />
        ) : activeVisualizer === 'gantt' ? (
          <GanttChart
            simulation={simulation}
            selectedTaskId={selectedTaskId}
            delayDays={delayDays}
            onSelectTask={setSelectedTaskId}
            onChangeDelay={setDelayDays}
            showBaselineComparison={showBaselineComparison}
          />
        ) : (
          <NetworkGraph
            simulation={simulation}
            selectedTaskId={selectedTaskId}
            delayDays={delayDays}
            onSelectTask={setSelectedTaskId}
          />
        )}

        {/* 4. Cascade Ripple Effect Breakdown & Recommendations */}
        <CascadeAnalysis
          simulation={simulation}
          selectedTaskId={selectedTaskId}
          delayDays={delayDays}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Simulador de Atraso e Caminho Crítico (CPM) • Visualizador Interativo</span>
          <span className="text-slate-400">Desenvolvido com React, Tailwind CSS e Algoritmo de Grafo Acíclico Dirigido (DAG)</span>
        </div>
      </footer>

      {/* Modal to input plan via natural language, template, manual editor, or JSON */}
      <PlanInputModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onApplyPlan={handleApplyPlan}
        onOpenInstructionGuide={() => setIsInstructionGuideOpen(true)}
        currentPlan={currentPlan}
      />

      {/* Intuitive Guide & Instruction Builder Modal */}
      <InstructionGuideModal
        isOpen={isInstructionGuideOpen}
        onClose={() => setIsInstructionGuideOpen(false)}
        onLoadPlan={handleApplyPlan}
      />
    </div>
  );
}

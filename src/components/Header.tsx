import React from 'react';
import { 
  GitBranch, 
  RotateCcw, 
  PlusCircle, 
  Sparkles, 
  Layers, 
  AlertTriangle,
  Clock,
  Calendar,
  BookOpen
} from 'lucide-react';
import { ProjectPlan } from '../types';
import { PROJECT_TEMPLATES } from '../data/templates';

interface HeaderProps {
  currentPlan: ProjectPlan;
  onSelectTemplate: (template: ProjectPlan) => void;
  onOpenPlanModal: () => void;
  onOpenInstructionGuide: () => void;
  onResetSimulation: () => void;
  isSimulated: boolean;
  projectDelayDays: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlan,
  onSelectTemplate,
  onOpenPlanModal,
  onOpenInstructionGuide,
  onResetSimulation,
  isSimulated,
  projectDelayDays,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
                  Simulador de Atraso
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  CPM & Efeito Cascata
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                <span className="font-medium text-slate-700">{currentPlan.name}</span>
                <span>•</span>
                <span>{currentPlan.tasks.length} tarefas</span>
              </p>
            </div>
          </div>

          {/* Quick Template Switcher & Actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Template Selector dropdown */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
              <select
                aria-label="Modelos de Projeto"
                value={currentPlan.id}
                onChange={(e) => {
                  const found = PROJECT_TEMPLATES.find(t => t.id === e.target.value);
                  if (found) onSelectTemplate(found);
                }}
                className="text-xs bg-transparent border-0 text-slate-700 font-medium focus:ring-0 cursor-pointer pr-6 py-1 outline-hidden"
              >
                {PROJECT_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Delay Indicator pill */}
            {isSimulated && (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                projectDelayDays > 0 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {projectDelayDays > 0 ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Atraso Final: +{projectDelayDays}d</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Atraso Absorvido (0d)</span>
                  </>
                )}
              </div>
            )}

            {/* Reset Delay button */}
            {isSimulated && (
              <button
                type="button"
                onClick={onResetSimulation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Zerar atrasos e voltar ao cronograma original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Zerar Atraso</span>
              </button>
            )}

            {/* Instruction Guide button */}
            <button
              type="button"
              onClick={onOpenInstructionGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer"
              title="Guia Intuitivo: o que pode ser desenvolvido e detalhes essenciais da instrução"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Guia de Instrução</span>
            </button>

            {/* Load / Create Plan button */}
            <button
              type="button"
              onClick={onOpenPlanModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Novo Plano</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

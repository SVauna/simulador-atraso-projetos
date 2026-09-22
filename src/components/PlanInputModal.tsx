import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Layers, 
  FileText, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  HelpCircle,
  Wand2,
  BookOpen
} from 'lucide-react';
import { ProjectPlan, Task } from '../types';
import { PROJECT_TEMPLATES } from '../data/templates';

interface PlanInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (newPlan: ProjectPlan) => void;
  onOpenInstructionGuide?: () => void;
  currentPlan: ProjectPlan;
}

export const PlanInputModal: React.FC<PlanInputModalProps> = ({
  isOpen,
  onClose,
  onApplyPlan,
  onOpenInstructionGuide,
  currentPlan,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'templates' | 'manual' | 'json'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual editor state
  const [manualName, setManualName] = useState(currentPlan.name);
  const [manualDescription, setManualDescription] = useState(currentPlan.description);
  const [manualTasks, setManualTasks] = useState<Task[]>(JSON.parse(JSON.stringify(currentPlan.tasks)));

  // JSON import/export state
  const [jsonText, setJsonText] = useState(JSON.stringify(currentPlan, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handler for AI parsing or generation
  const handleParseAiPlan = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Por favor, digite ou cole a descrição do seu plano.');
      return;
    }

    setLoadingAi(true);
    setAiError(null);

    try {
      const response = await fetch('/api/parse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planText: aiPrompt }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar o plano com IA.');
      }

      const data = await response.json();
      if (data.tasks && data.tasks.length > 0) {
        const newPlan: ProjectPlan = {
          id: `custom-${Date.now()}`,
          name: data.projectName || 'Projeto Personalizado',
          description: data.description || 'Plano gerado e estruturado a partir da descrição fornecida.',
          startDate: new Date().toISOString().split('T')[0],
          tasks: data.tasks,
        };

        onApplyPlan(newPlan);
        onClose();
      } else {
        throw new Error('Não foi possível identificar tarefas no texto fornecido.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Erro ao processar plano. Tente novamente ou use os modelos.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Handler to add a task in manual editor
  const handleAddManualTask = () => {
    const nextNum = manualTasks.length + 1;
    const lastId = manualTasks.length > 0 ? manualTasks[manualTasks.length - 1].id : 'T0';
    const newTask: Task = {
      id: `T${nextNum}`,
      name: `Nova Tarefa ${nextNum}`,
      duration: 3,
      predecessors: manualTasks.length > 0 ? [lastId] : [],
      phase: 'Execução',
      assignee: 'Equipe',
    };
    setManualTasks([...manualTasks, newTask]);
  };

  // Handler to delete task in manual editor
  const handleDeleteManualTask = (index: number) => {
    const taskIdToRemove = manualTasks[index].id;
    const updated = manualTasks
      .filter((_, i) => i !== index)
      .map(t => ({
        ...t,
        predecessors: (t.predecessors || []).filter(p => p !== taskIdToRemove),
      }));
    setManualTasks(updated);
  };

  // Save manual plan
  const handleSaveManualPlan = () => {
    if (manualTasks.length === 0) {
      alert('O projeto precisa ter pelo menos 1 tarefa.');
      return;
    }

    const newPlan: ProjectPlan = {
      id: `custom-${Date.now()}`,
      name: manualName || 'Projeto Personalizado',
      description: manualDescription,
      startDate: new Date().toISOString().split('T')[0],
      tasks: manualTasks,
    };

    onApplyPlan(newPlan);
    onClose();
  };

  // Apply JSON
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('O JSON precisa conter um array "tasks".');
      }
      onApplyPlan(parsed);
      onClose();
    } catch (err: any) {
      setJsonError(err.message || 'Formato JSON inválido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Receber ou Criar Plano de Projeto</span>
            </h2>
            <p className="text-xs text-slate-500">
              Digite seu plano em linguagem natural, use inteligência artificial, escolha um modelo ou edite manualmente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Texto Livre & IA (Gemini)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Modelos Prontos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Editor Manual de Tarefas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'json'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importar / Exportar JSON</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: AI Prompt / Free Text */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {onOpenInstructionGuide && (
                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>Dúvidas de como escrever? Veja o <strong>Guia de Instrução</strong> com os 4 detalhes essenciais e modelos prontos.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenInstructionGuide();
                    }}
                    className="ml-3 px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors cursor-pointer flex-shrink-0"
                  >
                    Ver Guia
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descreva seu plano de projeto ou cole suas anotações
                </label>
                <textarea
                  rows={6}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Exemplo:
Crie um plano para lançamento de um e-commerce:
1. Definição do catálogo e produtos (4 dias)
2. Design da loja e identidade (6 dias após produtos)
3. Configuração de meios de pagamento e frete (5 dias paralela ao design)
4. Integração do ERP (7 dias após pagamentos)
5. Testes de compra e homologação (3 dias após todas)
6. Lançamento e campanha de inauguração (2 dias)"
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-sans"
                />
              </div>

              {/* Sample Quick Prompts */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-2">
                  Ou clique para testar com um plano sugerido:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Construção de uma casa de praia: fundação (7d), alvenaria (14d), telhado (5d), acabamentos (10d).',
                    'Criação de um jogo indie: conceito (5d), protótipo mecânicas (12d), arte 2D (10d), trilha sonora (6d), lançamento (3d).',
                    'Implementação de CRM corporativo: mapeamento de processos (5d), customização (10d), migração de dados (6d), treinamento (4d).',
                  ].map((example, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAiPrompt(example)}
                      className="text-left text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 p-2 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>

              {aiError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleParseAiPlan}
                  disabled={loadingAi}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loadingAi ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processando com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Estruturar Cronograma e Visualizar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Pre-built Templates */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROJECT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-slate-200 p-4 hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between bg-slate-50/50"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{template.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[11px] font-mono">
                        {template.tasks.length} tarefas
                      </span>
                      <span>•</span>
                      <span>Duração base: ~{template.tasks.reduce((acc, t) => acc + t.duration, 0)} dias</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onApplyPlan(template);
                      onClose();
                    }}
                    className="mt-4 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Carregar Este Modelo</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Manual Task Editor */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição Curta
                  </label>
                  <input
                    type="text"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              {/* Task table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Lista de Tarefas & Dependências
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddManualTask}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Tarefa</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {manualTasks.map((task, idx) => (
                    <div key={task.id} className="p-3 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* ID */}
                      <span className="w-8 font-mono font-bold text-xs bg-slate-100 text-slate-700 px-1.5 py-1 rounded text-center">
                        {task.id}
                      </span>

                      {/* Name */}
                      <div className="flex-1 min-w-[140px]">
                        <input
                          type="text"
                          value={task.name}
                          placeholder="Nome da Tarefa"
                          onChange={(e) => {
                            const copy = [...manualTasks];
                            copy[idx].name = e.target.value;
                            setManualTasks(copy);
                          }}
                          className="w-full text-xs font-semibold rounded-md border border-slate-200 p-1.5"
                        />
                      </div>

                      {/* Duration */}
                      <div className="w-24 flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={task.duration}
                          onChange={(e) => {
                            const copy = [...manualTasks];
                            copy[idx].duration = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setManualTasks(copy);
                          }}
                          className="w-14 text-xs font-mono font-bold rounded-md border border-slate-200 p-1.5 text-center"
                        />
                        <span className="text-xs text-slate-500">dias</span>
                      </div>

                      {/* Phase */}
                      <div className="w-28">
                        <input
                          type="text"
                          placeholder="Fase"
                          value={task.phase}
                          onChange={(e) => {
                            const copy = [...manualTasks];
                            copy[idx].phase = e.target.value;
                            setManualTasks(copy);
                          }}
                          className="w-full text-xs rounded-md border border-slate-200 p-1.5"
                        />
                      </div>

                      {/* Predecessors selector */}
                      <div className="w-36">
                        <select
                          multiple
                          value={task.predecessors || []}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                            const copy = [...manualTasks];
                            copy[idx].predecessors = selected;
                            setManualTasks(copy);
                          }}
                          className="w-full text-[11px] rounded-md border border-slate-200 p-1 h-12"
                          title="Segure Ctrl/Cmd para selecionar múltiplas predecessoras"
                        >
                          {manualTasks.filter(t => t.id !== task.id).map(other => (
                            <option key={other.id} value={other.id}>
                              {other.id}: {other.name.slice(0, 15)}...
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteManualTask(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Excluir tarefa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveManualPlan}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
                >
                  Salvar e Calcular Cronograma
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: JSON Import / Export */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  JSON Estruturado do Projeto
                </label>
                <textarea
                  rows={10}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full font-mono text-xs rounded-xl border border-slate-300 p-3 bg-slate-900 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {jsonError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {jsonError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([jsonText], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `plano-projeto-${currentPlan.id}.json`;
                    a.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyJson}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
                >
                  Aplicar Este JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

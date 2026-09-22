import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  Layers, 
  Cpu, 
  Home, 
  Megaphone, 
  ShoppingBag, 
  Film, 
  Wand2,
  HelpCircle,
  Clock,
  GitBranch,
  Lightbulb
} from 'lucide-react';
import { ProjectPlan, Task } from '../types';

interface InstructionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPlan: (plan: ProjectPlan) => void;
}

export const InstructionGuideModal: React.FC<InstructionGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadPlan,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'builder' | 'examples'>('guide');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Prompt Builder State
  const [builderCategory, setBuilderCategory] = useState<'software' | 'construction' | 'marketing' | 'general'>('software');
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDuration, setBuilderDuration] = useState('30');
  const [builderTasks, setBuilderTasks] = useState<string[]>([
    'Pesquisa e Definição de Escopo (4 dias)',
    'Design de Telas e Protótipo (6 dias)',
    'Desenvolvimento e Programação (12 dias)',
    'Testes de Qualidade e Homologação (5 dias)',
    'Publicação e Entrega Final (3 dias)',
  ]);
  const [customTaskInput, setCustomTaskInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Pre-configured rich project templates with instructions
  const EXAMPLE_PLANS = [
    {
      title: 'Lançamento de Loja Virtual (E-commerce)',
      category: 'Comércio & Digital',
      icon: ShoppingBag,
      summary: 'Cronograma para montar e colocar no ar uma loja online integrada a meios de pagamento e logística.',
      rawInstruction: `Projeto: Lançamento de E-commerce de Moda
1. Cadastro de produtos e fotografia do catálogo (5 dias)
2. Design visual da loja e vitrine (6 dias após catálogo)
3. Configuração de meios de pagamento e gateway de frete (4 dias paralela ao design)
4. Integração com ERP de estoque e emissão de NFe (7 dias após pagamentos)
5. Testes completos de compra e checkout (3 dias após todas)
6. Lançamento oficial e início de anúncios (2 dias)`,
      tasks: [
        { id: 'T1', name: 'Cadastro de produtos e fotografia', duration: 5, predecessors: [], phase: 'Catálogo', assignee: 'Equipe de Produto' },
        { id: 'T2', name: 'Design visual da loja e vitrine', duration: 6, predecessors: ['T1'], phase: 'Design', assignee: 'Designer UI' },
        { id: 'T3', name: 'Configuração de pagamento e frete', duration: 4, predecessors: ['T1'], phase: 'Financeiro', assignee: 'Especialista E-com' },
        { id: 'T4', name: 'Integração com ERP e estoque', duration: 7, predecessors: ['T3'], phase: 'Sistemas', assignee: 'Dev Backend' },
        { id: 'T5', name: 'Testes de checkout e homologação', duration: 3, predecessors: ['T2', 'T4'], phase: 'Qualidade', assignee: 'Analista QA' },
        { id: 'T6', name: 'Lançamento oficial e anúncios', duration: 2, predecessors: ['T5'], phase: 'Marketing', assignee: 'Time de Vendas' },
      ],
    },
    {
      title: 'Reforma Residencial Completa de Apartamento',
      category: 'Engenharia & Obra',
      icon: Home,
      summary: 'Planejamento de reforma com alvenaria, instalações, pintura e marcenaria planejada.',
      rawInstruction: `Projeto: Reforma Geral de Apartamento (80m²)
1. Projeto de interiores e aprovação do condomínio (7 dias)
2. Demolição de paredes e retirada de revestimentos (4 dias após condomínio)
3. Reforma elétrica e adequação de pontos de luz (6 dias após demolição)
4. Reforma hidráulica de banheiros e cozinha (5 dias após demolição)
5. Instalação de gesso, forro e nivelamento de piso (5 dias após elétrica e hidráulica)
6. Pintura geral e instalação de pisos porcelanato (7 dias após forro)
7. Montagem de marcenaria e bancadas de pedra (8 dias após pintura)
8. Vistoria final e limpeza pós-obra (2 dias)`,
      tasks: [
        { id: 'T1', name: 'Projeto de interiores e aprovação condomínio', duration: 7, predecessors: [], phase: 'Planejamento', assignee: 'Arquiteta' },
        { id: 'T2', name: 'Demolição e retirada de entulho', duration: 4, predecessors: ['T1'], phase: 'Obra Bruta', assignee: 'Mestre de Obras' },
        { id: 'T3', name: 'Reforma elétrica e pontos de iluminação', duration: 6, predecessors: ['T2'], phase: 'Instalações', assignee: 'Eletricista' },
        { id: 'T4', name: 'Reforma hidráulica de banheiros e cozinha', duration: 5, predecessors: ['T2'], phase: 'Instalações', assignee: 'Encanador' },
        { id: 'T5', name: 'Instalação de gesso e forro', duration: 5, predecessors: ['T3', 'T4'], phase: 'Acabamento', assignee: 'Gesseiro' },
        { id: 'T6', name: 'Pintura geral e pisos', duration: 7, predecessors: ['T5'], phase: 'Acabamento', assignee: 'Pintores' },
        { id: 'T7', name: 'Montagem de marcenaria planejada', duration: 8, predecessors: ['T6'], phase: 'Mobiliário', assignee: 'Marceneiro' },
        { id: 'T8', name: 'Limpeza pós-obra e vistoria final', duration: 2, predecessors: ['T7'], phase: 'Entrega', assignee: 'Engenheiro' },
      ],
    },
    {
      title: 'Campanha de Lançamento de Produto Digital',
      category: 'Marketing & Vendas',
      icon: Megaphone,
      summary: 'Estratégia de lançamento com produção de vídeos, tráfego pago e evento ao vivo.',
      rawInstruction: `Projeto: Lançamento de Curso e Comunidade Online
1. Roteirização das aulas e definição da oferta (4 dias)
2. Gravação e edição de vídeos promocionais (7 dias após roteiro)
3. Construção da página de captura (Landing Page) (5 dias após roteiro)
4. Configuração do CRM e e-mails de nutrição (4 dias após landing page)
5. Aquecimento e anúncios nas redes sociais (10 dias após vídeos e CRM)
6. Abertura do carrinho e atendimento de vendas (5 dias após aquecimento)
7. Encerramento de matrículas e onboarding dos alunos (2 dias)`,
      tasks: [
        { id: 'T1', name: 'Roteirização e definição da oferta', duration: 4, predecessors: [], phase: 'Estratégia', assignee: 'Copywriter' },
        { id: 'T2', name: 'Gravação e edição de vídeos', duration: 7, predecessors: ['T1'], phase: 'Audiovisual', assignee: 'Videomaker' },
        { id: 'T3', name: 'Construção da Landing Page de captura', duration: 5, predecessors: ['T1'], phase: 'Design & Web', assignee: 'Web Designer' },
        { id: 'T4', name: 'Configuração do CRM e automação de e-mails', duration: 4, predecessors: ['T3'], phase: 'Operações', assignee: 'Gestor de Tráfego' },
        { id: 'T5', name: 'Campanha de tráfego pago e aquecimento', duration: 10, predecessors: ['T2', 'T4'], phase: 'Aquisição', assignee: 'Time de Mídia' },
        { id: 'T6', name: 'Abertura de carrinho e vendas ao vivo', duration: 5, predecessors: ['T5'], phase: 'Conversão', assignee: 'Equipe Comercial' },
        { id: 'T7', name: 'Onboarding e boas-vindas aos alunos', duration: 2, predecessors: ['T6'], phase: 'Pós-Venda', assignee: 'Suporte' },
      ],
    },
    {
      title: 'Desenvolvimento de Aplicativo Móvel (App iOS & Android)',
      category: 'Tecnologia & Software',
      icon: Cpu,
      summary: 'Ciclo completo de design, prototipação, backend API, aplicativo mobile e publicação.',
      rawInstruction: `Projeto: Aplicativo de Serviços On-Demand
1. Descoberta de requisitos e personas (4 dias)
2. Wireframes e Design System Figma (6 dias após requisitos)
3. Criação da infraestrutura de nuvem e banco de dados (5 dias após requisitos)
4. Desenvolvimento das APIs REST e autenticação (8 dias após banco)
5. Programação do App Mobile Flutter (10 dias após design e APIs)
6. Testes integrados e correção de falhas (4 dias após app)
7. Submissão na Google Play e Apple Store (3 dias após testes)`,
      tasks: [
        { id: 'T1', name: 'Descoberta de requisitos e personas', duration: 4, predecessors: [], phase: 'Discovery', assignee: 'Product Manager' },
        { id: 'T2', name: 'Wireframes e Design System Figma', duration: 6, predecessors: ['T1'], phase: 'Design', assignee: 'Designer UI/UX' },
        { id: 'T3', name: 'Infraestrutura de nuvem e banco de dados', duration: 5, predecessors: ['T1'], phase: 'Infra', assignee: 'DevOps' },
        { id: 'T4', name: 'Desenvolvimento das APIs e autenticação', duration: 8, predecessors: ['T3'], phase: 'Backend', assignee: 'Dev Backend' },
        { id: 'T5', name: 'Programação do App Mobile', duration: 10, predecessors: ['T2', 'T4'], phase: 'Frontend', assignee: 'Dev Mobile' },
        { id: 'T6', name: 'Testes integrados e correções', duration: 4, predecessors: ['T5'], phase: 'Qualidade', assignee: 'QA Tester' },
        { id: 'T7', name: 'Submissão nas lojas de aplicativos', duration: 3, predecessors: ['T6'], phase: 'Lançamento', assignee: 'Tech Lead' },
      ],
    },
  ];

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleLoadExample = (example: typeof EXAMPLE_PLANS[0]) => {
    const plan: ProjectPlan = {
      id: `ex-${Date.now()}`,
      name: example.title,
      description: example.summary,
      startDate: new Date().toISOString().split('T')[0],
      tasks: example.tasks,
    };
    onLoadPlan(plan);
    onClose();
  };

  const handleGenerateFromBuilder = async () => {
    const planText = `Projeto: ${builderTitle || 'Meu Projeto'}
${builderTasks.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}`;

    setIsGenerating(true);
    setBuilderError(null);

    try {
      const res = await fetch('/api/parse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planText }),
      });

      const data = await res.json();
      if (data.tasks && data.tasks.length > 0) {
        const newPlan: ProjectPlan = {
          id: `builder-${Date.now()}`,
          name: builderTitle || data.projectName || 'Projeto Planejado',
          description: `Projeto gerado a partir do Assistente de Instrução (${data.tasks.length} atividades interdependentes).`,
          startDate: new Date().toISOString().split('T')[0],
          tasks: data.tasks,
        };
        onLoadPlan(newPlan);
        onClose();
      } else {
        throw new Error('Não foi possível gerar as tarefas. Tente novamente.');
      }
    } catch (err: any) {
      setBuilderError(err.message || 'Erro ao processar instrução.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span>Guia de Instrução & Potencial do Aplicativo</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Manual Intuitivo
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Aprenda o que pode ser desenvolvido e como instruir a ferramenta com todos os detalhes essenciais.
              </p>
            </div>
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
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>1. O que pode ser desenvolvido & Como instruir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'builder'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>2. Construtor Guiado de Instrução (Passo a Passo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('examples')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'examples'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Modelos Reais Prontos para Testar</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Guia Conceitual & Regras de Ouro */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Scope Overview Card */}
              <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white rounded-2xl p-5 border border-indigo-100/80">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>O que você pode desenvolver e simular neste aplicativo?</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Qualquer projeto composto por etapas sequenciais ou paralelas pode ser modelado para simular o <strong>efeito cascata de atrasos</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-900 block mb-1">💻 Tecnologia & Software</span>
                    <span className="text-slate-500">Desenvolvimento web, apps móveis, migrações de nuvem e implantações de ERP.</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-900 block mb-1">🏗️ Obras & Construção</span>
                    <span className="text-slate-500">Reformas residenciais, alvarás, marcenaria, instalações elétricas e acabamentos.</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-900 block mb-1">🚀 Marketing & Vendas</span>
                    <span className="text-slate-500">Lançamento de produtos, gravações audiovisuais, campanhas de tráfego e feiras.</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-900 block mb-1">📋 Eventos & Operações</span>
                    <span className="text-slate-500">Conferências, casamentos, auditorias, contratações e processos regulatórios.</span>
                  </div>
                </div>
              </div>

              {/* The 4 Essential Pillars */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span>Os 4 Detalhes Essenciais para sua Instrução ficar perfeita</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Pillar 1 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-indigo-700">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">1</div>
                      <span>Nome da Tarefa (Verbo + Objeto)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Dê nomes específicos e claros que indiquem o que será entregue.
                    </p>
                    <div className="bg-white p-2 rounded border border-slate-200 text-slate-700 font-mono text-[11px]">
                      Ex: <span className="text-emerald-700 font-bold">"Design do Protótipo"</span> (em vez de apenas "Design")
                    </div>
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-indigo-700">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">2</div>
                      <span>Duração Estimada em Dias</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Sempre informe a duração entre parênteses ou após o nome (ex: 5 dias, 3d, 2 semanas).
                    </p>
                    <div className="bg-white p-2 rounded border border-slate-200 text-slate-700 font-mono text-[11px]">
                      Ex: <span className="text-emerald-700 font-bold">"(5 dias)"</span> ou <span className="text-emerald-700 font-bold">"Duração: 4 dias"</span>
                    </div>
                  </div>

                  {/* Pillar 3 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-indigo-700">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">3</div>
                      <span>Dependência Lógica (Quem espera quem)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Diga claramente qual tarefa precisa terminar antes ou se elas ocorrem ao mesmo tempo (em paralelo).
                    </p>
                    <div className="bg-white p-2 rounded border border-slate-200 text-slate-700 font-mono text-[11px]">
                      Ex: <span className="text-emerald-700 font-bold">"após a fundação"</span> ou <span className="text-emerald-700 font-bold">"paralela ao design"</span>
                    </div>
                  </div>

                  {/* Pillar 4 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-indigo-700">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">4</div>
                      <span>Fase ou Responsável (Opcional, mas enriquece)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Adicione quem executará a tarefa para visualizar gargalos de equipe.
                    </p>
                    <div className="bg-white p-2 rounded border border-slate-200 text-slate-700 font-mono text-[11px]">
                      Ex: <span className="text-emerald-700 font-bold">"Responsável: Engenheiro Civil"</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Box: Good Prompt vs Bad Prompt */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-700">
                  Comparação Visual: Instrução Ruim vs. Instrução Ideal
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
                  <div className="p-4 bg-rose-50/30 space-y-2">
                    <span className="font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      Instrução Fraca (Amígua / Sem durações)
                    </span>
                    <p className="text-slate-600 font-mono text-[11px] bg-white p-2.5 rounded border border-rose-200">
                      "Quero fazer um aplicativo. Preciso de design, programação, banco de dados, testes e colocar na loja."
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Problema: Não há prazos, nem ordem de dependência, nem quem pode ser feito em paralelo.
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50/30 space-y-2">
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Instrução Ideal (Estruturada & Poderosa)
                    </span>
                    <p className="text-slate-600 font-mono text-[11px] bg-white p-2.5 rounded border border-emerald-200">
                      "1. Wireframes e Design (5 dias)<br />
                      2. Modelagem do Banco (4 dias)<br />
                      3. Programação do App (10 dias após design e banco)<br />
                      4. Testes de Qualidade (4 dias após programação)<br />
                      5. Publicação na Loja (2 dias após testes)"
                    </p>
                    <p className="text-emerald-700 text-[11px] font-medium">
                      Resultado: O simulador calcula o caminho crítico exato e mostra com precisão o impacto cascata.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Interactive Prompt Builder */}
          {activeTab === 'builder' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                <span className="font-bold block mb-1">Como usar este assistente:</span>
                Preencha as informações do seu projeto abaixo. O construtor organizará a instrução automaticamente e você poderá enviá-la direto para o simulador!
              </div>

              {/* Step 1: Category & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome ou Título do Projeto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Reforma do Escritório Central"
                    value={builderTitle}
                    onChange={(e) => setBuilderTitle(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipo de Projeto
                  </label>
                  <select
                    value={builderCategory}
                    onChange={(e) => setBuilderCategory(e.target.value as any)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer bg-white"
                  >
                    <option value="software">💻 Tecnologia & Software</option>
                    <option value="construction">🏗️ Obras & Engenharia</option>
                    <option value="marketing">🚀 Marketing & Lançamento</option>
                    <option value="general">📋 Eventos / Gestão Geral</option>
                  </select>
                </div>
              </div>

              {/* Step 2: Task List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Etapas do Projeto (Arraste ou Edite as Atividades)
                </label>

                <div className="space-y-2">
                  {builderTasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="w-6 h-6 rounded-md bg-white border border-slate-200 font-mono text-xs font-bold flex items-center justify-center text-slate-600 flex-shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => {
                          const updated = [...builderTasks];
                          updated[index] = e.target.value;
                          setBuilderTasks(updated);
                        }}
                        className="flex-1 text-xs font-medium bg-transparent border-0 outline-hidden text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBuilderTasks(builderTasks.filter((_, i) => i !== index));
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 text-xs font-bold cursor-pointer"
                        title="Remover etapa"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new task field */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Adicionar nova etapa (ex: Homologação com clientes (4 dias))"
                    value={customTaskInput}
                    onChange={(e) => setCustomTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customTaskInput.trim()) {
                        setBuilderTasks([...builderTasks, customTaskInput.trim()]);
                        setCustomTaskInput('');
                      }
                    }}
                    className="flex-1 text-xs rounded-lg border border-slate-300 p-2 outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customTaskInput.trim()) {
                        setBuilderTasks([...builderTasks, customTaskInput.trim()]);
                        setCustomTaskInput('');
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {builderError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {builderError}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {builderTasks.length} etapas definidas
                </span>

                <button
                  type="button"
                  onClick={handleGenerateFromBuilder}
                  disabled={isGenerating || builderTasks.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gerando e Carregando Projeto...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Criar e Simular Este Projeto Agora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Real Example Templates */}
          {activeTab === 'examples' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Veja abaixo 4 modelos completos com a instrução exata usada para criá-los. Você pode <strong>carregar direto no simulador</strong> ou <strong>copiar o texto da instrução</strong> para adaptar ao seu projeto:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXAMPLE_PLANS.map((plan, idx) => {
                  const Icon = plan.icon;
                  const isCopied = copiedIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 flex flex-col justify-between gap-3 hover:border-indigo-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {plan.category}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {plan.tasks.length} tarefas
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {plan.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {plan.summary}
                        </p>

                        {/* Instruction preview box */}
                        <div className="mt-3 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 whitespace-pre-line line-clamp-4">
                          {plan.rawInstruction}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleCopyText(plan.rawInstruction, idx)}
                          className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Instrução</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLoadExample(plan)}
                          className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Carregar no Simulador</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

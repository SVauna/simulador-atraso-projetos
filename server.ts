import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Parse custom project plan into structured tasks
app.post('/api/parse-plan', async (req, res) => {
  try {
    const { planText } = req.body;
    if (!planText || typeof planText !== 'string' || !planText.trim()) {
      return res.status(400).json({ error: 'Texto do plano de projeto é obrigatório.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback: heuristic extraction if no API key
      const fallbackTasks = heuristicPlanParser(planText);
      return res.json({
        tasks: fallbackTasks,
        source: 'heuristic',
        message: 'Plano processado via analisador interno (chave Gemini não configurada).',
      });
    }

    const prompt = `Analise o plano de projeto a seguir e decomponha-o em uma lista sequencial de tarefas organizadas para cálculo do método do caminho crítico (CPM) e gráfico de Gantt.
Regras:
1. Extraia identificadores curtos para cada tarefa (ex: "T1", "T2", "T3").
2. Duração ("duration") em dias úteis (inteiro >= 1). Se não especificada, estime um valor realista entre 1 e 10 dias.
3. Predecessoras ("predecessors"): IDs das tarefas que DEVEM ser concluídas antes que esta comece. A primeira tarefa geralmente tem predecessoras vazias []. Não crie ciclos de dependência.
4. "phase": categoria ou fase do projeto (ex: Planejamento, Design, Desenvolvimento, Testes, Lançamento).
5. "name": nome claro e conciso em Português.
6. "assignee": cargo ou responsável sugerido (ex: "Gerente de Projeto", "Designer UI", "Dev Backend").

Plano fornecido:
"""
${planText}
"""`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Você é um especialista sênior em gestão de projetos, cronogramas e Método do Caminho Crítico (CPM). Responda estritamente no schema JSON solicitado.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING, description: 'Nome descritivo do projeto' },
            description: { type: Type.STRING, description: 'Breve descrição do escopo' },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Ex: T1, T2' },
                  name: { type: Type.STRING, description: 'Nome da tarefa' },
                  duration: { type: Type.INTEGER, description: 'Duração em dias inteiros' },
                  predecessors: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Lista de IDs de tarefas predecessoras',
                  },
                  phase: { type: Type.STRING, description: 'Fase ou categoria' },
                  assignee: { type: Type.STRING, description: 'Responsável' },
                },
                required: ['id', 'name', 'duration', 'predecessors', 'phase'],
              },
            },
          },
          required: ['projectName', 'tasks'],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout')), 8000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      projectName: parsed.projectName || 'Projeto Personalizado',
      description: parsed.description || '',
      tasks: parsed.tasks || [],
      source: 'gemini',
    });
  } catch (error: any) {
    console.error('Error parsing plan with Gemini:', error);
    // Return heuristic fallback on error
    const fallbackTasks = heuristicPlanParser(req.body?.planText || '');
    return res.json({
      projectName: 'Projeto Processado',
      tasks: fallbackTasks,
      source: 'heuristic',
      warning: 'Ocorreu um erro com o modelo de IA; foi gerado um plano heurístico.',
    });
  }
});

// Generate realistic template plan via prompt
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { prompt: userPrompt } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: 'Chave GEMINI_API_KEY não configurada no servidor. Utilize os modelos prontos.',
      });
    }

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Gere uma estrutura analítica de projeto (EAP / WBS) detalhada com 6 a 10 tarefas interdependentes para o seguinte objetivo:
"${userPrompt}"
Certifique-se de que haja ramificações paralelas e um caminho crítico evidente com durações realistas em dias.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            description: { type: Type.STRING },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  duration: { type: Type.INTEGER },
                  predecessors: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  phase: { type: Type.STRING },
                  assignee: { type: Type.STRING },
                },
                required: ['id', 'name', 'duration', 'predecessors', 'phase'],
              },
            },
          },
          required: ['projectName', 'tasks'],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout')), 8000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar plano com IA.' });
  }
});

// AI Mitigation recommendations for a specific delay scenario
app.post('/api/analyze-delay', async (req, res) => {
  try {
    const { delayedTaskName, delayDays, projectShiftDays, affectedTasks, criticalPathTasks } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        recommendations: [
          `Aplique Fast-Tracking (execução em paralelo) nas próximas tarefas do caminho crítico (${criticalPathTasks.slice(0, 2).join(', ')}).`,
          `Avalie Crashing (alocação de mais pessoas ou horas extras) na tarefa '${delayedTaskName}' para recuperar os ${delayDays} dias perdidos.`,
          `Comunique os stakeholders imediatamente sobre a postergação prevista de ${projectShiftDays} dias para alinhar expectativas.`,
        ],
      });
    }

    const prompt = `Um projeto sofreu atraso:
- Tarefa atrasada: "${delayedTaskName}"
- Atraso inserido: ${delayDays} dias
- Impacto na data final do projeto: ${projectShiftDays} dias a mais
- Tarefas sucessoras afetadas diretamente: ${affectedTasks.join(', ') || 'Nenhuma'}
- Tarefas no Caminho Crítico: ${criticalPathTasks.join(', ') || 'Nenhuma'}

Forneça 3 a 4 recomendações práticas de gestão de projetos (ex: Fast-Tracking, Crashing, descarte de escopo secundário, renegociação de marcos) para absorver ou mitigar esse impacto. Seja conciso e profissional em Português.`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Diagnóstico do impacto em 1 frase' },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['summary', 'recommendations'],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout')), 8000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in analyze-delay:', error);
    res.json({
      summary: 'Impacto calculado pelo simulador de caminho crítico.',
      recommendations: [
        'Considere paralelizar atividades sucessoras que não tenham dependência estrita.',
        'Reforce a equipe nas tarefas subsequentes do caminho crítico.',
        'Monitore a folga das atividades paralelas para evitar novos atrasos.',
      ],
    });
  }
});

// Basic heuristic parser for raw text when AI is unavailable or temporary 503
function heuristicPlanParser(text: string) {
  // Split by newlines, semicolons, or numbered list indicators (e.g., "1.", "2.")
  let rawSegments: string[] = [];
  if (text.includes('\n')) {
    rawSegments = text.split('\n');
  } else if (/\d+\.\s+/.test(text)) {
    rawSegments = text.split(/(?=\d+\.\s+)/);
  } else if (text.includes(';')) {
    rawSegments = text.split(';');
  } else {
    rawSegments = [text];
  }

  const tasks: Array<{
    id: string;
    name: string;
    duration: number;
    predecessors: string[];
    phase: string;
    assignee: string;
  }> = [];

  let currentPhase = 'Planejamento';
  let counter = 1;

  for (const seg of rawSegments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    // Check if segment is just a header
    if (trimmed.endsWith(':') && trimmed.length < 35) {
      currentPhase = trimmed.replace(/:$/, '');
      continue;
    }

    const cleaned = trimmed.replace(/^[-*•\d.)\s]+/, '').trim();
    if (cleaned.length < 2) continue;

    // Extract duration (e.g., "(4 dias)", "5d", "2 semanas")
    let duration = 3;
    const durMatch = trimmed.match(/(\d+)\s*(dia|dias|d|semana|semanas|sem)\b/i);
    if (durMatch) {
      const num = parseInt(durMatch[1], 10);
      if (durMatch[2].toLowerCase().startsWith('sem')) {
        duration = num * 5;
      } else {
        duration = Math.max(1, num);
      }
    }

    const id = `T${counter}`;
    // Link to previous task by default unless it's the first or parallel
    let predecessors: string[] = [];
    if (counter > 1) {
      if (trimmed.toLowerCase().includes('paralel') || trimmed.toLowerCase().includes('simultân')) {
        // parallel to previous, link to two steps back if exists
        predecessors = counter > 2 ? [`T${counter - 2}`] : [];
      } else {
        predecessors = [`T${counter - 1}`];
      }
    }

    // Guess phase
    let phase = currentPhase;
    const lower = cleaned.toLowerCase();
    if (lower.includes('design') || lower.includes('layout') || lower.includes('ux') || lower.includes('ui') || lower.includes('arte')) {
      phase = 'Design';
    } else if (lower.includes('desenvolv') || lower.includes('program') || lower.includes('api') || lower.includes('banco') || lower.includes('constru') || lower.includes('obra')) {
      phase = 'Execução';
    } else if (lower.includes('test') || lower.includes('qa') || lower.includes('qualidade') || lower.includes('revis') || lower.includes('vistoria')) {
      phase = 'Qualidade';
    } else if (lower.includes('lança') || lower.includes('deploy') || lower.includes('entrega') || lower.includes('publica') || lower.includes('evento')) {
      phase = 'Lançamento';
    }

    tasks.push({
      id,
      name: cleaned.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim(),
      duration,
      predecessors,
      phase,
      assignee: 'Equipe de Projeto',
    });

    counter++;
    if (counter > 15) break;
  }

  if (tasks.length === 0) {
    return [
      { id: 'T1', name: 'Alinhamento Inicial de Escopo', duration: 3, predecessors: [], phase: 'Planejamento', assignee: 'Gerente' },
      { id: 'T2', name: 'Criação de Protótipo e Design', duration: 5, predecessors: ['T1'], phase: 'Design', assignee: 'Designer' },
      { id: 'T3', name: 'Desenvolvimento Frontend & Backend', duration: 8, predecessors: ['T2'], phase: 'Desenvolvimento', assignee: 'Engenheiro' },
      { id: 'T4', name: 'Testes de Qualidade e Homologação', duration: 4, predecessors: ['T3'], phase: 'Testes', assignee: 'QA' },
      { id: 'T5', name: 'Publicação e Lançamento', duration: 2, predecessors: ['T4'], phase: 'Lançamento', assignee: 'DevOps' },
    ];
  }

  return tasks;
}

// Vite & Static file handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

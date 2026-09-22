import { Task, CalculatedTask, ScheduleSimulationResult, CascadeStep } from '../types';

export function calculateScheduleSimulation(
  rawTasks: Task[],
  delayedTaskId: string | null = null,
  delayDays: number = 0
): ScheduleSimulationResult {
  if (!rawTasks || rawTasks.length === 0) {
    return {
      tasks: [],
      baselineProjectDuration: 0,
      simulatedProjectDuration: 0,
      projectDelayDays: 0,
      delayedTaskId: null,
      delayedTaskDelay: 0,
      baselineCriticalPath: [],
      simulatedCriticalPath: [],
      affectedTaskIds: [],
      cascadeChain: [],
      hasCycles: false,
    };
  }

  // 1. Cycle detection & Topological Sort
  const taskMap = new Map<string, Task>();
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>(); // predecessor -> successors

  rawTasks.forEach(task => {
    taskMap.set(task.id, task);
    inDegree.set(task.id, 0);
    adjList.set(task.id, []);
  });

  rawTasks.forEach(task => {
    const validPreds = (task.predecessors || []).filter(predId => taskMap.has(predId));
    inDegree.set(task.id, validPreds.length);
    validPreds.forEach(predId => {
      adjList.get(predId)?.push(task.id);
    });
  });

  // Kahn's algorithm for topological order
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topoOrder.push(current);

    const neighbors = adjList.get(current) || [];
    neighbors.forEach(neighbor => {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    });
  }

  const hasCycles = topoOrder.length !== rawTasks.length;
  if (hasCycles) {
    // Return safe fallback without crashing
    return {
      tasks: rawTasks.map(t => ({
        ...t,
        baselineES: 0,
        baselineEF: t.duration,
        baselineLS: 0,
        baselineLF: t.duration,
        baselineSlack: 0,
        isBaselineCritical: true,
        simulatedDuration: t.duration,
        simulatedES: 0,
        simulatedEF: t.duration,
        simulatedLS: 0,
        simulatedLF: t.duration,
        simulatedSlack: 0,
        isSimulatedCritical: true,
        directDelay: 0,
        isDirectlyDelayed: false,
        startDelayShift: 0,
        finishDelayShift: 0,
        isCascadedDelayed: false,
        slackAbsorbed: 0,
        becameCritical: false,
      })),
      baselineProjectDuration: Math.max(...rawTasks.map(t => t.duration)),
      simulatedProjectDuration: Math.max(...rawTasks.map(t => t.duration)),
      projectDelayDays: 0,
      delayedTaskId: null,
      delayedTaskDelay: 0,
      baselineCriticalPath: [],
      simulatedCriticalPath: [],
      affectedTaskIds: [],
      cascadeChain: [],
      hasCycles: true,
    };
  }

  // Helper function to run CPM passes
  function computeCpmPasses(getDuration: (t: Task) => number) {
    const ES = new Map<string, number>();
    const EF = new Map<string, number>();
    const LS = new Map<string, number>();
    const LF = new Map<string, number>();

    // Forward Pass
    for (const taskId of topoOrder) {
      const task = taskMap.get(taskId)!;
      const validPreds = (task.predecessors || []).filter(p => taskMap.has(p));
      const dur = Math.max(1, getDuration(task));

      let earlyStart = 0;
      if (validPreds.length > 0) {
        earlyStart = Math.max(...validPreds.map(p => EF.get(p) ?? 0));
      }
      ES.set(taskId, earlyStart);
      EF.set(taskId, earlyStart + dur);
    }

    let projectDuration = 0;
    EF.forEach(val => {
      if (val > projectDuration) projectDuration = val;
    });

    // Backward Pass
    for (let i = topoOrder.length - 1; i >= 0; i--) {
      const taskId = topoOrder[i];
      const task = taskMap.get(taskId)!;
      const dur = Math.max(1, getDuration(task));
      const successors = adjList.get(taskId) || [];

      let lateFinish = projectDuration;
      if (successors.length > 0) {
        lateFinish = Math.min(...successors.map(s => LS.get(s) ?? projectDuration));
      }
      LF.set(taskId, lateFinish);
      LS.set(taskId, lateFinish - dur);
    }

    const slack = new Map<string, number>();
    const isCritical = new Map<string, boolean>();

    topoOrder.forEach(id => {
      const es = ES.get(id) || 0;
      const ls = LS.get(id) || 0;
      const s = Math.max(0, ls - es);
      slack.set(id, s);
      isCritical.set(id, s === 0);
    });

    return { ES, EF, LS, LF, slack, isCritical, projectDuration };
  }

  // 1. Compute Baseline
  const baseline = computeCpmPasses(t => t.duration);

  // 2. Compute Simulated (with delay applied to chosen task)
  const actualDelay = Math.max(0, delayDays);
  const simulated = computeCpmPasses(t => {
    if (delayedTaskId && t.id === delayedTaskId) {
      return t.duration + actualDelay;
    }
    return t.duration;
  });

  const projectDelayDays = Math.max(0, simulated.projectDuration - baseline.projectDuration);

  // 3. Find downstream successors of the delayed task (transitive closure)
  const downstreamSet = new Set<string>();
  if (delayedTaskId && actualDelay > 0) {
    const queueDown = [...(adjList.get(delayedTaskId) || [])];
    while (queueDown.length > 0) {
      const curr = queueDown.shift()!;
      if (!downstreamSet.has(curr)) {
        downstreamSet.add(curr);
        const next = adjList.get(curr) || [];
        next.forEach(n => queueDown.push(n));
      }
    }
  }

  // 4. Build CalculatedTask list
  const calculatedTasks: CalculatedTask[] = rawTasks.map(t => {
    const bES = baseline.ES.get(t.id) || 0;
    const bEF = baseline.EF.get(t.id) || 0;
    const bLS = baseline.LS.get(t.id) || 0;
    const bLF = baseline.LF.get(t.id) || 0;
    const bSlack = baseline.slack.get(t.id) || 0;
    const bCrit = baseline.isCritical.get(t.id) || false;

    const isDirectlyDelayed = Boolean(delayedTaskId && t.id === delayedTaskId && actualDelay > 0);
    const directDelay = isDirectlyDelayed ? actualDelay : 0;
    const simDur = t.duration + directDelay;

    const sES = simulated.ES.get(t.id) || 0;
    const sEF = simulated.EF.get(t.id) || 0;
    const sLS = simulated.LS.get(t.id) || 0;
    const sLF = simulated.LF.get(t.id) || 0;
    const sSlack = simulated.slack.get(t.id) || 0;
    const sCrit = simulated.isCritical.get(t.id) || false;

    const startDelayShift = Math.max(0, sES - bES);
    const finishDelayShift = Math.max(0, sEF - bEF);
    const isCascadedDelayed = !isDirectlyDelayed && finishDelayShift > 0 && downstreamSet.has(t.id);
    const slackAbsorbed = Math.max(0, bSlack - sSlack);
    const becameCritical = !bCrit && sCrit;

    return {
      ...t,
      baselineES: bES,
      baselineEF: bEF,
      baselineLS: bLS,
      baselineLF: bLF,
      baselineSlack: bSlack,
      isBaselineCritical: bCrit,
      simulatedDuration: simDur,
      simulatedES: sES,
      simulatedEF: sEF,
      simulatedLS: sLS,
      simulatedLF: sLF,
      simulatedSlack: sSlack,
      isSimulatedCritical: sCrit,
      directDelay,
      isDirectlyDelayed,
      startDelayShift,
      finishDelayShift,
      isCascadedDelayed,
      slackAbsorbed,
      becameCritical,
    };
  });

  const baselineCriticalPath = calculatedTasks.filter(t => t.isBaselineCritical).map(t => t.id);
  const simulatedCriticalPath = calculatedTasks.filter(t => t.isSimulatedCritical).map(t => t.id);
  const affectedTaskIds = calculatedTasks.filter(t => t.finishDelayShift > 0).map(t => t.id);

  // 5. Build Step-by-Step Cascade Chain explanation
  const cascadeChain: CascadeStep[] = [];
  if (delayedTaskId && actualDelay > 0) {
    const delayedTask = calculatedTasks.find(t => t.id === delayedTaskId);
    if (delayedTask) {
      cascadeChain.push({
        taskId: delayedTask.id,
        taskName: delayedTask.name,
        type: 'direct_source',
        daysDelayed: actualDelay,
        slackRemaining: delayedTask.simulatedSlack,
        description: `Atraso direto de +${actualDelay} dia${actualDelay > 1 ? 's' : ''} introduzido nesta tarefa.`,
        impactOnProject: delayedTask.finishDelayShift > 0 && delayedTask.isBaselineCritical,
      });

      // Follow downstream tasks in topological order
      topoOrder.forEach(id => {
        if (id === delayedTaskId || !downstreamSet.has(id)) return;
        const task = calculatedTasks.find(t => t.id === id);
        if (!task) return;

        if (task.startDelayShift > 0) {
          if (task.finishDelayShift > 0) {
            cascadeChain.push({
              taskId: task.id,
              taskName: task.name,
              type: 'pushed_start',
              daysDelayed: task.finishDelayShift,
              slackRemaining: task.simulatedSlack,
              description: `Início postergado em +${task.startDelayShift} dias por dependência. Término adiado em +${task.finishDelayShift} dias.`,
              impactOnProject: task.isSimulatedCritical,
            });
          } else {
            cascadeChain.push({
              taskId: task.id,
              taskName: task.name,
              type: 'slack_absorbed',
              daysDelayed: task.startDelayShift,
              slackRemaining: task.simulatedSlack,
              description: `Absorveu o atraso usando ${task.slackAbsorbed} dias de folga (restam ${task.simulatedSlack} dias de folga). Não atrasou a data final.`,
              impactOnProject: false,
            });
          }
        }
      });
    }
  }

  return {
    tasks: calculatedTasks,
    baselineProjectDuration: baseline.projectDuration,
    simulatedProjectDuration: simulated.projectDuration,
    projectDelayDays,
    delayedTaskId,
    delayedTaskDelay: actualDelay,
    baselineCriticalPath,
    simulatedCriticalPath,
    affectedTaskIds,
    cascadeChain,
    hasCycles: false,
  };
}

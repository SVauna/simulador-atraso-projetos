export interface Task {
  id: string;
  name: string;
  duration: number; // in days (minimum 1)
  predecessors: string[]; // IDs of tasks that must complete before this starts
  phase: string;
  assignee?: string;
  description?: string;
}

export interface CalculatedTask extends Task {
  // Baseline (original schedule without delay)
  baselineES: number; // Early Start
  baselineEF: number; // Early Finish
  baselineLS: number; // Late Start
  baselineLF: number; // Late Finish
  baselineSlack: number; // Total Float / Slack
  isBaselineCritical: boolean;

  // Simulated (with delay applied)
  simulatedDuration: number;
  simulatedES: number;
  simulatedEF: number;
  simulatedLS: number;
  simulatedLF: number;
  simulatedSlack: number;
  isSimulatedCritical: boolean;

  // Impact analysis
  directDelay: number; // Delay explicitly injected into this task
  isDirectlyDelayed: boolean;
  startDelayShift: number; // Delay in start date due to predecessors finishing late
  finishDelayShift: number; // Total delay in finish date compared to baseline
  isCascadedDelayed: boolean; // Delayed because an upstream task was delayed
  slackAbsorbed: number; // How much delay was absorbed by this task's baseline slack
  becameCritical: boolean; // Was not critical in baseline, but became critical due to delay
}

export interface ScheduleSimulationResult {
  tasks: CalculatedTask[];
  baselineProjectDuration: number;
  simulatedProjectDuration: number;
  projectDelayDays: number;
  delayedTaskId: string | null;
  delayedTaskDelay: number;
  baselineCriticalPath: string[];
  simulatedCriticalPath: string[];
  affectedTaskIds: string[]; // tasks whose EF changed
  cascadeChain: CascadeStep[];
  hasCycles: boolean;
  cycleNodes?: string[];
}

export interface CascadeStep {
  taskId: string;
  taskName: string;
  type: 'direct_source' | 'pushed_start' | 'slack_absorbed' | 'unaffected';
  daysDelayed: number;
  slackRemaining: number;
  description: string;
  impactOnProject: boolean;
}

export interface ProjectPlan {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO format YYYY-MM-DD
  tasks: Task[];
}

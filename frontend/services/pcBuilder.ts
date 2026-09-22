import { CPUs, GPUs, Motherboards, RAMs, Storages, PowerSupplies, Cases } from './pcComponents';

export interface Suggestion {
  partType: string;
  currentName: string;
  suggestedName: string;
  reason: string;
}

export interface DetailedBottleneck {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  fix: string;
}

export interface CompatibilityAnalysis {
  status: 'PASS' | 'WARNING' | 'FAIL';
  issues: string[];
  bottlenecks: string[];
  detailedBottlenecks: DetailedBottleneck[];
  score: number;
  estimatedUSD: number;
  estimatedPKR: number;
  estimatedUSDMin: number;
  estimatedUSDMax: number;
  estimatedPKRMin: number;
  estimatedPKRMax: number;
  totalPowerWatts: number;
  psuMaxWatts: number;
  powerConsumptionSafetyMargin: number;
  gamingSuitability: number;
  editingSuitability: number;
  officeSuitability: number;
  suggestions: Suggestion[];
  optimizedBuildRecommendation?: string;
  scoreBreakdown: {
    socketCompatibility: number;
    memoryMatch: number;
    powerHeadroom: number;
    bottleneckImbalance: number;
    storageSpeed: number;
    caseFormFactor: number;
  };
}

export const evaluatePCBuild = (build: {
  cpuId: string;
  gpuId: string;
  motherboardId: string;
  ramId: string;
  storageId: string;
  powerSupplyId: string;
  caseId?: string;
}): CompatibilityAnalysis => {
  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  const issues: string[] = [];
  const bottlenecks: string[] = [];
  const detailedBottlenecks: DetailedBottleneck[] = [];
  const suggestions: Suggestion[] = [];

  // Specific Score Deductions
  let socketScore = 20;
  let memoryScore = 20;
  let powerScore = 20;
  let redundancyScore = 20;
  let storageScore = 10;
  let caseScore = 10;

  const cpu = CPUs.find(c => c.id === build.cpuId);
  const gpu = GPUs.find(g => g.id === build.gpuId);
  const mobo = Motherboards.find(m => m.id === build.motherboardId);
  const ram = RAMs.find(r => r.id === build.ramId);
  const storage = Storages.find(s => s.id === build.storageId);
  const psu = PowerSupplies.find(p => p.id === build.powerSupplyId);
  const pcCase = Cases.find(c => c.id === build.caseId);

  const suggestedParts = new Set<string>();

  const addBottleneck = (type: string, severity: DetailedBottleneck['severity'], description: string, fix: string) => {
    bottlenecks.push(`${type} (${severity}): ${description}`);
    detailedBottlenecks.push({ type, severity, description, fix });
  };

  const pushSuggestion = (partType: string, currentName: string, suggestedName: string, reason: string) => {
    if (suggestedParts.has(partType)) return; // one swap suggestion per part type
    suggestedParts.add(partType);
    suggestions.push({ partType, currentName, suggestedName, reason });
  };

  // 1. Calculate Core Pricing (PKR)
  let estimatedPKR = 0;
  if (cpu) estimatedPKR += cpu.price;
  if (gpu) estimatedPKR += gpu.price;
  if (mobo) estimatedPKR += mobo.price;
  if (ram) estimatedPKR += ram.price;
  if (storage) estimatedPKR += storage.price;
  if (psu) estimatedPKR += psu.price;
  if (pcCase) estimatedPKR += pcCase.price;

  const estimatedUSD = Math.round(estimatedPKR / 278);
  const estimatedPKRMin = Math.round(estimatedPKR * 0.95);
  const estimatedPKRMax = Math.round(estimatedPKR * 1.05);
  const estimatedUSDMin = Math.round(estimatedUSD * 0.95);
  const estimatedUSDMax = Math.round(estimatedUSD * 1.05);

  // 2. Power Consumption Math
  let cpuPower = 65;
  if (cpu) {
    if (cpu.id === 'cpu-14900k') cpuPower = 253;
    else if (cpu.id === 'cpu-14700k') cpuPower = 253;
    else if (cpu.id === 'cpu-13600k') cpuPower = 181;
    else if (cpu.id === 'cpu-7800x3d') cpuPower = 120;
    else if (cpu.id === 'cpu-5800x3d') cpuPower = 105;
    else cpuPower = 95;
  }

  let gpuPower = 150;
  if (gpu) {
    if (gpu.id === 'gpu-4090') gpuPower = 450;
    else if (gpu.id === 'gpu-4080s') gpuPower = 320;
    else if (gpu.id === 'gpu-7900xtx') gpuPower = 355;
    else if (gpu.id === 'gpu-4070s') gpuPower = 220;
    else if (gpu.id === 'gpu-7800xt') gpuPower = 263;
    else if (gpu.id === 'gpu-4060') gpuPower = 115;
    else if (gpu.id === 'gpu-7600xt') gpuPower = 190;
  }

  const systemOverhead = 60;
  const totalPowerWatts = (cpu ? cpuPower : 0) + (gpu ? gpuPower : 0) + systemOverhead;
  const psuMaxWatts = psu ? psu.wattage : 500;

  // 3. COMPONENT COMPATIBILITY CRITIQUE

  // A. CPU ↔ Motherboard socket match
  if (cpu && mobo && cpu.socket !== mobo.socket) {
    status = 'FAIL';
    socketScore = 0;
    issues.push(`Incompatible Socket: CPU [${cpu.name}] has socket [${cpu.socket}], but motherboard [${mobo.name}] operates on [${mobo.socket}].`);
    const match = Motherboards.find(m => m.socket === cpu.socket);
    if (match) {
      pushSuggestion('Motherboard', mobo.name, match.name, `Switch to a ${cpu.socket} board so the ${cpu.name} seats correctly.`);
    }
  }

  // B. RAM ↔ Motherboard DDR memory generation match
  if (mobo && ram && mobo.memoryType !== ram.memoryType) {
    status = 'FAIL';
    memoryScore = 0;
    issues.push(`RAM Standard Mismatch: Motherboard [${mobo.name}] fits [${mobo.memoryType}], but selected RAM [${ram.name}] is [${ram.memoryType}].`);
    const match = RAMs.find(r => r.memoryType === mobo.memoryType);
    if (match) {
      pushSuggestion('RAM', ram.name, match.name, `This motherboard requires ${mobo.memoryType} memory kits.`);
    }
  }

  // C. Case Sizing Match
  if (mobo && pcCase && mobo.formFactor === 'ATX' && pcCase.formFactor === 'mATX') {
    status = 'FAIL';
    caseScore = 0;
    issues.push(`Chassis Sizing Collision: Motherboard [${mobo.name}] is size [ATX], which will not fit inside mATX case [${pcCase.name}].`);
    const match = Cases.find(c => c.formFactor === 'ATX' && (!gpu || c.maxGpuLength >= gpu.length));
    if (match) {
      pushSuggestion('Case', pcCase.name, match.name, 'Pick an ATX chassis that accommodates the board and GPU clearance.');
    }
  }

  // D. Case GPU length clearance check
  if (gpu && pcCase && gpu.length > pcCase.maxGpuLength) {
    status = 'FAIL';
    caseScore = Math.max(0, caseScore - 5);
    issues.push(`GPU Clearance Collision: Selected GPU [${gpu.name}] is too long (${gpu.length}mm) for Case [${pcCase.name}] (${pcCase.maxGpuLength}mm limit).`);
    const match = Cases.find(c => c.maxGpuLength >= gpu.length && (!mobo || c.formFactor === mobo.formFactor || c.formFactor === 'ATX'));
    if (match) {
      pushSuggestion('Case', pcCase.name, match.name, `The ${gpu.name} needs ${gpu.length}mm of clearance.`);
    }
  }

  // E. GPU ↔ Power Supply watt requirement
  if (gpu && psu) {
    if (psu.wattage < gpu.minPower) {
      status = 'FAIL';
      powerScore = 0;
      issues.push(`Underpowered PSU for GPU: Selected GPU [${gpu.name}] demands a minimum power supply of [${gpu.minPower}W]. Your selected PSU is only [${psu.wattage}W].`);
      const needed = Math.max(gpu.minPower, totalPowerWatts + 100);
      const match = [...PowerSupplies].sort((a, b) => a.wattage - b.wattage).find(p => p.wattage >= needed);
      if (match) {
        pushSuggestion('Power Supply', psu.name, match.name, `The ${gpu.name} requires at least ${gpu.minPower}W — this unit provides a safe margin.`);
      }
    } else if (psu.wattage < totalPowerWatts) {
      status = 'FAIL';
      powerScore = 0;
      issues.push(`Total Watts Power Draw Overload: Estimated peaks [${totalPowerWatts}W] exceed PSU ceiling limit [${psu.wattage}W].`);
      const match = [...PowerSupplies].sort((a, b) => a.wattage - b.wattage).find(p => p.wattage >= totalPowerWatts + 100);
      if (match) {
        pushSuggestion('Power Supply', psu.name, match.name, `Estimated peak draw is ${totalPowerWatts}W — a ${match.wattage}W unit leaves safe headroom.`);
      }
    } else if (psu.wattage < totalPowerWatts + 100) {
      if (status !== 'FAIL') status = 'WARNING';
      powerScore = 10;
      issues.push(`Critical PSU Margin Warning: Margin is tighter than 100W under maximum diagnostic loads.`);
    }
  }

  // 4. ADVANCED BOTTLENECK ANALYSIS ENGINE

  // GPU tier vs CPU tier imbalance
  if (gpu && cpu) {
    if (gpu.tier === 'HIGH' && cpu.tier === 'MID') {
      addBottleneck('GPU Bottleneck', 'MEDIUM', 'Graphics speed holds back CPU frame timing in competitive esports.', 'Pair the GPU with a HIGH-tier CPU, or drop to a MID-tier GPU to balance the build.');
      redundancyScore = 14;
    } else if (gpu.tier === 'HIGH' && cpu.tier === 'LOW') {
      addBottleneck('GPU Bottleneck', 'HIGH', 'Massive processing bottleneck predicted — the CPU cannot feed the GPU fast enough.', 'Upgrade to a HIGH-tier CPU (or step the GPU down to balance the system).');
      redundancyScore = 8;
    }
    // Ultra-tier CPU with a low-tier GPU — underused processor
    if (cpu.tier === 'HIGH' && gpu.tier === 'LOW') {
      addBottleneck('CPU Bottleneck', 'MEDIUM', 'The processor is far stronger than the GPU for gaming workloads.', 'Consider a stronger GPU to match the CPU, or save cost with a mid-range CPU.');
      redundancyScore = Math.min(redundancyScore, 14);
    }
  }

  // 5. WORKLOAD SUITABILITY PRESETS
  let gamingSuitability = 10;
  let editingSuitability = 10;
  let officeSuitability = 50;

  if (cpu && gpu) {
    const gpuContrib = gpu.tier === 'HIGH' ? 60 : gpu.tier === 'MID' ? 40 : 20;
    const cpuContrib = cpu.tier === 'HIGH' ? 30 : cpu.tier === 'MID' ? 20 : 10;
    gamingSuitability = Math.min(100, gpuContrib + cpuContrib);
    editingSuitability = Math.min(100, cpuContrib * 2 + gpuContrib / 2);
  }
  officeSuitability = status === 'PASS' ? 95 : 60;

  // 6. TALLY FINAL GRADED SCORE
  const score = Math.max(0, Math.min(100, socketScore + memoryScore + powerScore + redundancyScore + storageScore + caseScore));
  const powerConsumptionSafetyMargin = psuMaxWatts > 0 ? Math.round(((psuMaxWatts - totalPowerWatts) / psuMaxWatts) * 100) : 0;

  return {
    status,
    issues,
    bottlenecks,
    detailedBottlenecks,
    score,
    estimatedUSD,
    estimatedPKR,
    estimatedUSDMin,
    estimatedUSDMax,
    estimatedPKRMin,
    estimatedPKRMax,
    totalPowerWatts,
    psuMaxWatts,
    powerConsumptionSafetyMargin,
    gamingSuitability,
    editingSuitability,
    officeSuitability,
    suggestions,
    scoreBreakdown: {
      socketCompatibility: socketScore,
      memoryMatch: memoryScore,
      powerHeadroom: powerScore,
      bottleneckImbalance: Math.max(0, redundancyScore),
      storageSpeed: storageScore,
      caseFormFactor: caseScore,
    }
  };
};

/**
 * ASYNC WRAPPER FOR BUILDER EVALUATION
 *
 * Runs the local analysis engine synchronously. The remote scoring service
 * was retired with the legacy Python backend — all checks, pricing and
 * bottleneck math are performed in-browser and re-verified server-side on save.
 */
export async function evaluatePCBuildAsync(build: any): Promise<CompatibilityAnalysis> {
  return evaluatePCBuild(build);
}

import { profileCSV } from "./profile";
import { checkQuality } from "./quality";
import { analyze } from "./analyze";
import { computeStats } from "./stats";
import type { FileProfile, PipelineOutput } from "./types";
import type { ComputedStats } from "./stats";

export interface RunPipelineInput {
  csvContent: string;
  fileName: string;
  storagePath: string;
  briefText?: string;
  businessGoal?: string;
}

export interface RunPipelineResult {
  profile: FileProfile;
  output: PipelineOutput;
  stats: ComputedStats;
}

export function runPipeline(input: RunPipelineInput): RunPipelineResult {
  const { csvContent, fileName, storagePath, briefText, businessGoal } = input;

  const profile = profileCSV(csvContent, fileName, storagePath);

  const qualityFlags = checkQuality(profile, briefText);

  const stats = computeStats(csvContent, profile);

  const output = analyze(profile, qualityFlags, briefText, businessGoal);

  return { profile, output, stats };
}

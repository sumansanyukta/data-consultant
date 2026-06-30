import { profileCSV } from "./profile";
import { checkQuality } from "./quality";
import { analyze } from "./analyze";
import type { FileProfile, PipelineOutput } from "./types";

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
}

export function runPipeline(input: RunPipelineInput): RunPipelineResult {
  const { csvContent, fileName, storagePath, briefText, businessGoal } = input;

  // Step 2: Profile
  const profile = profileCSV(csvContent, fileName, storagePath);

  // Step 3: Quality
  const qualityFlags = checkQuality(profile, briefText);

  // Step 4: Analyze
  const output = analyze(profile, qualityFlags, briefText, businessGoal);

  return { profile, output };
}

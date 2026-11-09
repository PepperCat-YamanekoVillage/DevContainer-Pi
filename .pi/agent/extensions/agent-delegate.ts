/**
 * Sub-agent delegation tools.
 *
 * `delegate` runs a self-contained task in a fresh pi session (difficulty -> model).
 * `background=true` queues it via pueue instead; results are read back with `delegate_status`.
 * Replaces the "Agent Delegation" section of AGENTS.md.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";

const run = (cmd: string, args: string[], opts: Parameters<typeof execFile>[2]) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = execFile(cmd, args, opts, (err, stdout, stderr) =>
      err ? reject(Object.assign(err, { stdout, stderr })) : resolve({ stdout, stderr }),
    );
    child.stdin?.end(); // close stdin so pi exits instead of waiting for input
  });
const shell = promisify(exec);

const MODELS = {
  high: "opencode-go/deepseek-v4.1-flash:max",
  medium: "opencode-go/deepseek-v4.1-flash:high",
  low: "opencode-go/deepseek-v4.1-flash:low",
} as const;

const TIMEOUT_MS = 600_000;

const arg = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/** Run a self-contained task in a fresh pi session, or queue it via pueue when background=true. */
async function runPi(model: string, instructions: string, signal?: AbortSignal, background = false) {
  const args = ["--model", model, "-p", instructions];
  if (background) {
    // Inner tokens are quoted individually: pueue re-joins stored args, so the task's
    // shell must re-parse them correctly (`-p` must receive the full instruction).
    const line = ["pi", "--model", arg(model), "-p", arg(instructions), "<", "/dev/null"].join(" ");
    const { stdout, stderr } = await shell(`pueue add -i --print-task-id -- ${arg(line)}`);
    const taskId = stdout.trim();
    if (!taskId) throw new Error(`pueue add failed: ${stderr.trim() || stdout.trim()}`);
    return `Queued as pueue task ${taskId} (model: ${model}). Check with delegate_status(task_id=${taskId}).`;
  }
  try {
    return (await run("pi", args, { signal, timeout: TIMEOUT_MS })).stdout.trim() || "(no output)";
  } catch (err) {
    const e = err as { stderr?: string; killed?: boolean };
    if (e.killed) throw new Error(`delegation to ${model} aborted/timed out`);
    throw new Error(e.stderr?.trim() || String(e));
  }
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "delegate",
    label: "Delegate to Agent",
    description:
      "Run a self-contained task in a fresh sub-agent pi session (no shared context). Use for yak-shaving and work outside the current focus. background=true queues via pueue; poll results with delegate_status.",
    promptSnippet: "Delegate self-contained tasks to a sub-agent by difficulty",
    promptGuidelines: [
      "Use delegate to keep this session's context clean: research, code review, design checks, behavior verification, debugging outside the current focus.",
      "Use delegate(background=true) to run sub-agents in parallel, then read results with delegate_status.",
    ],
    parameters: Type.Object({
      difficulty: StringEnum(["high", "medium", "low"], {
        description:
          "Thinking effort for the sub-agent (same model, deeper reasoning as the level rises): high = max effort — design, deep troubleshooting, careful review; medium = standard — coding from an existing design; low = minimal — summarization, data extraction only.",
      }),
      instructions: Type.String({
        description:
          "Complete, self-contained task instructions (background, goal, expected output, what not to do — the sub-agent has no context).",
      }),
      skill: Type.Optional(
        Type.String({ description: "Optional skill name, loaded as '/skill:<name> <instructions>'." }),
      ),
      background: Type.Optional(Type.Boolean({ description: "Queue via pueue and return a task id immediately." })),
    }),
    async execute(_id, { difficulty, instructions, skill, background }, signal) {
      const text =
        skill && skill.trim()
          ? `/skill:${skill.trim()} ${instructions}`
          : instructions;
      return {
        content: [{ type: "text" as const, text: await runPi(MODELS[difficulty], text, signal, background) }],
        details: { model: MODELS[difficulty], background: !!background },
      };
    },
  });

  pi.registerTool({
    name: "delegate_status",
    label: "Delegated Task Status",
    description: "Fetch status and output of a task queued with delegate(background=true).",
    promptGuidelines: [
      "Use delegate_status to poll tasks queued by delegate(background=true); pass the returned task id.",
    ],
    parameters: Type.Object({
      taskId: Type.String({ description: "pueue task id returned by delegate(background=true)." }),
    }),
    async execute(_id, { taskId }, signal) {
      const { stdout } = await run("pueue", ["log", taskId], { signal, timeout: 30_000 });
      return { content: [{ type: "text" as const, text: stdout.trim() || "(no output yet)" }], details: { taskId } };
    },
  });
}

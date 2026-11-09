# AGENTS.md (User Scoped)

## Communication and Language

- User communication: Japanese (日本語)
- Documentation and code comments: Follow the existing language; never translate them without explicit instructions.

## Skills Guidelines

- AGENTS.md assumes progressive disclosure: it contains only the minimum information needed, while task-specific knowledge and guidelines live elsewhere.
- Select and load the necessary skills as needed for each task.

## Coding Style

- Maintain separation of concerns.
- Separate state from logic.
- Prioritize readability and maintainability.
- Follow t-wada-style TDD: implement while continuously verifying behavior with type checking and tests.
- Define contract layers (APIs/types) rigorously using ADTs, and keep implementation layers regenerable.
- Rules that can be checked statically should be expressed with the environment’s linter or ast-grep, not in prompts.

## Agent Delegation

- Delegate yak shaving and work outside the current focus to sub-agents using the `delegate` tool (from the `agent-delegate` extension) to keep context clean and preserve accuracy, speed, and cost efficiency.
  - Choose `difficulty` per task: `high` for abstract design/deep troubleshooting/careful review, `medium` for coding from an existing design, `low` (avoid by default) for summarizing or extracting data too voluminous for this session.
  - Sub-agents share no context: give self-contained `instructions` covering background, goal, expected output, and what not to do. Use `skill` when the task needs a specific skill.
  - Use `background=true` to run tasks in parallel via pueue, then fetch results with `delegate_status`.
  - Good example: When asked to implement something, delegate design, review, or behavior verification to other agents.
  - Bad example: When encountering a deep-rooted error, trying to solve it yourself without launching a debugging agent.

## Web Fetch

- Use the `web_fetch` tool (from the `jina-search` extension) to read public article/page content.
- For broader/deeper external web research, delegate research to a sub-agent with the `delegate` tool (see Agent Delegation), instructing it to use `web_search` and `web_fetch`.

## Research external/web

- Use the `web_search` tool (from the `jina-search` extension) for direct web search.
- Follow up on interesting hits with `web_fetch` to read the full page.

## Long-running Tasks and Development Servers

- Do not start long-running processes such as development servers, watchers, or daemons directly from the CLI; use **`pueue`** instead.
- Start them with `pueue add -- <command>`, and use `pueue status` / `pueue log` / `pueue follow` / `pueue kill` / `pueue remove` to check status or manage them.
- For parallel agent delegation, queue tasks via pueue:
  \`\`\`bash
  pueue add -i --print-task-id -- "pi ... -p '<instruction>' < /dev/null"
  \`\`\`
  \`\`\`bash
  pueue status
  pueue wait <task-id> # blocks when there is no other parallel work
  pueue log <task-id> # check results/status
  \`\`\`
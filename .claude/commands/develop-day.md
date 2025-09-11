---
title: Development Day Task Executor
description: Execute daily development tasks by reading PRD and task files, utilizing appropriate agents for each role
argument-hint: [task-file-path]
allowed-tools: Read, Glob, Bash, Edit, Write, Grep, MultiEdit
---

# Development Day Task Executor

Execute a structured development workflow that reads the project requirements document (PRD) first, then processes a specific task file, and delegates work to appropriate specialized agents.

## Parameters

- **task-file-path**: Path to the task file to execute (e.g., `docs/project-management/day_three_tasks.md`)

## Workflow

### Phase 1: Project Context Understanding
1. Read and thoroughly understand the ServiceBooking PRD: @ServiceBooking_PRD.md
2. Analyze the project structure, requirements, and technical specifications
3. Establish the foundational context for all development work

### Phase 2: Task Analysis and Planning
1. **Validate task file path**: Ensure the provided task file exists and is accessible
2. **Read task file**: Load the specific daily task file: @$1
3. **Analyze requirements**: Break down the tasks and identify required roles/agents
4. **Plan execution**: Determine the sequence of agent invocations needed

### Phase 3: Agent-Based Execution
1. **Navigate to root**: Ensure we're in the project root directory before each agent invocation
2. **Sequential execution**: Process each task using the appropriate specialized agent
3. **Wait for completion**: Allow each agent to fully complete their work before proceeding
4. **Validation**: Verify each task completion before moving to the next

## Execution Instructions

**CRITICAL REQUIREMENTS:**
- MUST use specialized agents for all development tasks
- Each role and team member has their own designated agent
- ALWAYS return to the root folder before invoking any agent
- Wait for complete agent execution before proceeding to the next task
- Follow the exact task sequence as specified in the task file

**Agent Usage Guidelines:**
- Use project-specific agents when available (`.claude/agents/`)
- Delegate appropriately based on task type (frontend, backend, testing, etc.)
- Ensure agents have proper context from both PRD and task requirements
- Monitor agent completion and validate outputs

**Error Handling:**
- If task file path is not provided: prompt user for the task file path
- If task file doesn't exist: list available task files in `docs/project-management/`
- If agent execution fails: report the error and suggest remediation steps

## Usage Examples

```
/develop-day docs/project-management/day_three_tasks.md
/develop-day docs/project-management/day_four_tasks.md
/develop-day day_five_tasks.md
```

---

**Processing Task File:** $1

First, I'll establish the project context by reading the PRD, then load and execute the specified task file using appropriate agents for each requirement.
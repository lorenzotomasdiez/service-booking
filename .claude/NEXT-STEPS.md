# 🚀 Next Steps After CCPM Setup

Run these commands in order:

## 1. Initialize Project Context (First Time Only)

```bash
/context:create
```

This will analyze your entire project and create context documentation.
**Takes 2-5 minutes. Required only once.**

## 2. Start Every Session With

```bash
/context:prime
```

This loads all project knowledge into Claude's memory.
**Required at the start of EVERY session.**

## 3. Check Project Status

```bash
/pm:status
```

See all active epics, open issues, and your tasks.

## 4. Get Your Next Task

```bash
/pm:next
```

AI-powered prioritization tells you what to work on.

## 5. Start Working

```bash
/pm:issue-start {issue-number}
```

OR create a new feature:

```bash
/pm:prd-new {feature-name}
```

---

## Quick Commands Cheat Sheet

| Command | Purpose |
|---------|---------|
| `/context:prime` | Load project context (EVERY SESSION) |
| `/pm:next` | Get next priority task |
| `/pm:status` | Project dashboard |
| `/pm:prd-new` | Create new feature |
| `/hema/bugfix-start` | Fix a bug |
| `/clear` | Clear context between features |

---

**For complete guide, read:** `CCPM-WORKFLOW-GUIDE.md`

**For setup overview, read:** `CCPM-SETUP-COMPLETE.md`

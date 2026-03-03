#!/bin/bash
set -eo pipefail

PROJECT_DIR="/mnt/e/Projects/chair-pulse"
PLAN_FILE="$PROJECT_DIR/.claude/current-plan.md"
LOG_DIR="$PROJECT_DIR/.claude/logs"
CHECK_CMD="bun run check"
FEATURE_NAME="Chair Pulse — salon booking analytics Electron app"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Defaults
START_CHUNK=1
CLEANUP_EVERY=0
SKIP_FINAL_CHECK=false

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --start) START_CHUNK="$2"; shift 2 ;;
    --cleanup-every) CLEANUP_EVERY="$2"; shift 2 ;;
    --skip-final-check) SKIP_FINAL_CHECK=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

mkdir -p "$LOG_DIR"

echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Plan Executor - $(basename "$PROJECT_DIR")${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

if [[ ! -f "$PLAN_FILE" ]]; then
  echo -e "${RED}✗ Plan file not found: $PLAN_FILE${NC}"
  echo "  Run /plan-checkpoint first to create a plan."
  exit 1
fi

# Strip CRLF from plan file reads (NTFS files have \r\n)
TOTAL_CHUNKS=$(grep -cE "^#{3,4} Chunk [0-9]+:" "$PLAN_FILE" | tr -d '\r' || echo "0")
echo -e "${GREEN}✓${NC} $TOTAL_CHUNKS chunks detected, starting from chunk $START_CHUNK"
echo -e "${GREEN}✓${NC} Feature: $FEATURE_NAME"
echo -e "${GREEN}✓${NC} Checks: $CHECK_CMD"
[[ "$CLEANUP_EVERY" -gt 0 ]] && echo -e "${GREEN}✓${NC} Cleanup every $CLEANUP_EVERY chunks"
echo ""

# ── Pre-read ALL chunks into arrays BEFORE any Claude invocations ───────────
# Critical: process substitution + while read shares stdin with subprocesses.
# Claude would consume remaining grep lines, killing the loop after chunk 1.
# Fix: drain the grep output fully first, store in arrays, then loop arrays.
declare -a CHUNK_NUMS=()
declare -a CHUNK_NAMES=()

while IFS= read -r line; do
  # Strip CRLF from NTFS, extract number from heading only (not "needs Chunk N" refs)
  line=$(printf '%s' "$line" | tr -d '\r')
  num=$(printf '%s' "$line" | sed -E 's/^#{3,4} Chunk ([0-9]+):.*/\1/')
  name=$(printf '%s' "$line" | sed -E 's/^#{3,4} Chunk [0-9]+: //' | sed 's/ (parallel-safe:.*//')
  if [[ -n "$num" ]]; then
    CHUNK_NUMS+=("$num")
    CHUNK_NAMES+=("$name")
  fi
done < <(grep -E "^#{3,4} Chunk [0-9]+:" "$PLAN_FILE")

echo -e "${GREEN}✓${NC} Chunks loaded: ${CHUNK_NUMS[*]}"
echo ""

# ── Context bridge — captures what previous chunk produced ──────────────────
PREV_CHUNK_CONTEXT=""

capture_context() {
  cd "$PROJECT_DIR"
  PREV_CHUNK_CONTEXT=$(git diff --stat HEAD 2>/dev/null || echo "(no git changes)")
}

# ── Write prompt to temp file — avoids all escaping issues with -p "$()" ────
write_chunk_prompt() {
  local num=$1
  local name=$2
  local context=$3
  local outfile=$4

  {
    echo "Continue work on chair-pulse at $PROJECT_DIR"
    echo ""
    echo "**Phase**: build (implementation)"
    echo "**Feature**: $FEATURE_NAME"
    echo "**Chunk**: $num of $TOTAL_CHUNKS — $name"

    if [[ -n "$context" && "$context" != "(no git changes)" ]]; then
      echo ""
      echo "**Previous chunk produced these changes** (for context, do NOT modify these files unless they're in YOUR scope):"
      echo '```'
      echo "$context"
      echo '```'
    fi

    echo ""
    echo "Read .claude/current-plan.md — find the Chunk $num section."
    echo ""
    echo "Instructions:"
    echo "1. Read .claude/current-plan.md and locate Chunk $num"
    echo "2. Read ALL existing files referenced in that chunk BEFORE writing anything (match patterns exactly)"
    echo "3. Implement exactly what Chunk $num describes — no more, no less"
    echo "4. Only modify files listed in that chunk's scope"
    echo "5. After implementing, run: $CHECK_CMD"
    echo "6. If checks fail, fix ALL errors before finishing"
    echo "7. Update CLAUDE.md phase line: Chunk $((num - 1))/$TOTAL_CHUNKS → Chunk $num/$TOTAL_CHUNKS"
    echo ""
    echo "Report what was implemented when done. Do NOT ask questions."
  } > "$outfile"
}

write_fix_prompt() {
  local errors=$1
  local outfile=$2

  {
    echo "Continue work on chair-pulse at $PROJECT_DIR"
    echo ""
    echo "**Phase**: fix (quality gate failed after chunk implementation)"
    echo "**Feature**: $FEATURE_NAME"
    echo ""
    echo "The quality checks failed after implementing the last chunk. Fix ALL errors below."
    echo ""
    echo "**Errors to fix:**"
    echo '```'
    echo "$errors"
    echo '```'
    echo ""
    echo "Instructions:"
    echo "1. Read each file mentioned in the errors"
    echo "2. Fix the errors — minimal changes, don't refactor or improve surrounding code"
    echo "3. Re-run: $CHECK_CMD"
    echo "4. If still failing, fix again. Loop until clean."
    echo "5. Auto-fix formatting first if applicable: bun run format"
    echo ""
    echo "Do NOT ask questions. Report what was fixed when done."
  } > "$outfile"
}

# ── Run a chunk ─────────────────────────────────────────────────────────────
run_chunk() {
  local num=$1
  local name=$2
  local log="$LOG_DIR/chunk-${num}.log"
  local prompt_file="$LOG_DIR/.prompt-chunk-${num}.txt"

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}▶ Chunk $num/$TOTAL_CHUNKS: $name${NC}"
  echo -e "  Log: $log"
  echo ""

  cd "$PROJECT_DIR"

  # Write prompt to temp file to avoid escaping issues
  write_chunk_prompt "$num" "$name" "$PREV_CHUNK_CONTEXT" "$prompt_file"

  # Verify prompt is not empty
  if [[ ! -s "$prompt_file" ]]; then
    echo -e "${RED}✗ Prompt generation failed for chunk $num — empty prompt file${NC}"
    exit 1
  fi

  local prompt_content
  prompt_content=$(cat "$prompt_file")

  if claude --dangerously-skip-permissions --max-turns 50 \
            -p "$prompt_content" \
            < /dev/null 2>&1 | tee "$log"; then
    echo -e "${GREEN}✓ Chunk $num implementation done${NC}"
  else
    echo -e "${RED}✗ Chunk $num failed — check $log${NC}"
    exit 1
  fi

  rm -f "$prompt_file"
  echo ""
}

# ── Quality gate — typecheck + lint between chunks ──────────────────────────
run_quality_gate() {
  local num=$1
  local gate_log="$LOG_DIR/gate-${num}.log"

  echo -e "${CYAN}  Running quality gate after chunk $num...${NC}"
  cd "$PROJECT_DIR"

  if eval "$CHECK_CMD" > "$gate_log" 2>&1; then
    echo -e "${GREEN}  ✓ Quality gate passed${NC}"
    return 0
  else
    echo -e "${YELLOW}  ⚠ Quality gate failed — spawning fix pass...${NC}"
    local errors
    errors=$(cat "$gate_log")
    local fix_log="$LOG_DIR/fix-${num}.log"
    local fix_prompt_file="$LOG_DIR/.prompt-fix-${num}.txt"

    write_fix_prompt "$errors" "$fix_prompt_file"
    local fix_prompt
    fix_prompt=$(cat "$fix_prompt_file")

    if claude --dangerously-skip-permissions --max-turns 20 \
              -p "$fix_prompt" \
              < /dev/null 2>&1 | tee "$fix_log"; then
      rm -f "$fix_prompt_file"
      # Re-check after fix
      if eval "$CHECK_CMD" > "$gate_log" 2>&1; then
        echo -e "${GREEN}  ✓ Fix pass succeeded — quality gate now passes${NC}"
        return 0
      else
        echo -e "${RED}  ✗ Fix pass ran but checks still failing — continuing anyway${NC}"
        echo -e "${RED}    Check $gate_log for remaining errors${NC}"
        return 1
      fi
    else
      rm -f "$fix_prompt_file"
      echo -e "${RED}  ✗ Fix pass failed — continuing anyway${NC}"
      return 1
    fi
  fi
}

# ── Cleanup pass ────────────────────────────────────────────────────────────
run_cleanup() {
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}▶ Running CLAUDE.md cleanup...${NC}"

  cd "$PROJECT_DIR"

  claude --dangerously-skip-permissions --max-turns 10 \
         -p "Run /setup-claude-md to clean up CLAUDE.md. Keep it minimal and accurate." \
         < /dev/null 2>&1 | tee "$LOG_DIR/cleanup.log"

  echo -e "${CYAN}✓ Cleanup done${NC}"
  echo ""
}

# ── Main loop — iterates over pre-loaded arrays, no stdin conflict ──────────
CHUNKS_SINCE_CLEANUP=0

for i in "${!CHUNK_NUMS[@]}"; do
  num="${CHUNK_NUMS[$i]}"
  name="${CHUNK_NAMES[$i]}"

  if [[ "$num" -lt "$START_CHUNK" ]]; then
    echo -e "${YELLOW}  Skipping chunk $num (--start=$START_CHUNK)${NC}"
    continue
  fi

  # Implement the chunk
  run_chunk "$num" "$name"

  # Quality gate — typecheck + lint, fix if needed
  run_quality_gate "$num"

  # Capture context for next chunk
  capture_context

  # Periodic cleanup
  CHUNKS_SINCE_CLEANUP=$((CHUNKS_SINCE_CLEANUP + 1))
  if [[ "$CLEANUP_EVERY" -gt 0 && "$CHUNKS_SINCE_CLEANUP" -ge "$CLEANUP_EVERY" ]]; then
    run_cleanup
    CHUNKS_SINCE_CLEANUP=0
  fi
done

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  All chunks complete!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""

if [[ "$SKIP_FINAL_CHECK" != "true" ]]; then
  echo -e "${BLUE}Running final quality checks...${NC}"
  cd "$PROJECT_DIR"
  if eval "$CHECK_CMD"; then
    echo -e "${GREEN}✓ All checks passed${NC}"
  else
    echo -e "${RED}✗ Checks failed — fix errors before committing${NC}"
    exit 1
  fi
fi

echo ""
echo -e "${GREEN}Done! Next steps:${NC}"
echo -e "  1. Review changes: git diff"
echo -e "  2. Commit: /commit"
echo -e "  3. Validate if needed: /quick-check, /validate-checkpoint, /wiring-checkpoint"

#!/usr/bin/env sh
set -u

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-4173}"
BASE_URL="http://${HOST}:${PORT}"
TMP_ROOT="${TMPDIR:-/tmp}/crosscrosscross-playwright-$$"
DESKTOP_LOG="${TMP_ROOT}/desktop.log"
MOBILE_LOG="${TMP_ROOT}/mobile.log"
SERVER_PID=""

server_is_up() {
  node -e "
    const http = require('http');
    const req = http.get(process.argv[1], res => {
      res.resume();
      process.exit(res.statusCode >= 200 && res.statusCode < 500 ? 0 : 1);
    });
    req.on('error', () => process.exit(1));
    req.setTimeout(1000, () => {
      req.destroy();
      process.exit(1);
    });
  " "$BASE_URL"
}

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP_ROOT"
}

mkdir -p "$TMP_ROOT"
trap cleanup EXIT INT TERM

if server_is_up; then
  echo "Reusing test server at ${BASE_URL}"
else
  echo "Starting test server at ${BASE_URL}"
  npx http-server . -a "$HOST" -p "$PORT" -c-1 --silent &
  SERVER_PID=$!

  attempts=0
  until server_is_up; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 60 ]; then
      echo "Timed out waiting for ${BASE_URL}" >&2
      exit 1
    fi
    if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
      echo "Test server exited before becoming ready." >&2
      exit 1
    fi
    sleep 1
  done
fi

run_playwright() {
  log_file="$1"
  report_dir="$2"
  output_dir="$3"
  shift 3

  PORT="$PORT" PLAYWRIGHT_NO_WEBSERVER=1 PLAYWRIGHT_HTML_REPORT="$report_dir" \
    npx playwright test "$@" --output="$output_dir" > "$log_file" 2>&1
}

echo "Running layout and mobile smoke tests in parallel..."

run_playwright "$DESKTOP_LOG" playwright-report/layout-desktop test-results/layout-desktop \
  tests/ui.desktop.spec.js --project=chromium-desktop &
DESKTOP_PID=$!

run_playwright "$MOBILE_LOG" playwright-report/mobile-smoke test-results/mobile-smoke \
  tests/ui.mobile.spec.js --project=chromium-mobile &
MOBILE_PID=$!

DESKTOP_STATUS=0
MOBILE_STATUS=0

wait "$DESKTOP_PID" || DESKTOP_STATUS=$?
wait "$MOBILE_PID" || MOBILE_STATUS=$?

cat "$DESKTOP_LOG"
cat "$MOBILE_LOG"

if [ "$DESKTOP_STATUS" -ne 0 ] || [ "$MOBILE_STATUS" -ne 0 ]; then
  exit 1
fi

VISUAL_LOG="${TMP_ROOT}/visual.log"

echo "Running visual and data tests serially..."
if run_playwright "$VISUAL_LOG" playwright-report/visual test-results/visual tests/ui.spec.js --workers=1; then
  cat "$VISUAL_LOG"
else
  cat "$VISUAL_LOG"
  exit 1
fi

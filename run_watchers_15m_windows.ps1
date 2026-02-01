# Runs ANETI + Tanitjobs watchers every 15 minutes.
# Requirements:
# - Chrome started with --remote-debugging-port=9223
# - Portproxy configured so WSL can reach http://172.25.192.1:9223
# - WSL distro has /home/wassim/clawd/job-scraper with venv and scripts

$ErrorActionPreference = 'Stop'

while ($true) {
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[$ts] running watchers"

  wsl -d Ubuntu -- bash -lc "cd /home/wassim/clawd/job-scraper && source .venv/bin/activate && python -m jobscraper.tanitjobs_watch --cdp http://172.25.192.1:9223 --state data/tanitjobs_state.json"
  wsl -d Ubuntu -- bash -lc "cd /home/wassim/clawd/job-scraper && source .venv/bin/activate && python -m jobscraper.aneti_watch --cdp http://172.25.192.1:9223 --state data/aneti_state.json"

  Start-Sleep -Seconds 900
}

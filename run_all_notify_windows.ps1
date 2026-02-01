# Run all sources once (Tier-1 + Tier-2 sources) and send ntfy alerts for any relevant_new > 0.
# Note: Tanitjobs and ANETI require Chrome CDP session reachable from WSL.

$ErrorActionPreference = 'Stop'

$cmd = "cd /home/wassim/clawd/job-scraper && source .venv/bin/activate && python -m jobscraper.run --once --notify --sheet-id 1gtpv560HIrba8uLwqsKmFFuV3N_14RoPQrk_BBcn9lg"

# Tier-1 sources
wsl -d Ubuntu -- bash -lc "$cmd --source keejob"
wsl -d Ubuntu -- bash -lc "$cmd --source welcometothejungle"
wsl -d Ubuntu -- bash -lc "$cmd --source weworkremotely"
wsl -d Ubuntu -- bash -lc "$cmd --source remoteok"
wsl -d Ubuntu -- bash -lc "$cmd --source remotive"

# Tier-2 (CDP) sources
wsl -d Ubuntu -- bash -lc "$cmd --source tanitjobs"
wsl -d Ubuntu -- bash -lc "$cmd --source aneti"

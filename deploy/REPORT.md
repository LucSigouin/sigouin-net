# Deploy lane report

Status: done. The deploy tooling is ready.

Planned files:

- `promote.sh` for a dry-run-first promotion into the site root.
- `deploy.sh` for an explicitly confirmed Cloudflare Pages deploy.
- `verify-live.sh` for repeated live hash checks and CSP checking.
- `README.md` for the owner workflow.

Checks run:

- `bash -n` passed for all three scripts.
- `promote.sh` dry run passed against a temporary fixture and made no target files.
- `verify-live.sh` ran against a temporary `python3 -m http.server`; local hashes were reported and the expected CSP mismatch was reported because that server does not add Cloudflare headers.
- `python3 ../check-deploy.py .` passed.

The project has not been deployed, created, or pushed. Live verification is unverified until the owner deploys the site.

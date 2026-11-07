# Cadrotsentry: honest status and next steps

## What this repository is

A workflow simulator. Five predefined scenarios demonstrate policy checks, changed-evidence warnings, demo review and single-use approval. This does not verify real receivers, authenticate reviewers, sign transactions or protect funds. The optional server-side NEAR AI adapter generates advisory proposals and requires credentials. It has not been tested with a replacement API key.

Agent security and spending controls already exist (for example OutLayer); payment-agent attack testing also exists (Clearance). No first-invention or unique-category claim is made. Proposed focus: compare current receiver evidence with approved conditions and invalidate outdated approvals.

## Run locally (Windows PowerShell)

```powershell
git clone https://github.com/khyuannn/cardrotsentry-secu.git
cd cardrotsentry-secu
npm test
npm run dev
```

Install Node 22+ first. Open http://localhost:3000. No npm dependencies are required. Ctrl+C stops the server.

## 1. Configure live NEAR AI

Revoke the screenshot-exposed key. Generate a replacement in the issuing dashboard and choose an exact model API ID from the current catalog.

```powershell
Copy-Item .env.example .env
code .env
```

Set NEAR_AI_API_KEY and NEAR_AI_MODEL locally, then restart `npm run dev`. Open NEAR AI lab and send one short offer. Verify usage and a structured proposal; authorizationIssued must remain false. Never commit `.env`. Hosted secrets require separate hosting configuration and redeployment; your local file does not configure the hosted demo.

The adapter caps input and output, but does not implement a durable billing cap/rate limiter. Check current model pricing/capabilities, keep access private and monitor credit use. Verify the selected model accepts max_tokens or change to its documented bounded-output parameter. Credits pay for inference, not testnet gas.

## 2. Build the first meaningful live milestone

Replace scenario selection with a user-entered testnet receiver and amount, attached to a separately stored owner intent. Add server adapters for NEAR RPC account/contract information and NearBlocks testnet history/deployments. Verify current provider endpoints/authentication. Save source, time, block reference, completeness and errors. Never fabricate account age: unknown remains unknown; first-seen activity is not creation time.

Display why each decision was reached. Contract presence or a new account alone must not be called a scam. Missing required data should pause execution for review. Store two actual evidence snapshots to demonstrate a controlled contract/destination change. Keep fixtures separately labeled.

Acceptance: entering two actual testnet receivers produces evidence-backed results, and provider failure cannot silently allow a payment.

## 3. Connect AI proposals to inspection

Validate and store an AI proposal on the server under a trusted owner intent. Load its ID in the inspection screen. Do not let the model rewrite the owner's supplier/budget. AI explanations cannot authorize payment. Current lab and seeded inspection scenarios are separate.

## 4. Add real review and persistence

Move policy, evidence, approval issuance, expiry, used IDs, budgets and history from browser state to a server/database. Use SQLite locally or durable hosted storage. Authenticate reviewers using a verified wallet challenge or supported host identity. Authenticate reports and review allegations before deny-list activation. Enforce owner/agent access server-side. Protect cookie-based review against CSRF.

Acceptance: editing localStorage cannot authorize payment; unauthorized review fails; state survives restart; changed receiver/amount/evidence invalidates approval.

## 5. Implement and test a NEAR vault

Build a Rust/near-sdk prefunded native-NEAR vault. The separate policy service signs canonical authorizations bound to network, vault, agent, receiver, amount, method, policy/evidence version, nonce and expiry. Agent cannot access this signing key. The vault verifies signatures, caller authorization, limits, expiry and single use; handle asynchronous transfer failures and correct accounting.

Implement a contract-enforced epoch/revocation scheme if evidence changes must invalidate already issued permits; short expiry alone is not immediate revocation. Document the interval before revocation finalizes. Do not claim an offchain check atomically pins external code at execution.

Acceptance: contract tests cover missing/altered signatures, wrong caller, amount mutation, expiry, replay, budget exceedance, direct bypass and failed-transfer accounting.

## 6. Deploy to testnet and restrict the agent key

Create separate owner, agent, vault and supplier testnet accounts using current official wallet/CLI instructions. Obtain test tokens. Owner deploys/funds the vault. The agent receives only a function-call key restricted to the vault and explicit payment method, with finite gas allowance and zero attached deposit. Verify permissions through RPC.

Function-call keys cannot directly transfer native NEAR or attach it to calls. Their allowance pays gas, not purchases. The vault pays from its own prefunded balance. Keep owner recovery/setup keys outside the agent process.

## 7. Prove enforcement and prepare submission

Run one actual successful testnet transfer, one changed-trust review, one known-bad proposal refused before signing, and a direct-vault bypass/replay rejection. Save real sanitized logs and transaction/receipt references. If the live model refuses an injection, show it honestly; separately replay a compromised proposal to exercise the boundary.

Measure outcomes, false warnings, latency and AI cost. Add setup, architecture, key limits, threat assumptions and remaining gaps. Disclose reused components and AI assistance under current event rules. Public source is not the same as a publicly accessible demo: the hosted demo currently requires owner access.

Current security prompt expects receiver checks, scoped signing key, enforcing wrapper and attack log. This simulator does not yet satisfy those onchain requirements. A completed tested prototype may be submitted subject to organizer eligibility; acceptance is not guaranteed. Check current rules/form and supply the required public repository and X demo post. Do not apply unrelated historical event rules.

## Demo today

Say: “This is a workflow prototype showing how decisions would be reviewed and enforced.” Show normal → changed destination → stale approval rejected → fresh review → recorded blocked attack. Explicitly state that evidence/payments and reviewer identity are simulated. Do not pitch it as a finished security service.

## Official references

- https://nearhackathon.com/
- https://docs.near.ai/cloud/quickstart
- https://docs.near.ai/cloud/models
- https://docs.near.org/protocol/accounts-contracts/access-keys
- https://docs.near.org/api/rpc/contracts
- https://api-testnet.nearblocks.io/api-docs
- https://github.com/nearai/near-hackathon-prompt-examples/blob/main/tracks/06-security.md

# What only you can do — exact steps, in order

Everything that could be done from inside the repository is done (see [HANDOFF.md](../HANDOFF.md)). What is left needs a person, an account, money or a physical machine. Do the steps in this order; each one says what to do, what "done" looks like, and what to send back so the code side can follow.

Where I describe third-party programmes (SignPath, Azure, certificate authorities), those are my understanding as of 2026-10-13 and their terms change: **read their current pages before you pay or apply.**

---

## Step 1 — Protect the account that builds your releases (10 minutes)
Every release is built by GitHub Actions from the `shipking-ai` account, so that account is the weakest link.
1. GitHub → your avatar → **Settings → Password and authentication**.
2. Turn on **two-factor authentication**, preferably a **passkey** or hardware key, and save the recovery codes somewhere offline.
3. **Settings → Sessions**: sign out anything you do not recognise.
Done when: 2FA shows "Enabled". (Already done for you on the repository: branch protection on `main`, secret scanning with push protection, Dependabot alerts and security updates, release tags `v*` cannot be moved or deleted, private vulnerability reporting.)

## Step 2 — The name (decided: keep Pelorus; one optional follow-up)
**Decision recorded 2026-10-13: keep Pelorus.** The only thing left is optional but wise before a wide launch: an attorney opinion (option A below). Skip the rest of this step until then.

(Original options, for reference:)
Read [TRADEMARK.md](TRADEMARK.md). Short version: the old name Nadir was not clear; Pelorus has no live US mark in software classes 009/042 but live marks in other fields, and nothing outside the US was searched.
1. Choose one:
   - **A. Get a professional opinion (recommended before any wide launch).** Find a trademark attorney (many offer a fixed-fee clearance search). Send them `docs/TRADEMARK.md` and ask: "Is *Pelorus* for a downloadable web browser (class 9) and related software services (class 42) at risk of conflict in the US and in <the countries you will ship to>?"
   - **B. Rename now** while there are only three pre-releases. Tell me the new name; I have already done one scripted rename (everything including the repository and releases notices).
   - **C. Proceed at your own risk.** Fine for a hobby project with no launch; not for a product you promote.
2. Only after an opinion, if you want to register the mark: file with the USPTO yourself or through the attorney (check the current fee schedule at uspto.gov; fees are per class).
Done when: you can write one line in `docs/TRADEMARK.md` saying which option you chose.

## Step 3 — Code signing: apply to SignPath Foundation (free) — decision made 2026-10-13
You chose "whatever is free and best". For Windows the only free route is **SignPath Foundation**, and everything needed is prepared in [SIGNPATH-APPLICATION.md](SIGNPATH-APPLICATION.md) (field-by-field answers, the requirements check, and one question to ask them).

**Be realistic:** SignPath says it signs only projects with a "verifiable reputation", and Pelorus is days old, so they may say "come back later". Applying is free and takes about 10 minutes, so do it anyway.

1. Open <https://signpath.org/apply>.
2. Paste the answers from the table in [SIGNPATH-APPLICATION.md](SIGNPATH-APPLICATION.md) into each field. Use the **honest** reputation text; do not exaggerate.
3. Use your real name and an email you check (they reply there). Read the Code of Conduct (linked on the form), then tick the required boxes and solve the reCAPTCHA yourself, then **Submit**.
4. Email <support@signpath.io> (or reply to their response) with the one question in SIGNPATH-APPLICATION.md: whether `Pelorus.exe` (re-branded Electron) may be signed or only the installer.
5. Wait for their answer.
   - **Approved:** create your SignPath account (turn on multi-factor authentication there), then tell me the *organisation ID* and *project slug*. Store the API token as a GitHub secret yourself (Settings → Secrets and variables → Actions → New repository secret, name `SIGNPATH_API_TOKEN`); never paste it anywhere else. I then do the workflow and documentation changes listed at the bottom of SIGNPATH-APPLICATION.md and cut a signed release. You will approve each signing request in SignPath's dashboard.
   - **Declined or "later":** tell me. Options, in order: build a genuine track record and reapply; or the paid route (Azure's signing service or a commercial certificate with cloud signing: check current price and eligibility); or stay unsigned and rely on checksums and the provenance attestation.

After signing works, confirm on a clean Windows machine: right-click the installer → Properties → Digital Signatures, or `Get-AuthenticodeSignature .\Pelorus-Setup-<version>.exe | Format-List` shows `Status : Valid`. SmartScreen may still warn for a while: reputation builds with downloads.

## Step 3b — The website address: JS.ORG said no; what to do instead
**What happened:** the JS.ORG request (pull request js-org/js.org#12795, opened with your approval) was declined on 2026-10-18: *"the site is clearly primarily for your desktop browser, and that does not relate specifically to JavaScript developers."* I rolled the site back, so **https://shipking-ai.github.io/pelorus/ works again** (HTTPS, free). Nothing is broken. The PR page may stay open until a maintainer closes it; you do not need to do anything.

**Your options (pick one; none is urgent):**
1. **Keep the github.io address.** Zero work. Recommended while the project is a pre-release.
2. **Try is-a.dev (`pelorus.is-a.dev`), free.** It is the best remaining free option, with two catches: they ask that requests are **not written by AI**, so *you* must write and submit the pull request yourself, and they only accept software-development-related, non-commercial projects (a browser plus a developer toolbox is a judgement call; approval is not assured). Steps:
   1. Read <https://docs.is-a.dev/quickstart/> and <https://is-a.dev/terms> yourself.
   2. Fork <https://github.com/is-a-dev/register> (the Fork button), open your fork, go to the `domains` folder → *Add file → Create new file*, name it `pelorus.json`, and put exactly this (an `email` field is optional):
      ```json
      {
          "owner": { "username": "shipking-ai" },
          "records": { "CNAME": "shipking-ai.github.io" }
      }
      ```
   3. Commit it to your fork, then click **Contribute → Open pull request** to `is-a-dev/register`. **Keep their pull request template** (do not replace it), tick the Terms-of-Service box yourself, paste the link `https://shipking-ai.github.io/pelorus/`, attach a **screenshot** of the site (a screenshot of the home page, or `docs/screenshots/window-dark.png` for the app), and describe the project in your own words (what it is, that it is open source and non-commercial, and why it is software-development related).
   4. Wait for review and answer any questions. **Only after it is merged:** tell me, and I will set the repository variables `SITE_BASE=https://pelorus.is-a.dev/` and `SITE_CNAME=pelorus.is-a.dev`, re-run the website deploy, and turn on Enforce HTTPS. (If you do it before the merge, the github.io address will redirect to a name that does not exist yet.)
3. **Buy a domain** (any registrar; a normal `.com` or `.org` has a modest yearly fee). No eligibility rules. Follow GitHub's instructions to point the domain at `shipking-ai.github.io`, then tell me the domain and I will set the variables and the `CNAME` file.
4. **Make the Toolbox a standalone JavaScript directory** and ask JS.ORG again. Their stated rule is that the site's *primary* subject must be the JavaScript ecosystem. That means splitting the Toolbox into its own site, limited to JavaScript/TypeScript tools, with the browser reduced to a link. It is a real product decision (and may still be declined), so only do it if you want that second site for its own sake.

## Step 4 — Tests that need a human or a physical machine
Do these when you can; send me the results and I will record them in the docs.

### 4a. Screen reader test (cannot be done by automation)
1. Install **NVDA** (free) from <https://www.nvaccess.org/download/>. Run it.
2. Install Pelorus (from the latest release) or run `npm start`.
3. Work through the 11 tasks in [ACCESSIBILITY.md](ACCESSIBILITY.md), once in dark and once in light theme (Settings).
4. Write down for each task: pass/fail and what was announced. Open one GitHub issue per failure with the label `accessibility` (create the label if needed).
5. Repeat quickly with **Narrator** (Windows key + Ctrl + Enter).
Done when: you can tell me "NVDA <version>: N of 11 pass" and the failures are issues.

### 4b. Clean-machine install test
1. Windows 11 Pro: **Settings → System → Optional features → More Windows features → Windows Sandbox** (needs a restart). Open **Windows Sandbox** (a fresh disposable Windows).
2. Inside it, open Edge, download `Pelorus-Setup-<version>.exe` from the Releases page, and run it. Expect a SmartScreen warning while unsigned: choose **More info → Run anyway** only because you built and verified this file.
3. Check: it installs without asking for administrator rights, starts, you can browse a site, **Check for updates** works, uninstall (Settings → Apps) leaves nothing important behind.
Done when: you can say "clean install and uninstall OK" or list what broke.

### 4c. A real macOS and a real Linux machine
The CI results are encouraging, but nobody has used it by hand there.
1. `git clone https://github.com/shipking-ai/pelorus.git && cd pelorus && npm ci && npm start`.
2. Browse for ten minutes: open tabs, switch workspaces, open the command palette, find in page, download a file.
3. `npm test` and `npm run test:e2e` (Linux needs `xvfb-run -a` in front, and `chrome-sandbox` permissions as in `.github/workflows/ci.yml`).
4. Send me anything odd: crashes, visual glitches, things that do not exit when you quit (macOS: Cmd+Q).

### 4d. A trustworthy benchmark
The recorded numbers came from a busy machine and only two runs.
1. Close everything else, plug in power, disable sleep.
2. Install Google Chrome, then in the repo: `npm ci` and `node scripts/bench.js --tabs 10 --runs 5`.
3. Run it three times at different times of day. Send me the three `docs/benchmarks/results-*.json` files.

## Step 5 — An independent security review
Automated tests and my fuzzing are not a review.
1. Pick a reviewer who knows Electron/Chromium security (a security firm or a freelance reviewer; ask for a written report and a fixed scope).
2. Give them: the repository link, [SECURITY.md](SECURITY.md) (threat model T1–T13 and known gaps), [ARCHITECTURE.md](ARCHITECTURE.md), and the list of things you want looked at first: the `pelorus://` protocol handler, every IPC channel in `src/main/ipc.js`, the permission broker, download handling, the HTTPS-first/blocker request handler, the update check.
3. Ask them to report privately through the repository's **private vulnerability reporting** (Security tab → Report a vulnerability) so fixes can be coordinated.
4. When fixes land, publish a short summary in the release notes. Until then, keep every document's "not audited" wording.

## Step 6 — Decisions only you can make (details in [HANDOFF.md](../HANDOFF.md) section 10)
1. Who the publisher/maintainer of record is, and whether anyone else gets commit or release rights (the signing policy lists roles; today you hold all of them).
2. Extensions: build a native module API, or invest in Chrome-extension compatibility (changes the whole roadmap).
3. Engine strategy: stay on Electron (cheap, trails upstream Chromium) or move to a Chromium fork (best security cadence, very expensive).
4. Auto-update: only after signing exists; then ask me to design signed update payloads.

## When you have done a step
Tell me the result in one line (for example "NVDA 2025.x: 9 of 11 pass, issues #4 and #5", or "chose SignPath, approved, org id X, token stored as secret SIGNPATH_API_TOKEN"). I will update the code, workflows and documents to match and re-run everything.

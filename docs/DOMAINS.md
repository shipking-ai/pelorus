# Free domains and subdomains for the Pelorus site: what exists, what is safe, what "forever" means

Researched 2026-10-18 after JS.ORG declined `pelorus.js.org` (see [WEBSITE.md](WEBSITE.md)). Everything below was read from the services' own pages, repositories and live DNS/HTTP responses on that date; where a page did not say something, this file says "not stated" rather than guessing. Free services change their terms, so re-read the linked pages before you apply.

## The honest answer on "for ever"
**No free domain or subdomain is guaranteed forever.** Every free option below is a favour that the operator can withdraw (abuse clean-ups, a maintainer quitting, a platform shutting down: Deno Deploy Classic, for example, stopped serving on 2026-07-20, which its own error page says). The only things that last as long as you keep them are (a) a domain you register and renew yourself, and (b) an address on a platform that has already lasted: `*.github.io` is the safest free one because the site and the code live on the same account.

## Recommendation (in order)
1. **Keep <https://shipking-ai.github.io/pelorus/> for now.** Free, HTTPS, nothing to apply for, and it is on the Public Suffix List (browsers isolate its cookies per account).
2. **If you want a short root address without a path: Cloudflare Pages (`pelorus.pages.dev`).** Free plan, 100 projects, 500 builds a month, 20,000 files and 25 MiB per file per site (Cloudflare's published limits, read today). `pelorus.pages.dev` answered with an empty 404 (not a live site) while a project name that is taken answers with a page, so the name looks unclaimed, but **names are only really claimed by creating the project**, which needs a Cloudflare account that you must create yourself. `pages.dev` is on the Public Suffix List.
3. **A vanity name from a registry, written and submitted by you:** `pelorus.is-a.dev` (steps in [OWNER-STEPS.md](OWNER-STEPS.md) step 3b). Free, on the Public Suffix List, active. It is not a "forever" promise; their README names no expiry rule and says nothing about permanence, and it asks that requests are not AI-written. A browser project may be judged outside "software development related", so it can be declined like JS.ORG did.
4. **The slow, long-established route: `pelorus.eu.org`.** eu.org is free subdomains for individuals and non-profits and is on the Public Suffix List. Its site presents the request through a web form; it gives only name-server delegation (you need a DNS host such as Cloudflare's free DNS) and **its HTTPS certificate was expired when I fetched it on 2026-10-18**, so I could not read the current rules or waiting time. Treat it as promising but unverified; read it in your own browser first.
5. **Buy a domain** if "forever" matters more than "free": the one guarantee is that it is yours while you renew it. Any registrar; compare current prices yourself (I did not check any). Use the `SITE_CNAME`/`SITE_BASE` variables ([WEBSITE.md](WEBSITE.md)).

## Everything checked

| Option | Free? | What I verified | Verdict |
|---|---|---|---|
| `github.io` (current) | yes | live, HTTPS, PSL-listed | **Use now** |
| Cloudflare `pages.dev` | yes | published free limits above; PSL-listed; `pelorus` not visibly taken | **Good if you want a clean root URL** (needs your account) |
| `is-a.dev` | yes | README: personal/dev sites, "do not use AI", no permanence statement; PSL-listed; `pelorus.is-a.dev` redirects to its "available" page, i.e. not taken | **Worth a personal try** |
| `eu.org` | yes | summary page: free for individuals and non-profits; expired certificate; PSL-listed; `pelorus.eu.org` does not resolve | **Unverified, patient** |
| DigitalPlat FreeDomain (`dpdns.org`, `us.kg`, `qzz.io`, `xx.kg`, `qd.je`) | yes | FAQ: **1 domain per account**, changed "because of rising domain abuse"; needs external name servers; the tutorial lists a "Check Status and Renew" chapter, so **it is not stated to be forever**; abuse-report address published; PSL-listed | **Not recommended for a browser people download from**: shared free suffixes attract abuse, and a security-minded project should not share a reputation with it. Also not forever |
| `thedev.id` | yes | GitHub-Pages CNAME via pull request; README links rules that I could not read; **not on the Public Suffix List** | Skip unless the rules are read first |
| `is-a.software` | yes | new hosted platform (Java/Spring, MySQL); 1.9k open issues; only collaborators may file issues; no rules stated; not PSL-listed | Skip |
| DuckDNS (`pelorus.duckdns.org`) | yes | the name does not resolve (free) but the service maps names to IP addresses, not CNAMEs, and says abusive use may be blocked | Wrong tool for a static site |
| `js.org` | yes | declined (policy: primary subject must be JavaScript) | Closed |
| `js.cool`, `runs-on.dev` | | `pelorus.js.cool` answers with an error (522); `pelorus.runs-on.dev` is a live site. Neither is PSL-listed. Not evaluated | Skip |
| `neocities.org`, `web.app` (Firebase), `srht.site`, `codeberg.page`, `bearblog.dev`, `itch.io` | yes | `pelorus` is free on each (not-found pages); not suited to this project's GitHub-built site without moving hosting | Possible, no advantage over `pages.dev` |
| `vercel.app`, `netlify.app`, `onrender.com`, `surge.sh`, `gitlab.io` | yes | **`pelorus` is already taken** on each (by other projects; on `gitlab.io` by a GitLab group) | Unavailable |

## A side finding about the name
Other live projects already use "Pelorus" for unrelated products on `vercel.app` (a navigation/direction tool), `netlify.app` (scam protection for older adults) and `onrender.com`, and there is a GitHub organisation called `pelorus`. That is not a legal finding, but it adds weight to the advice in [TRADEMARK.md](TRADEMARK.md) to get an attorney's opinion before a wide launch.

## Why the Public Suffix List column matters
A subdomain of a suffix that is **not** on the PSL shares cookies and reputation with every other subdomain of it. `thedev.id`, `is-a.software`, `js.cool`, `runs-on.dev` and `neocities.org` were not on the list when I checked (list downloaded 2026-10-18 from publicsuffix.org; every other row above was found there).

## What I did not do
I did not create any account, submit any request or register anything. Creating accounts and submitting registrations are yours to do ([OWNER-STEPS.md](OWNER-STEPS.md)); and requests to `is-a.dev` must not be AI-written.

---
title: "I Ran Hermes Agent on the Same Task for 7 Days. The Skill File on Day 7 Looked Nothing Like Day 1."
url: "https://dev.to/sreejit_/i-ran-hermes-agent-on-the-same-task-for-7-days-the-skill-file-on-day-7-looked-nothing-like-day-1-2oa8"
type: "article"
author: "@"
---

Hermes Agent Challenge Submission

*This is a submission for the [Hermes Agent Challenge](https://dev.to/challenges/hermes-agent-2026-05-15)*

* * *

> **TL;DR:** Hermes Agent is the only open-source agent that gets better at *your specific work* without you touching anything. I ran it on the same task every day for 7 days and watched the skill file evolve from a 12-line rough draft to a 60-line intelligent procedure. Here's every step, every output, and why this changes what I think an AI agent should be.

* * *

Every AI agent framework you've used starts from zero.

LangChain, AutoGen, CrewAI — they all do real work. Multi-step planning, tool use, parallelism. But you close the terminal, restart the session, and the agent that spent twenty minutes figuring out exactly how to handle your data structure has forgotten all of it. You're back to square one.

We've been so focused on what agents can *do* that nobody's asking what they *keep*.

That's the question Hermes Agent is actually answering. And after running it daily for a week, I can tell you: the difference between Day 1 and Day 7 isn't marginal. It's a different agent.

* * *

## The Setup

I run a web app that deals with a lot of research — new models, framework updates, open-source releases. Every morning I was manually scanning HackerNews, arXiv, and GitHub to find the 3-4 things that actually mattered. 30-40 minutes. Boring, repetitive, and I kept missing things because I can only read so fast.

That's the perfect task for this experiment: give Hermes the same job every day, watch what it learns, and see whether Day 7 is actually better than Day 1.

**My hardware:** Windows 11, GTX 1650 (4GB VRAM), 16GB RAM — same machine from my Gemma 4 tests.

**My setup:**  

```
# Install (Linux/macOS/WSL2 — I used WSL2)
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Launch
hermes
```

That's it. No YAML. No environment variables. No dependency hell. The installer asks you for a model provider — I pointed it at OpenRouter with a Nous Hermes model. First prompt came back in under 10 seconds.

**The task I gave it:**  

```
Every morning at 8AM, find the 3 most relevant AI and developer 
news items from the past 24 hours. I care about open-source models, 
agent frameworks, and local inference. Skip anything that's just hype 
with no technical substance. Post the results to my Telegram.
```

One instruction. Then I walked away.

* * *

## Day 1: Raw and Messy

The first run came back with 6 items. Two were from TechCrunch articles with zero technical depth — the kind of "AI is changing everything" pieces that don't tell you anything. One was a GitHub release that was three weeks old. One was actually good: a new quantization method for running LLMs on consumer hardware.

The Telegram message was long, unformatted, no clear hierarchy. The summaries were one-sentence restatements of the headline, not actual analysis.

Here's what the skill file looked like after Day 1:  

```
# skill: daily_ai_digest
version: 1.0
created: 2026-05-09

## task
Search for AI and developer news. Summarize and post to Telegram.

## steps
1. Search "AI news today"
2. Search "developer tools news"
3. Collect top results
4. Write summary
5. Post to Telegram

## tools_used
- web_search
- telegram_send

## notes
First run. Results were broad. User wants 3 items.
```

Twelve lines. Basically a placeholder. But it exists — and that matters, because this is what Hermes builds on.

* * *

## Day 2: First Sign of Learning

I didn't touch anything.

Day 2 came back with 5 items. The TechCrunch pieces were gone. Hermes had started pulling from Hacker News and GitHub Releases — better signal sources. One item was still irrelevant (a VentureBeat funding round that mentioned AI in the headline), but the other four were legitimately useful.

The summaries were longer. They had context, not just restatements. One of them noted that a specific library update was a breaking change — information that wasn't in the headline but was in the release notes. Hermes had gone deeper.

The Telegram format was cleaner. Numbered list. Each item had a title, a one-sentence summary, and a link.

Skill file, end of Day 2:  

```
# skill: daily_ai_digest
version: 1.2
created: 2026-05-09
last_improved: 2026-05-10

## task
Find and deliver 3 relevant AI/dev news items. 
User wants technical depth, not hype.

## search_strategy
queries:
  - "AI developer tools release site:github.com"
  - "open source LLM 2026"
  - "AI news site:news.ycombinator.com"
source_deprioritize: [techcrunch.com, venturebeat.com]

## steps
1. Run search queries
2. Score results by technical depth
3. Select top 3
4. Format as numbered list with title + summary + link
5. Post to Telegram

## tools_used
- web_search
- telegram_send

## notes
v1.2: Added source filtering after first run returned low-quality sources.
Switched to HN and GitHub as primary. Results improved.
```

It added source filtering on its own. I did not tell it TechCrunch was bad. It inferred it from the task description — "no hype, technical substance" — and encoded that into the skill.

* * *

## Day 4: It Built a Scoring Rubric

This is the day I started paying attention.

The Day 4 Telegram message had something new: a score on each item. `[7/10]` `[9/10]` `[6/10]`. I hadn't asked for scores. Hermes decided scores were useful for the task — probably because "top 3 most relevant" implies there's a ranking, and making that ranking explicit makes the output more useful.

The 9/10 item was genuinely the best thing from that day — a benchmark paper comparing local inference speeds across different quantization methods. Exactly what I care about. The 6/10 item was a borderline include — a framework update that was interesting but not breaking news.

Skill file, end of Day 4:  

```
# skill: daily_ai_digest
version: 1.4
created: 2026-05-09
last_improved: 2026-05-12

## task
Find, score, and deliver 3 AI/dev news items.
Filter: open-source models, agent frameworks, local inference.
Exclude hype with no technical depth.

## search_strategy
queries:
  - "open source LLM release site:github.com OR huggingface.co"
  - "agentic AI framework update -ChatGPT -Gemini"
  - "local inference benchmark 2026"
  - "AI developer tools release this week"
source_priority: [arxiv.org, github.com, huggingface.co, news.ycombinator.com]
source_deprioritize: [techcrunch.com, venturebeat.com, medium.com]

## scoring_rubric
score each item 0-10:
  technical_depth: 0-4  (has code/benchmarks/architecture details)
  novelty: 0-3          (not covered in previous runs)
  relevance: 0-3        (matches user focus: OSS/local inference)
threshold: include if score >= 6

## output_format
**[Score: X/10]** Title
> One sentence: what it is and why it matters.
Link

## tools_used
- web_search
- telegram_send

## notes
v1.2: Added source filtering.
v1.4: Added scoring rubric. User task implies ranking — made it explicit.
      Added novelty check to avoid repeating items from prior runs.
```

Three things happened autonomously between Day 2 and Day 4:

1.  It built a formal scoring rubric with sub-dimensions
2.  It added negative query filters (`-ChatGPT -Gemini`) to reduce noise
3.  It started checking previous runs for novelty — so it wouldn't resurface the same items

I didn't write a single line of prompt engineering.

* * *

## Day 7: The Skill That Won

By Day 7, the digest was good enough that I was reading it before my coffee instead of after my manual scan. That's the bar — useful enough to change behavior.

Here's the full Day 7 skill file:  

```
# skill: daily_ai_digest
version: 1.7
created: 2026-05-09
last_improved: 2026-05-15

## task
Find, score, and deliver the 3 most relevant AI/developer news items 
for the day. Focus: open-source models, agent frameworks, local inference.
Exclude hype with no technical depth. Deliver to Telegram at 08:00 IST.

## search_strategy
queries:
  - "open source LLM release site:github.com OR huggingface.co"
  - "agentic AI framework update -ChatGPT -Gemini -GPT"
  - "local inference benchmark OR quantization 2026"
  - "AI developer tools release this week site:news.ycombinator.com"
  - "arxiv LLM agent reasoning 2026"
source_priority: [arxiv.org, github.com, huggingface.co, news.ycombinator.com]
source_deprioritize: [techcrunch.com, venturebeat.com, medium.com, forbes.com]
dedup_window: 7d  # skip items covered in the last 7 days

## scoring_rubric
score each item 0-10:
  technical_depth: 0-4
    4 = has code, benchmarks, or architecture details
    2 = has methodology but no reproducible artifacts  
    0 = opinion/news with no technical content
  novelty: 0-3
    3 = not covered in past 7 days
    1 = follow-up to prior story, adds new info
    0 = repeat
  relevance: 0-3
    3 = directly about OSS models, agents, or local inference
    2 = adjacent (cloud AI but with OSS implications)
    0 = enterprise SaaS, no OSS angle
threshold: score >= 6 to include
fallback: if < 3 items qualify, lower threshold to 5

## output_format
**[Score: X/10]** Title
> Summary: what it is. Why it matters for open-source/local AI specifically.
🔗 [Link](url)

## delivery
platform: telegram
timing: 08:00 IST
max_items: 3
failure_alert: if run fails, send "digest failed: {error}" to Telegram

## improvement_log
v1.0: Broad search. Too many results. No scoring.
v1.2: Added source filtering. Removed TechCrunch/VentureBeat. -60% noise.
v1.4: Added scoring rubric. Added novelty check vs previous runs.
v1.6: Added IST timezone scheduling. Added Forbes to deprioritize list.
v1.7: Added fallback threshold. Improved arxiv query. Added failure alert.
      Scoring rubric now has sub-criterion descriptions for consistency.
```

**Day 1 skill file: 12 lines.**  

**Day 7 skill file: 62 lines.**

The Day 7 version has a search strategy I wouldn't have written myself — the `-GPT -Gemini` exclusion that cuts proprietary model noise, the 7-day deduplication window, the fallback threshold so the agent always delivers something even on slow news days, the failure alert so I know if it breaks.

I didn't write any of that. I didn't review the skill file during the week. Hermes built it, improved it, and documented its own reasoning in the improvement log.

* * *

## How the Learning Loop Actually Works

The reason this is possible — and the reason most other frameworks can't do it — is an architecture Nous Research calls the closed learning loop. Four components:

**1\. Skills**

After each successful run, Hermes compiles the trajectory into a skill — a structured, versioned procedure stored as a file on your machine. The skill is readable (it's markdown), editable, shareable (compatible with [agentskills.io](https://agentskills.io)), and most importantly, evolvable. Hermes loads the existing skill at the start of each run, executes it, observes the result, and updates the skill if it found a better way.

A LangChain agent runs the same code every time. A Hermes skill runs better code every time.

**2\. Persistent Memory**

FTS5 full-text search across all past sessions, with LLM summarization for cross-session recall. The deduplication in my digest skill — "skip items from the past 7 days" — comes from this. Hermes searched memory, found a pattern (user doesn't want repeated items), and encoded the fix into the skill.

**3\. User Modeling**

Hermes integrates [Honcho](https://github.com/plastic-labs/honcho) for dialectic user modeling — a continuously updated inference about your preferences. This is how it learned "open-source focus" and "no hype" from one sentence of initial instruction, and kept refining that over the week.

**4\. Autonomous Nudges**

The agent periodically decides what's worth remembering without being told. The `dedup_window: 7d` parameter in the Day 7 skill? That came from a nudge — Hermes noticed it was retrieving items it had already surfaced, flagged the pattern, and embedded a fix.

* * *

## The Framework Comparison Nobody Is Having

Most agent framework comparisons are feature lists. Tool support? ✅ Multi-step planning? ✅ Parallel agents? ✅

That comparison misses the dimension that actually matters over weeks of real use: **what does the agent keep, and who owns it?**

Here's the honest breakdown:

| Framework | Memory Model | Skill/Learning System | Who Owns Accumulated Intelligence |
| --- | --- | --- | --- |
| **LangChain / LangGraph** | You build it | None built-in | You (in your code/prompts) |
| **AutoGen** | Conversation context | None built-in | You (in your config) |
| **CrewAI** | Session-scoped | None built-in | You (in your role definitions) |
| **Hermes Agent** | Persistent cross-session | Built-in, self-improving | You (on your machine, MIT) |
| **OpenAI Assistants** | Platform-managed | None built-in | OpenAI (on their servers) |

LangChain is the most widely deployed and has the largest ecosystem — if you need a specific integration, it's there. But everything accumulates in *your* code. The agent itself is always a blank slate. You are the memory layer.

AutoGen's multi-agent conversation model is genuinely interesting for debate-style reasoning — Planner talks to Executor talks to Critic, and the conversation is the state. It works well for tasks where explicit agent dialogue is valuable. Same ceiling: no cross-session learning.

CrewAI's role-based abstraction maps well onto business workflows with stable, defined outputs. Best when you know exactly what roles you need. Same ceiling.

The ceiling is identical across all three: **session ten with LangChain/AutoGen/CrewAI is identical to session one.** The agent hasn't learned your preferences, hasn't refined its procedures, hasn't built a working theory of your use case. The maturity lives in your wrapper code. The agent itself stays naive.

Hermes bets on a different model. The agent accumulates across sessions. The skill file on Day 7 reflects 7 days of observed outcomes. You own all of it — MIT licensed, stored on your machine, readable text files. If Nous Research disappeared tomorrow, your skills still run.

* * *

## Where I'd Push Back

Hermes is genuinely impressive after a week. It's also genuinely early in some ways.

**The learning loop requires a capable model.** Skills are only as good as the reasoning that generates them. I used a Nous Hermes model via OpenRouter and results were excellent. If you're using a weaker endpoint, the skills it writes will reflect that.

**LangChain and LangGraph have a vastly larger ecosystem.** If you need a specific vector store adapter, a custom evaluation framework, or fine-grained observability into every reasoning step — LangGraph is better suited. Hermes makes tradeoffs to deliver the learning loop. Those tradeoffs mean some things are less configurable.

**The memory system has edge cases.** Stale preferences can accumulate. If you told Hermes "I prefer X" three months ago and your preference changed, you need to correct it explicitly. The memory doesn't auto-expire. There's active work on making memory management more transparent, but it's not fully there yet.

**It's a research project at production scale.** The GitHub repo is active, the Discord community is engaged, and the documentation is solid. But you will hit edge cases. You will occasionally see a skill degrade instead of improve. The right mental model is "powerful and evolving," not "stable and mature."

None of these killed the experiment. But you should know what you're signing up for.

* * *

## Who Should Actually Use This

**Choose Hermes Agent when:**

-   You have recurring tasks where session-to-session improvement creates compounding value
-   You're a solo developer or small team that can't maintain a custom memory architecture
-   You want the agent to improve without you manually encoding every lesson learned
-   You want to own what the agent accumulates — readable, portable, MIT licensed files on your machine

**Choose LangChain / LangGraph when:**

-   You need maximum ecosystem breadth and integration options
-   You have engineering resources to build and maintain custom memory and state layers
-   You need fine-grained observability and control over every agent decision

**Choose AutoGen when:**

-   Multi-agent deliberation adds value — tasks where watching agents debate improves quality
-   The workflow benefits from visible, auditable agent-to-agent reasoning

**Choose CrewAI when:**

-   Your workflow maps onto stable, defined roles
-   The output structure is predictable and you want a business-legible abstraction

* * *

## Getting Started

Install in 60 seconds:  

```
# Linux / macOS / WSL2
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1 | iex

# Android (Termux) — same curl command, auto-detects
```

Run it:  

```
hermes
```

Set up Telegram delivery (optional but worth it):  

```
# Tell Hermes in plain English:
"Connect to Telegram and send me a message when tasks complete"
# It walks you through the bot token setup conversationally
```

Configure a recurring task:  

```
"Every morning at 8AM, [your task]. Post results to Telegram."
# Hermes parses this into a cron job and registers it.
# No cron syntax. No webhook configuration. Just English.
```

Then walk away. Come back on Day 7 and read your skill file.

**Useful links:**

-   [Hermes Agent Docs](https://hermes-agent.nousresearch.com/docs/)
-   [GitHub Repo](https://github.com/NousResearch/hermes-agent) (MIT License)
-   [Quickstart Video](https://www.youtube.com/watch?v=R3YOGfTBcQg)
-   [Skills Hub](https://agentskills.io) — community-shared skills
-   [Discord](https://discord.gg/NousResearch)

* * *

## Final Take

The AI agent space has a specific failure mode: things that look impressive in a 15-minute demo and feel identical after three weeks of real use. Every agent can complete a task in a single session. That's not the bar anymore.

The bar is: does the agent get better at *your* work without you doing the maintenance work of manually encoding every improvement?

Day 1 Hermes gave me 6 unfiltered results, no scoring, no format.  

Day 7 Hermes gave me 3 scored, deduplicated, source-filtered, IST-timed, failure-alerted items — with a reasoning trail showing exactly how it got there.

I wrote one sentence of instruction on Day 1 and nothing after that.

That's not a feature. That's a different kind of tool. And it's available right now, free, MIT licensed, on whatever hardware is sitting on your desk.

Pull it. Give it something you do every day. Then read the skill file on Day 7.

* * *

*Tested on Windows 11 / WSL2 with a GTX 1650 (4GB VRAM) and 16GB RAM. Model: Nous Hermes via OpenRouter. All skill files shown are from actual Hermes runs. Hermes Agent is built by [Nous Research](https://nousresearch.com) — MIT licensed.*

*What's the first recurring task you'd hand off? Drop it in the comments — I'm curious what skill files look like across different use cases after a week.*

For further actions, you may consider blocking this person and/or [reporting abuse](/report-abuse)

[![profile](https://media2.dev.to/dynamic/image/width=64,height=64,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Forganization%2Fprofile_image%2F140%2F9639a040-3c27-4b99-b65a-85e100016d3c.png)

MongoDB

](/mongodb)Promoted

-   [What's a billboard?](/billboards)
-   [Manage preferences](/settings/customization#sponsors)

* * *

-   [Report billboard](/report-abuse?billboard=263164)

## Build fast on MongoDB Atlas without the fear of outgrowing.

Don't let your database dictate your speed. With MongoDB Atlas, the same document model you use for your MVP handles global scale across AWS, Azure, and Google Cloud. Start free and stay fast as you grow.

[Start Free](https://www.mongodb.com/cloud/atlas/lp/try3?utm_campaign=display_dev.to-broad_pl_flighted_atlas_tryatlaslp_prosp_gic-null_ww-all_dev_dv-all_eng_leadgen&utm_source=dev.to&utm_medium=display&utm_content=prototype&bb=263164)

Once suspended, sreejit\_ will not be able to comment or publish posts until their suspension is removed.

Note:

Once unsuspended, sreejit\_ will be able to comment and publish posts again.

Note:

Once unpublished, all posts by sreejit\_ will become hidden and only accessible to themselves.

If sreejit\_ is not suspended, they can still re-publish their posts from their dashboard.

Note:

Once unpublished, this post will become invisible to the public and only accessible to Sreejit Pradhan.

They can still re-publish the post if they are not suspended.

Thanks for keeping DEV Community safe. Here is what you can do to flag sreejit\_:

 Make all posts by sreejit\_ less visible

sreejit\_ consistently posts content that violates DEV Community's code of conduct because it is harassing, offensive or spammy.

[Report other inappropriate conduct](javascript:void\(0\);)

Unflagging sreejit\_ will restore default visibility to their posts.

! ! ! ! !
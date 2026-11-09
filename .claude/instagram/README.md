# Instagram agent skill data

Installed from https://github.com/Jakeschincariol/instagram-agent-skill
(commit d03c56b, MIT). The 13 skills live in `.claude/skills/ig-*`.

One change from upstream: the skills originally read and write
`~/.claude/instagram/`, which is wiped between cloud sessions. They now use this
folder, `.claude/instagram/`, so everything is committed to the repo.

| file | written by | read by |
| --- | --- | --- |
| `voice.md` | you (fill it in first) | every skill |
| `log.md` | `/ig-reel` on "yes", `/ig-comment` | `/ig-audit`, `/ig-plan` |
| `swipe.md` | `/ig-viral` | `/ig-reel`, `/ig-plan` |
| `plan.md` | `/ig-plan` | the other skills |

Ask Claude to commit and push after a session that changed these files.

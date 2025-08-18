# 🦸 MCOC Info Bot - Discord Champion Info Fetcher

A simple and powerful Discord bot that fetches champion information for **Marvel Contest of Champions (MCOC)** directly from the MCOC Fandom Wiki.

> Uses [wtf_wikipedia](https://www.npmjs.com/package/wtf_wikipedia) to parse data from [marvel-contestofchampions.fandom.com](https://marvel-contestofchampions.fandom.com).

---

## ✨ Features

- 🔍 Get info on any MCOC champion using `!champ <name>`
- 📦 Automatically pulls sections like:
  - Abilities
  - Counters
  - Immunities
  - Synergy Bonuses
  - Strengths / Weaknesses
  - Notes and more...
- 🖼️ Displays the champion's image (if available)
- 🧠 Intelligent parsing from structured wiki data

---

## 🚀 Example
```
!champ Spider-Man (Stark Enhanced)

---
Bot replies with an embedded message showing key info and image (if available):

> Abilities • Counters • Strengths • Weaknesses • Synergies • Signature Ability • Relic Recommendations

```
## 🛠️ Installation

```bash
$ git clone https://github.com/yourusername/mcoc-discord-bot.git

$ cd mcoc-discord-bot

$ npm install

Create a .env file in the root directory with the following:
DISCORD_TOKEN=your_discord_bot_token_here

$ node bot.js

```

### 🔧 Commands
```
!champ <name>	Fetches champion info from MCOC Wiki
```

### References
- Discord.js v14
- wtf_wikipedia
- MCOC Fandom Wiki

### Future Improvements
- Add autocomplete for champ names
- Better error handling and suggestions
- Include special attacks breakdown
- Cache results for performance

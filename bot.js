import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import wtf from 'wtf_wikipedia';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

dotenv.config();

const DOMAIN = 'marvel-contestofchampions.fandom.com';

// Example list of champions (you should fetch/cache this from wiki once)
const CHAMPIONS = [
  "Spider-Man (Stark Enhanced)", "Doctor Doom", "Cosmic Ghost Rider", "Archangel",
  "Colossus", "Hercules", "Kitty Pryde", "Scorpion", "Absorbing Man", "Shuri",
  // ... add more
];


// Load CSV into memory
const COUNTER_DATA = (() => {

    const fileContent = fs.readFileSync('counters.csv', 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });

    return records.map(r => ({
        class: r.Class?.trim(),
        champion: r.Champion?.trim(),
        tips: r['Tips against this defender 💡']?.trim(),
        counters: r.Counters?.trim()
    }));
})();


// Wikipedia fetch
async function fetchChampionData(champName) {
  try {
    const doc = await wtf.fetch(champName, { domain: DOMAIN });
    if (!doc || doc.isRedirect() || doc.isDisambiguation()) {
      throw new Error(`Page unavailable or ambiguous for: ${champName}`);
    }

    const infobox = doc.infoboxes()?.[0]?.json() || {};
    const sections = {};
    doc.sections().forEach(sec => {
      sections[sec.title()] = sec.text();
    });
    const images = doc.images().map(img => img.url());

    return { champName, infobox, sections, images };
  } catch (err) {
    throw err;
  }
}

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Handle slash command + autocomplete
client.on('interactionCreate', async (interaction) => {

  if (interaction.isAutocomplete()) {

    // Autocomplete: filter champions
    const focused = interaction.options.getFocused();
    const filtered = CHAMPIONS.filter(c =>
      c.toLowerCase().includes(focused.toLowerCase())
    ).slice(0, 25); // Discord max = 25

    await interaction.respond(
      filtered.map(name => ({ name, value: name }))
    );
  }

   // --------------------------
   //  /counter command
   // --------------------------
  if (interaction.isChatInputCommand() && interaction.commandName === 'counter') {
    const champName = interaction.options.getString('defender');
    await interaction.deferReply();

    const match = COUNTER_DATA.find(c => c.champion.toLowerCase() === champName.toLowerCase());

    if (!match) {
      await interaction.editReply(`❌ No counter data found for "${champName}".`);
      return;
    }

    const embed = new EmbedBuilder()
    .setTitle(`🛡️ Counters for ${match.champion} (${match.class})`)
    .setColor('#ff5733');

    // Format tips nicely (preserve line breaks, bold key terms)
    const formattedTips = match.tips
    .replace(/\*\*/g, '') // remove any rogue ** to avoid conflicts
    .replace(/(?:^|\n)- /g, '\n• ') // convert dashes to bullets
    .replace(/([A-Z][a-z]+:)/g, '**$1**') // bold headers like "Note:", "Strategy:"
    .replace(/\n{2,}/g, '\n'); // collapse multiple line breaks

    // Split tips into 1024-char chunks (Discord field limit)
    const tipChunks = formattedTips.match(/.{1,1024}/gs) || ['(No tips provided)'];
        tipChunks.forEach((chunk, index) => {
        embed.addFields({
            name: index === 0 ? '💡 Tips Against This Defender' : `💡 Tips (continued ${index})`,
            value: chunk
        });
    });

    // Format counters as a list (one per line)
    const formattedCounters = match.counters
        .split(',')
        .map(c => `• ${c.trim()}`)
        .join('\n');

        embed.addFields({
            name: '✅ Recommended Counters',
            value: formattedCounters || 'No counters listed.'
    });

    await interaction.editReply({ embeds: [embed] });
  }

  // --------------------------
  // /champ command
  // --------------------------
  if (interaction.isChatInputCommand() && interaction.commandName === 'champ') {

    const champName = interaction.options.getString('name');
    await interaction.deferReply();

    try {
      const data = await fetchChampionData(champName);

      const embed = new EmbedBuilder()
        .setTitle(data.champName)
        .setColor('#007bff');

      const importantSections = [
        'Bio', 'Abilities', 'Signature Ability', 'Special Attacks',
        'Strengths', 'Weaknesses', 'Counters', 'Immunities',
        'Relic Recommendations', 'Signature Recommendations', 'Notes',
      ];

      for (const sectionName of importantSections) {

        if (data.sections[sectionName]) {
            let text = data.sections[sectionName]
            .replace(/\n+/g, '\n')  // clean up line breaks
            .replace(/Dev Notes:/gi, '**Dev Notes:**')  // highlight dev notes
            .replace(/\b(Bleed|Incinerate|Armor Break|Power Lock)\b/gi, '**$1**'); // bold key terms

            // Truncate long text
            if (text.length > 900) {
                text = text.slice(0, 900) + `...\n[Read more](https://${DOMAIN}/wiki/${encodeURIComponent(data.champName)})`;
            }
            embed.addFields({ name: `📖 ${sectionName}`, value: text });
        }
      }

      if (data.images.length > 0) {
        embed.setThumbnail(data.images[0]);
      }

      await interaction.editReply({ embeds: [embed] });
    }
    catch (err) {
      console.error(err);
      await interaction.editReply(
        `❌ Failed to fetch data for "${champName}". Please contact admin.`
      );
    }
  }
});

// Register slash command once (you can move to deploy-commands.js)
client.on('ready', async () => {

    const champCommand = new SlashCommandBuilder()
        .setName('champ')
        .setDescription('Get info about a Marvel Contest of Champions champion')
        .addStringOption(option =>
            option.setName('name')
            .setDescription('Champion name')
            .setAutocomplete(true)
            .setRequired(true)
        );

    const counterCommand = new SlashCommandBuilder()
        .setName('counter')
        .setDescription('Get counters and tips for a defender')
        .addStringOption(option =>
            option.setName('defender')
            .setDescription('Defender name')
            .setAutocomplete(true)
            .setRequired(true)
        );

    await client.application.commands.set([champCommand, counterCommand]);
});

client.login(process.env.DISCORD_TOKEN);

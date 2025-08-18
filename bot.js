import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import wtf from 'wtf_wikipedia';

dotenv.config();

const DOMAIN = 'marvel-contestofchampions.fandom.com';

// Example list of champions (you should fetch/cache this from wiki once)
const CHAMPIONS = [
  "Spider-Man (Stark Enhanced)",
  "Doctor Doom",
  "Cosmic Ghost Rider",
  "Archangel",
  "Colossus",
  "Hercules",
  "Kitty Pryde",
  "Scorpion",
  "Absorbing Man",
  "Shuri",
  // ... add more
];

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

  if (interaction.isChatInputCommand() && interaction.commandName === 'champ') {
    const champName = interaction.options.getString('name');
    await interaction.deferReply();

    try {
      const data = await fetchChampionData(champName);

      const embed = new EmbedBuilder()
        .setTitle(data.champName)
        .setColor('#007bff');

      const importantSections = [
        'Bio',
        'Abilities',
        'Signature Ability',
        'Special Attacks',
        'Strengths',
        'Weaknesses',
        'Counters',
        'Immunities',
        'Relic Recommendations',
        'Signature Recommendations',
        'Notes',
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

  const data = new SlashCommandBuilder()
    .setName('champ')
    .setDescription('Get info about a Marvel Contest of Champions champion')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Champion name')
        .setAutocomplete(true)
        .setRequired(true)
    );

  await client.application.commands.create(data);
});

client.login(process.env.DISCORD_TOKEN);

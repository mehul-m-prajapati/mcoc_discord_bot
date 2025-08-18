import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import wtf from 'wtf_wikipedia';

dotenv.config();

const DOMAIN = 'marvel-contestofchampions.fandom.com';

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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Command prefix: !champ
  if (!message.content.toLowerCase().startsWith('!champ')) return;

  const champName = message.content.slice(6).trim();
  if (!champName) {
    await message.reply('Please provide a champion name. Example: `!champ Spider-Man (Stark Enhanced)`');
    return;
  }

  try {
    await message.channel.sendTyping();

    const data = await fetchChampionData(champName);

    const embed = new EmbedBuilder()
      .setTitle(data.champName)
      .setColor('#007bff');

    // Useful sections to display (adjust or add as needed)
    const importantSections = [
      'Abilities',
      'Counters',
      'Immunities',
      'Signature Ability - Hero\'s Mantra',
      'Synergy Bonuses',
      'Strengths',
      'Weaknesses',
      'Relic Recommendations',
      'Signature Recommendations',
      'Notes',
    ];

    for (const sectionName of importantSections) {
      if (data.sections[sectionName]) {
        // Truncate to 1024 chars max for Discord embed fields
        const text = data.sections[sectionName].length > 1024
          ? data.sections[sectionName].slice(0, 1021) + '...'
          : data.sections[sectionName];
        embed.addFields({ name: sectionName, value: text });
      }
    }

    // Add image if available
    if (data.images.length > 0) {
      embed.setThumbnail(data.images[0]);
    }

    await message.channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    await message.reply(`Failed to fetch champion data for "${champName}". Please check the spelling or try a different champion.`);
  }
});

client.login(process.env.DISCORD_TOKEN);


/*
(async () => {
  try {
    const champName = 'Cosmic_Ghost_Rider';
    const data = await fetchChampionData(champName);

    console.log(`\n=== Champion: ${data.champName} ===\n`);

    // List of important sections to display
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

    importantSections.forEach(section => {
      if (data.sections[section] && data.sections[section].trim().length > 0) {
        const text = data.sections[section].trim();
        const truncated = text.length > 600 ? text.slice(0, 597) + '...' : text;
        console.log(`--- ${section} ---\n${truncated}\n`);
      }
    });

    if (data.images.length > 0) {
      console.log('Image URL:', data.images[0], '\n');
    }
  } catch (err) {
    console.error('Error fetching champion data:', err.message);
  }
})();
*/

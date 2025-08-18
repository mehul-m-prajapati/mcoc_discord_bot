import wtf from 'wtf_wikipedia';
import fs from 'fs';

/**
 * Fetches basic JSON info for a given champion from the Marvel Contest of Champions wiki.
 * @param {string} champName - e.g., 'Spider-Man (Stark Enhanced)'
 * @returns {Promise<object>} Parsed data
 */
export async function fetchChampionData(champName) {
  try {
    const domain = 'marvel-contestofchampions.fandom.com';
    const doc = await wtf.fetch(champName, { domain });
    if (!doc || doc.isRedirect() || doc.isDisambiguation()) {
      throw new Error(`Page unavailable or ambiguous for: ${champName}`);
    }

    // Full parsed JSON of the page
    const pageJson = doc.json();

    // Extract infobox data (likely contains class, release date, etc.)
    const infobox = doc.infoboxes()?.[0]?.json() || {};

    // Sections split
    const sections = {};
    doc.sections().forEach(sec => {
      sections[sec.title()] = sec.text();
    });

    // Images
    const images = doc.images().map(img => img.url());

    return { champName, infobox, sections, images, pageJson };
  } catch (err) {
    console.error(`Error fetching champion: ${err.message}`);
    throw err;
  }
}

/**
 * If you want an Express endpoint:
 */
// import express from 'express';
// const app = express();
// const PORT = process.env.PORT || 3000;

// app.get('/api/champion', async (req, res) => {
//   const { name } = req.query;
//   if (!name) return res.status(400).json({ error: 'name is required' });
//   try {
//     const data = await fetchChampionData(name);
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(PORT, () =>
//   console.log(`Champion API server running on port ${PORT}`)
// );

// Example usage:
(async () => {
  const champ = 'Spider-Man (Stark Enhanced)';
  try {
    const data = await fetchChampionData(champ);
    // Save to a file
    fs.writeFileSync(
      `./${champ.replace(/[\/\\]/g, '_')}.json`,
      JSON.stringify(data, null, 2)
    );
    console.log(`Data for ${champ} written to JSON file.`);
  } catch {}
})();

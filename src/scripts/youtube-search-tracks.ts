import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { parse, stringify } from 'yaml';

// Définition de l'interface pour une piste
interface Track {
  type: string;
  title_override: string;
  source?: string;
}

// Fonction principale
const updateTracks = async (filePath: string) => {
  try {
    // Lecture du fichier YAML
    const file = fs.readFileSync(filePath, 'utf8');
    const data = parse(file) as { tracks: Track[] };

    // Parcours de chaque piste pour ajouter l'URL de la vidéo YouTube
    for (const track of data.tracks) {
      if (track.title_override && !track.source) {
        const videoUrl = await searchYouTube(track.title_override);
        if (videoUrl) {
          track.source = videoUrl;
          console.log(
            `URL trouvée pour "${track.title_override}": ${videoUrl}`
          );
        } else {
          console.log(`Aucune vidéo trouvée pour "${track.title_override}"`);
        }
      }
    }

    // Écriture des modifications dans le fichier YAML
    fs.writeFileSync(filePath, stringify(data), 'utf8');
    console.log('Fichier YAML mis à jour avec succès.');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des pistes :', error);
  }
};

// Fonction pour rechercher une vidéo YouTube
const searchYouTube = async (query: string): Promise<string | null> => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY; // Assurez-vous que la clé API est définie dans le fichier .env
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 1,
          key: apiKey,
        },
      }
    );

    const items = response.data.items;
    if (items.length > 0) {
      return `https://www.youtube.com/watch?v=${items[0].id.videoId}`;
    }
    return null;
  } catch (error) {
    console.error(
      `Erreur lors de la recherche YouTube pour "${query}":`,
      error
    );
    return null;
  }
};

// Récupération du nom de fichier depuis les arguments de la ligne de commande
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Veuillez fournir le chemin du fichier YAML en argument.');
  process.exit(1);
}
const filePath = path.resolve(args[0]);

// Exécution de la fonction
updateTracks(filePath);

# Download youtube videos

This is a simple TypeScript script to download YouTube videos and convert them to MP3 format. It uses yt-dlp under the hood for reliable downloads.

## Prerequisites

Before using this script, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg](https://ffmpeg.org/)

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Usage

Run the script with a YouTube URL as an argument:

```bash
npm start -- <youtube-url>
```

Or using ts-node directly:

```bash
npx ts-node src/index.ts <youtube-url>
```

The script will:
1. Create a `data` directory if it doesn't exist
2. Download the video and convert it to MP3 format
3. Save the file in the `data` directory using the video's title as the filename

## Dependencies

- [youtube-dl-exec](https://github.com/microlinkhq/youtube-dl-exec): Node.js wrapper for yt-dlp
- [yt-dlp](https://github.com/yt-dlp/yt-dlp): The core downloader
- [ffmpeg](https://ffmpeg.org/): Required for audio conversion

## Error Handling

The script includes basic error handling and will:
- Check if a URL is provided
- Create the data directory if needed
- Display download progress
- Show error messages if something goes wrong

## License

MIT
# onsemetbien

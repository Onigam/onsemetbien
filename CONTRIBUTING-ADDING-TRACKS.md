# Adding Tracks to On se met bien Web Radio

You can contribute tracks to the "On se met bien" web radio by submitting a pull request with a track list file. Follow these steps to add your tracks:

## Steps to Add Tracks

1. **Fork the Repository**: Start by forking the repository to your GitHub account.

2. **Clone Your Fork**: Clone your forked repository to your local machine.

   ```bash
   git clone https://github.com/your-username/on-se-met-bien.git
   cd on-se-met-bien
   ```

3. **Create a Track List File**: Create a file named `track-proposals/track-list-<NUMBER>.yaml` in the `track-proposals` directory of the repository. Use the following template:

   ```yaml
   tracks:
   - source: 'https://www.youtube.com/watch?v=example1'
      type: 'music'
      title_override: 'Optional Custom Title'
   - source: 'https://www.youtube.com/watch?v=example2'
      type: 'excerpt'
   - source: 'https://www.youtube.com/watch?v=example2'
      type: 'sketch'
   ```

   - **source**: The YouTube URL of the track.
   - **type**: The type of track (`music`, `excerpt`, `sketch` or `jingle`).
   - **title_override**: (Optional) A custom title for the track.

4. **Submit a Pull Request**: Push your changes to your fork and submit a pull request to the main repository.

5. **Track Processing**: Once your pull request is merged, a GitHub Actions workflow will automatically process your track list. It will:
   - Download each track.
   - Validate the track's duration.
   - Upload the track to the cloud storage if it meets the criteria.

6. **Review Logs**: Check the workflow logs to see the status of each track's processing.

## Track Duration Limits

The upload process will validate the track duration. Here are the limits:

   - **Music**: Maximum 6 minutes
   - **Excerpt/Sketch**: Maximum 90 seconds
   - **Jingle**: Maximum 20 seconds

## Notes

- Ensure your track list file is named `track-list-<NUMBER>.yaml`.
- Each track's validation is independent; one track's failure won't stop the others from being processed. 
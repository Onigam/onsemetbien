export interface SkipVoteComponent {
  element: HTMLElement;
  updateVotes: (votes: number, required: number) => void;
  reset: () => void;
}

export function createSkipVote(onVoteSkip: () => void): SkipVoteComponent {
  let hasVoted = false;

  const container = document.createElement('div');
  container.id = 'skip-vote';

  const button = document.createElement('button');
  button.id = 'skip-button';
  button.textContent = '\u23ED\uFE0F Skip Track';

  const voteCountEl = document.createElement('div');
  voteCountEl.id = 'vote-count';
  voteCountEl.textContent = 'Skip votes: 0/0';

  button.addEventListener('click', () => {
    console.log('Skip button clicked, hasVoted:', hasVoted);
    if (!hasVoted) {
      console.log('Emitting voteSkip event');
      onVoteSkip();
      hasVoted = true;
      button.disabled = true;
    }
  });

  container.appendChild(button);
  container.appendChild(voteCountEl);

  return {
    element: container,
    updateVotes(votes: number, required: number) {
      voteCountEl.textContent = `Skip votes: ${votes}/${required}`;
      button.disabled = hasVoted;
    },
    reset() {
      hasVoted = false;
      button.disabled = false;
    },
  };
}

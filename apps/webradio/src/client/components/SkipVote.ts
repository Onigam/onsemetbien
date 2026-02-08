export interface SkipVoteComponent {
  element: HTMLElement;
  updateVotes: (votes: number, required: number) => void;
  reset: () => void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function createSkipIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.style.verticalAlign = 'middle';
  svg.style.marginRight = '6px';

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z');
  svg.appendChild(path);

  return svg;
}

export function createSkipVote(onVoteSkip: () => void): SkipVoteComponent {
  let hasVoted = false;

  const container = document.createElement('div');
  container.id = 'skip-vote';

  const button = document.createElement('button');
  button.id = 'skip-button';
  button.appendChild(createSkipIcon());
  button.appendChild(document.createTextNode('Skip Track'));

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

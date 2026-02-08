export function createHeader(): HTMLElement {
  const header = document.createElement('header');

  const flexDiv = document.createElement('div');
  flexDiv.style.display = 'flex';
  flexDiv.style.alignItems = 'center';
  flexDiv.style.justifyContent = 'center';

  const titleColumn = document.createElement('div');
  titleColumn.style.display = 'flex';
  titleColumn.style.alignItems = 'center';
  titleColumn.style.justifyContent = 'center';
  titleColumn.style.flexDirection = 'column';
  titleColumn.style.marginRight = '20px';

  const h1 = document.createElement('h1');
  h1.textContent = 'On se met bien';

  const tagline = document.createElement('p');
  tagline.className = 'tagline';
  tagline.textContent = 'Du culte, du lourd, du fun.';

  titleColumn.appendChild(h1);
  titleColumn.appendChild(tagline);

  const logo = document.createElement('img');
  logo.src = 'logo.png';
  logo.alt = 'On se met bien';
  logo.className = 'logo-img';

  flexDiv.appendChild(titleColumn);
  flexDiv.appendChild(logo);
  header.appendChild(flexDiv);

  return header;
}

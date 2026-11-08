import {continueRender, delayRender, staticFile} from 'remotion';

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const h = delayRender('pixel-font');
  const f = new FontFace('Press Start 2P', `url(${staticFile('fonts/PressStart2P.ttf')})`);
  f.load()
    .then((ff) => {
      document.fonts.add(ff);
      continueRender(h);
    })
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
};

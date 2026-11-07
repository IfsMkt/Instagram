import {continueRender, delayRender, staticFile} from 'remotion';

const faces: [string, string, string][] = [
  ['Bebas Neue', 'fonts/BebasNeue.ttf', '400'],
  ['Inter', 'fonts/Inter-500.ttf', '500'],
  ['Inter', 'fonts/Inter-700.ttf', '700'],
  ['Inter', 'fonts/Inter-800.ttf', '800'],
  ['Inter', 'fonts/Inter-900.ttf', '900'],
];

let loaded = false;

export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('fonts');
  Promise.all(
    faces.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(file)})`, {weight});
      return f.load().then((ff) => document.fonts.add(ff));
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};

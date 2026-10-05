import { CHARACTERS } from "./characters";
import type { TrackDef } from "./schema";
import { generalUnits } from "./general";
import { joaoUnits } from "./characters/joao";
import { pedroUnits } from "./characters/pedro";
import { pauloUnits } from "./characters/paulo";
import { moisesUnits } from "./characters/moises";
import { eliasUnits } from "./characters/elias";
import { isaiasUnits } from "./characters/isaias";
import { danielUnits } from "./characters/daniel";

export const TRACKS: TrackDef[] = [
  {
    slug: "jornada-geral",
    kind: "general",
    title: "Jornada geral",
    subtitle: "Com a Mel, a ovelhinha",
    description: "Um panorama da Bíblia, do começo ao fim, em dez unidades curtas.",
    color: "green",
    scene: "garden",
    units: generalUnits,
  },
  ...(
    [
      ["joao", joaoUnits],
      ["pedro", pedroUnits],
      ["paulo", pauloUnits],
      ["moises", moisesUnits],
      ["elias", eliasUnits],
      ["isaias", isaiasUnits],
      ["daniel", danielUnits],
    ] as const
  ).map(([slug, units]): TrackDef => {
    const c = CHARACTERS[slug];
    return {
      slug: `jornada-${slug}`,
      kind: "character",
      character: c,
      title: `Jornada com ${c.name}`,
      subtitle: `${c.name}, ${c.title.toLowerCase()}`,
      description: c.description,
      color: c.color,
      scene: c.scene,
      units: [...units],
    };
  }),
];

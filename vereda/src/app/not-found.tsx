import { Sheep } from "@/components/art/Sheep";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Sheep mood="think" size={130} />
      <h1 className="text-2xl font-extrabold">Essa vereda não existe</h1>
      <p className="font-semibold text-ink-soft">A página que você procurou não foi encontrada.</p>
      <LinkButton href="/inicio">Voltar ao início</LinkButton>
    </main>
  );
}

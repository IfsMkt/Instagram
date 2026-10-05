import { AppNav } from "@/components/nav/AppNav";
import { isEditor, requireOnboarded } from "@/lib/auth";
import { localDate, safeTimeZone } from "@/lib/domain/dates";
import { countDueReviews } from "@/lib/data/review";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireOnboarded();
  const [due, editor] = await Promise.all([
    countDueReviews(user.id, localDate(new Date(), safeTimeZone(profile.timezone))),
    isEditor(user.id),
  ]);
  return (
    <div className="flex min-h-dvh">
      <AppNav dueCount={due} editor={editor} />
      <main id="conteudo" className="min-w-0 flex-1 pb-28 md:pb-10">
        {children}
      </main>
    </div>
  );
}

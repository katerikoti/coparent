import { getSession } from "@/lib/session";
import { getMyFamilies } from "@/app/actions/families";
import { getEventById } from "@/app/actions/events";
import { redirect } from "next/navigation";
import EventForm from "../../new/EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await getSession();
  if (!session?.user) redirect(`/${locale}/auth/sign-in`);
  const event = await getEventById(id);
  if (!event) redirect(`/${locale}/events`);
  const families = await getMyFamilies();

  return (
    <EventForm
      families={families}
      event={{
        id: event.id,
        familyId: event.familyId,
        type: event.type,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        notes: event.notes,
      }}
    />
  );
}

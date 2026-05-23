import { createFileRoute } from "@tanstack/react-router";
import { TeacherForm } from "./add-teacher";

export const Route = createFileRoute("/_authenticated/admissions/edit-teacher/$id")({
  component: EditTeacher,
});

function EditTeacher() {
  const { id } = Route.useParams();
  return <TeacherForm editId={id} />;
}

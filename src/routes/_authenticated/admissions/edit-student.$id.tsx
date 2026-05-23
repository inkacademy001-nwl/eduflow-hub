import { createFileRoute } from "@tanstack/react-router";
import { StudentForm } from "./add-student";

export const Route = createFileRoute("/_authenticated/admissions/edit-student/$id")({
  component: EditStudent,
});

function EditStudent() {
  const { id } = Route.useParams();
  return <StudentForm editId={id} />;
}

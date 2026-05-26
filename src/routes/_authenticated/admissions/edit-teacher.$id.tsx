import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TeacherForm } from "./add-teacher";
import { facultyApi, Teacher } from "@/lib/faculty-api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/config/rolePermissions";

export const Route = createFileRoute("/_authenticated/admissions/edit-teacher/$id")({
  component: EditTeacher,
});

function EditTeacher() {
  const { user } = useAuth();
  if (!user || !canAccess(user.role, "admissions")) {
    return <Navigate to={user?.role === "Faculty" ? "/" : "/dashboard"} replace />;
  }

  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyApi.fetchFacultyById(id)
      .then(setData)
      .catch((err) => toast.error(err.message || "Failed to load faculty"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Faculty not found.
      </div>
    );
  }

  return <TeacherForm initialData={data} />;
}

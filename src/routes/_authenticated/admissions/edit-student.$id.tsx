import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { StudentForm } from "./add-student";
import { studentApi, type Student } from "@/lib/student-api";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/config/rolePermissions";

export const Route = createFileRoute("/_authenticated/admissions/edit-student/$id")({
  component: EditStudent,
});

function EditStudent() {
  const { user } = useAuth();
  if (!user || !canAccess(user.role, "admissions")) {
    return <Navigate to={user?.role === "Faculty" ? "/" : "/dashboard"} replace />;
  }

  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.fetchStudentById(id)
      .then(setData)
      .catch((err) => toast.error(err.message || "Failed to load student"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground">
        Student not found.
      </div>
    );
  }

  return <StudentForm existingData={data} />;
}

import AttendanceHistoryPage from "@/components/attendance/AttendanceHistoryPage";

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return (
    <AttendanceHistoryPage
      projectId={projectId}
      backHref={`/client/my-projects/${projectId}`}
    />
  );
}
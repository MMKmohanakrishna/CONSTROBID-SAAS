import AttendanceHistoryPage from "@/components/attendance/AttendanceHistoryPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <AttendanceHistoryPage
      projectId={id}
      backHref={`/inspection/project/${id}`}
    />
  );
}
import { StudentLibrary } from "@/components/student-library";
import { listPublicVideos } from "@/lib/video-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const library = await listPublicVideos();

  return <StudentLibrary library={library} />;
}

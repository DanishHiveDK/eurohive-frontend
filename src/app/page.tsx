import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  // If not logged in, show the static landing page
  // The landing page is served from public/index.html
  redirect("/index.html");
}

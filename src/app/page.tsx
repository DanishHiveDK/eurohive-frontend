import { redirect } from "next/navigation";

// Middleware handles redirecting authenticated users to /dashboard.
// Unauthenticated visitors land here and are sent to the static landing page.
export default function HomePage() {
  redirect("/index.html");
}

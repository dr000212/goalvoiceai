import { CheckInForm } from "@/components/CheckInForm";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CheckInPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container max-w-3xl pb-16 pt-8">
        <h1 className="page-title">Goal Check-in</h1>
        <p className="mt-4 text-xl leading-8 text-ink/72">Choose a goal, then tell GoalVoice what you did today for that goal.</p>
        <section className="card mt-8 p-6 md:p-8">
          <CheckInForm />
        </section>
      </main>
    </ProtectedRoute>
  );
}

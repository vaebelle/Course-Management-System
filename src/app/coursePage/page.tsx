import { CourseCards } from "./_components/courseCards";
import  CourseNavBar  from "./_components/navBar";

export default function CoursePage() {
  return (
    <>
    <section>
    <CourseNavBar instructorName="Bea Belle Therese B. Caños" />
    </section>

    <section>
    <div className="flex min-h-screen bg-[#ffffff]">
      <main className="flex-1 p-4 md:p-6 w-full">
        <div className="grid gap-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="w-full">
            <CourseCards/>
          </div>
        </div>
      </main>
    </div>
    </section>
    </>
    
  );
}

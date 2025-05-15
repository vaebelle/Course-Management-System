import { Card } from "../../components/ui/card";
import CourseNavBar from "../coursePage/_components/navBar";
import ActivityList from "./components/logs";

export default function CoursePage() {
  return (
    <>
      <CourseNavBar instructorName="Bea Belle Therese B. Caños" />
      <section>
        <div className="flex min-h-screen bg-[#ffffff]">
          <div className="w-full flex justify-center items-start pt-10">
            <Card className="w-3xl flex justify-center items-start pt-10">
              <ActivityList />
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

import { Card } from "../../components/ui/card";
import CourseNavBar from "../coursePage/_components/navBar";
import ActivityList from "./components/logs";

export default function ActivityLog() {
  return (
    <>
      <CourseNavBar instructorName="Bea Belle Therese B. Caños" />
      <section>
        <div className="min-h-screen bg-[#ffffff] px-4 py-10">
          <ActivityList />
        </div>
      </section>
    </>
  );
}
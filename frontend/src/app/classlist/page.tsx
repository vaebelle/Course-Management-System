import { Card } from "../../components/ui/card";
import CourseNavBar from "../coursePage/_components/navBar";
import Search from "./components/search";
import StudentList from "./components/studentlist";

export default function ClassList() {
  return (
    <>
      <CourseNavBar instructorName="Bea Belle Therese B. Caños" />

      <Search />

      <section>
        <div className="flex min-h-screen bg-[#ffffff]">
          <div className="w-full flex justify-center items-start pt-10">
            <Card className="w-3xl flex justify-center items-start pt-10">
              <StudentList />
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

import { FileText, MessageSquare } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

import { Separator } from "../../../components/ui/separator";


const courses = [
  {
    id: 1,
    courseName: "Embedded Systems",
    courseCode: "CPE 3201",
    semester: "2ND SEMESTER AY 2024-2025",
    group: "Group 3",
    color: "bg-blue-500",
  },
  {
    id: 2,
    courseName: "Computer Organization and Architecture",
    courseCode: "CPE 3202",
    semester: "2ND SEMESTER AY 2024-2025",
    group: "Group 3",
    color: "bg-blue-500",
  },
  {
    id: 3,
    courseName: "Digital Signal Processing",
    courseCode: "CPE 3203",
    semester: "2ND SEMESTER AY 2024-2025",
    group: "Group 3",
    color: "bg-blue-500",
  },
  {
    id: 4,
    courseName: "CpE Laws and Professional Practice",
    courseCode: "CPE 3204",
    semester: "2ND SEMESTER AY 2024-2025",
    group: "Group 3",
    color: "bg-blue-500",
  },
  {
    id: 5,
    courseName: "Emerging Technologies in CpE",
    courseCode: "CPE 3205",
    semester: "2ND SEMESTER AY 2024-2025",
    group: "Group 3",
    color: "bg-blue-500",
  },
  {
    id: 6,
    courseName: "Basic Occupational Health and Safety",
    courseCode: "CPE 3206",
    semester: "2ND SEMESTER AY 2024-2025",
    group: "Group 3",
    color: "bg-blue-500",
  },
  {
    id: 7,
    courseName: "CpE Research",
    courseCode: "CPE 3207L",
    semester: "2ND SEMESTER AY 2024-2025",
    group: "Group 3",
    color: "bg-blue-500",
  },
  {
    id: 8,
    courseName: "Web Development",
    courseCode: "CPE 3222",
    semester: "2ND SEMESTER AY 2024-2025",
    group: "Group 3",
    color: "bg-blue-500",
  },
];

export function CourseCards() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Courses</h2>
        <Link
          href="/courses"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          All Courses
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-md shadow-md overflow-hidden flex flex-col"
          >
            <div className="h-2 w-full" style={{ backgroundColor: "#f5c034" }} />
            
            <Card className="rounded-t-none flex flex-col justify-between flex-1">
            <CardHeader className="pb-2 min-h-24 flex flex-col justify-between">
                <CardTitle className="text-base">{course.courseName}</CardTitle>
                <p className="text-sm text-muted-foreground">{course.courseCode}</p>
            </CardHeader>

                <CardContent>
                    <Separator orientation="horizontal" />
                </CardContent>

                <CardFooter className="pb-2 flex flex-col items-end text-right">
                    <p className="text-sm">{course.semester}</p>
                    <p className="text-sm">{course.group}</p>
                </CardFooter>

              
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}

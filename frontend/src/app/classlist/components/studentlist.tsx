import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
const students = [
  {
    id: "22100120",
    studentName: "May Ochia",
    program: "BS CPE - 3",
  },
  {
    id: "22100121",
    studentName: "May Guang",
    program: "BS CPE - 3",
  },
  {
    id: "22100122",
    studentName: "May Cassandra",
    program: "BS CPE - 3",
  },
];

export default function StudentList() {
  return (
    <Table className="w-full max-w-2xl mx-auto bg-white">
      <TableCaption>A list of your recent students.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID Number</TableHead>
          <TableHead>Student Name</TableHead>
          <TableHead>Program</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((id) => (
          <TableRow key={id.id}>
            <TableCell className="font-medium">{id.id}</TableCell>
            <TableCell>{id.studentName}</TableCell>
            <TableCell>{id.program}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

const activitylists = [
  {
    date: "22100120",
    activity: "May Ochia",
    time: "BS CPE - 3",
  },
  {
    date: "22100121",
    activity: "May Guang",
    time: "BS CPE - 3",
  },
  {
    date: "22100122",
    activity: "May Cassandra",
    time: "BS CPE - 3",
  },
];

export default function ActivityList() {
  return (
    <Table className="w-full max-w-2xl mx-auto bg-white">
      <TableCaption>A list of your recent activitylists.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Date</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activitylists.map((entry) => (
          <TableRow key={entry.date}>
            <TableCell className="font-medium">{entry.date}</TableCell>
            <TableCell>{entry.activity}</TableCell>
            <TableCell>{entry.time}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

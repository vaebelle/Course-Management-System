"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
}

interface ApiResponse {
  sucess: boolean;
  data: Student[];
  message: string;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/students`
        );
        console.log("Full API response:", response.data);

        // Correct path to student array
        const studentArray = response.data?.data?.data;
        if (Array.isArray(studentArray)) {
          setStudents(studentArray);
        } else {
          console.error("Unexpected student array format", studentArray);
          setStudents([]); // avoid crashing
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setStudents([]);
      }
    };

    fetchAllStudents();
  }, []);

  const handleNameChange = (
    id: string,
    field: "first_name" | "last_name",
    value: string
  ) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.student_id === id ? { ...student, [field]: value } : student
      )
    );
  };

  const handleSave = async (id: string) => {
    const student = students.find((s) => s.student_id === id);
    if (!student) return;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/students/${student.student_id}`,
        {
          first_name: student.first_name,
          last_name: student.last_name,
        },
        {
          withCredentials: true,
        }
      );
      setEditingStudentId(null);
      alert("Name updated!");
    } catch (error) {
      console.error("Failed to update student:", error);
      alert("Error updating student.");
    }
  };

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
        {students.length > 0 ? (
          students.map((student) => (
            <TableRow key={student.student_id}>
              <TableCell className="font-medium">
                {student.student_id}
              </TableCell>
              <TableCell>
                {editingStudentId === student.student_id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={student.first_name}
                      onChange={(e) =>
                        handleNameChange(
                          student.student_id,
                          "first_name",
                          e.target.value
                        )
                      }
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={student.last_name}
                      onChange={(e) =>
                        handleNameChange(
                          student.student_id,
                          "last_name",
                          e.target.value
                        )
                      }
                      className="border rounded px-2 py-1"
                    />
                    <button
                      onClick={() => handleSave(student.student_id)}
                      className="bg-green-500 text-white px-2 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingStudentId(null)}
                      className="bg-red-500 text-white px-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => setEditingStudentId(student.student_id)}
                  >
                    {student.first_name} {student.last_name}
                  </div>
                )}
              </TableCell>
              <TableCell>{student.program}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="text-center">
              No students found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

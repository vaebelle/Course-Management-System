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

interface StudentListProps {
  searchTerm: string;
}

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  enrolled_course: string;
  deleted_at?: string | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: Student[];
    total: number;
    per_page: number;
    current_page: number;
  };
  message: string;
}

export default function StudentList({ searchTerm }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const [searchResults, setSearchResults] = useState({
    count: 0,
    found: true,
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        setIsSearching(true);

        const response = await axios.get<ApiResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/students`,
          {
            params: {
              include_deleted: showDeleted ? "true" : "false",
              search: searchTerm.trim() || undefined,
            },
          }
        );

        console.log("Full API response:", response.data);

        const studentArray = response.data?.data?.data;
        if (Array.isArray(studentArray)) {
          setStudents(studentArray);

          setSearchResults({
            count: studentArray.length,
            found: studentArray.length > 0 || !searchTerm.trim(),
          });
        } else {
          console.error("Unexpected student array format", studentArray);
          setStudents([]);
          setSearchResults({
            count: 0,
            found: !searchTerm.trim(),
          });
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setStudents([]);
        setSearchResults({
          count: 0,
          found: !searchTerm.trim(),
        });
      } finally {
        setIsSearching(false);
      }
    };

    fetchAllStudents();
  }, [showDeleted, searchTerm]);

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

  const handleSoftDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this student? This action can be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/students/${id}`, {
        withCredentials: true,
      });

      // Remove from current list or refetch
      setStudents((prev) =>
        prev.filter((student) => student.student_id !== id)
      );
      alert("Student deleted successfully!");
    } catch (error) {
      console.error("Failed to delete student:", error);
      alert("Error deleting student.");
    }
  };

  const highlightText = (
    text: string | null | undefined,
    highlight: string
  ) => {
    const textStr = String(text || "");

    if (!highlight.trim() || !textStr) return textStr;

    const parts = textStr.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto out">
        {/* Students Table */}
        <Table className="w-full bg-white">
          <TableCaption>
            {searchTerm
              ? `Search results for "${searchTerm}"`
              : "A list of your students."}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-center">ID Number</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Enrolled Course</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => (
                <TableRow
                  key={student.student_id}
                  className={`${
                    student.deleted_at ? "bg-red-50 opacity-75" : ""
                  } ${searchTerm ? "transition-colors duration-200" : ""}`}
                >
                  <TableCell className="font-medium text-center">
                    {highlightText(student.student_id, searchTerm)}
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
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingStudentId(null)}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`cursor-pointer ${
                          student.deleted_at ? "line-through text-gray-500" : ""
                        }`}
                        onClick={() =>
                          !student.deleted_at &&
                          setEditingStudentId(student.student_id)
                        }
                      >
                        {highlightText(
                          `${student.first_name} ${student.last_name}`,
                          searchTerm
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell
                    className={student.deleted_at ? "text-gray-500" : ""}
                  >
                    {highlightText(student.program, searchTerm)}
                  </TableCell>
                  <TableCell
                    className={student.deleted_at ? "text-gray-500" : ""}
                  >
                    {highlightText(student.enrolled_course || "", searchTerm)}
                  </TableCell>
                  <TableCell className="text-center">
                    {!student.deleted_at && (
                      <button
                        onClick={() => handleSoftDelete(student.student_id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    )}
                    {student.deleted_at && (
                      <span className="text-gray-400 text-sm">Deleted</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {searchTerm ? (
                    <div className="text-gray-500">
                      No students found matching "{searchTerm}"
                    </div>
                  ) : (
                    <div className="text-gray-500">No students found.</div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

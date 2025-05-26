"use client";

import type React from "react";

import { LogOut, Upload, User, AlertCircle, CheckCircle, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

interface CourseNavbarProps {
  instructorName?: string;
  onCourseUpdate?: () => void; // Add this callback prop
}

interface StudentData {
  student_id: number;
  first_name: string;
  last_name: string;
  program: string;
  enrolled_course: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  summary?: {
    total_processed: number;
    successful: number;
    errors: number;
    duplicates: number;
  };
  errors?: Array<{
    row: number;
    student_id: string;
    error: string;
  }>;
  duplicates?: Array<{
    row: number;
    student_id: string;
    name: string;
  }>;
}

interface UserData {
  teacher_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export default function CourseNavBar({
  instructorName,
  onCourseUpdate, // Add this prop
}: CourseNavbarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentInstructor, setCurrentInstructor] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  // Fetch current user data on component mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        // If no token, redirect to login
        router.push("/");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, redirect to login
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          router.push("/");
          return;
        }
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.user) {
        const userData: UserData = result.user;
        const fullName = `${userData.first_name} ${userData.last_name}`;
        setCurrentInstructor(fullName);
        
        // Also store in localStorage for offline access
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        // Fallback to localStorage if API fails
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData: UserData = JSON.parse(storedUser);
          const fullName = `${userData.first_name} ${userData.last_name}`;
          setCurrentInstructor(fullName);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Fallback to localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData: UserData = JSON.parse(storedUser);
          const fullName = `${userData.first_name} ${userData.last_name}`;
          setCurrentInstructor(fullName);
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          setCurrentInstructor("Instructor");
        }
      } else {
        setCurrentInstructor("Instructor");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous results
    setUploadResult(null);
    setShowResult(false);
    setIsUploading(true);

    try {
      // Read file as binary first to handle encoding
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('windows-1252'); // Handle CP1252 encoding
      const fileContent = decoder.decode(arrayBuffer);

      // Parse CSV file without headers since USC format doesn't have standard headers
      Papa.parse(fileContent, {
        header: false,
        skipEmptyLines: false,
        complete: async (results) => {
          try {
            const rows = results.data as string[][];
            
            // Find header row (contains "ID Number", "Student Name", "Program")
            let headerRowIndex = -1;
            rows.forEach((row, index) => {
              if (row.some(cell => cell && cell.toString().toLowerCase().includes('id number'))) {
                headerRowIndex = index;
              }
            });

            if (headerRowIndex === -1) {
              throw new Error('Invalid USC class list format. Could not find header row with "ID Number".');
            }

            // Extract course code from schedule row (usually row before header)
            let courseCode = 'UNKNOWN';
            if (headerRowIndex > 0) {
              const scheduleRow = rows[headerRowIndex - 1];
              const scheduleInfo = scheduleRow.find(cell => 
                cell && cell.toString().includes('CPE') || 
                cell && cell.toString().includes('Group')
              );
              
              if (scheduleInfo) {
                const courseMatch = scheduleInfo.match(/(CPE\s*\d+\w*)/i) || 
                                  scheduleInfo.match(/([A-Z]{2,4}\s*\d+\w*)/i);
                if (courseMatch) {
                  courseCode = courseMatch[1].replace(/\s+/g, '');
                }
              }
            }

            // Extract student data (rows after header)
            const studentRows = rows.slice(headerRowIndex + 1).filter(row => 
              row.length > 1 && row[1] && row[1].toString().trim() !== ''
            );

            if (studentRows.length === 0) {
              throw new Error('No student records found in the file.');
            }

            // Process student data based on USC format
            const students: StudentData[] = studentRows.map(row => {
              const studentId = row[1] ? row[1].toString().trim() : '';
              const fullName = row[5] ? row[5].toString().trim() : '';
              const program = row[10] ? row[10].toString().trim() : '';
              
              // Parse full name (Format: "LAST, FIRST MIDDLE")
              const nameParts = fullName.split(',');
              const lastName = nameParts[0] ? nameParts[0].trim() : '';
              const firstAndMiddle = nameParts[1] ? nameParts[1].trim() : '';
              const firstName = firstAndMiddle.split(' ')[0] || '';
              
              return {
                student_id: parseInt(studentId) || 0,
                first_name: firstName,
                last_name: lastName,
                program: program,
                enrolled_course: courseCode
              };
            }).filter(student => 
              student.student_id > 0 && 
              student.first_name && 
              student.last_name && 
              student.program && 
              student.enrolled_course
            );

            if (students.length === 0) {
              throw new Error('No valid student records found. Please check the file format.');
            }

            // Send data to backend with course information
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_BASE_URL}/students/import-csv`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              body: JSON.stringify({ 
                students,
                course_info: {
                  course_code: courseCode,
                  course_name: courseCode, // Use course code as name for now
                  teacher_name: rows[2] && rows[2][4] ? rows[2][4].toString().trim() : null
                }
              }),
            });

            const result: ImportResult = await response.json();
            
            setUploadResult(result);
            setShowResult(true);

            // Only trigger course refresh if the import was successful
            // Don't refresh if all students were skipped
            if (result.success) {
              // Reset file input
              event.target.value = '';
              
              // Trigger course list refresh if callback is provided
              if (onCourseUpdate) {
                onCourseUpdate();
              }
            }

          } catch (error) {
            console.error('Upload error:', error);
            setUploadResult({
              success: false,
              message: error instanceof Error ? error.message : 'Failed to upload class list'
            });
            setShowResult(true);
          } finally {
            setIsUploading(false);
          }
        },
        error: (error: Error) => {
          console.error('CSV parsing error:', error);
          setUploadResult({
            success: false,
            message: 'Failed to parse USC class list file. Please check the file format.'
          });
          setShowResult(true);
          setIsUploading(false);
        }
      });
    } catch (error) {
      console.error('File processing error:', error);
      setUploadResult({
        success: false,
        message: 'Failed to process the file'
      });
      setShowResult(true);
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      
      if (token) {
        // Call logout API to invalidate the token on the server
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      // Clear authentication data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      
      // Redirect to login page
      router.push("/");
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setShowResult(false);
    setUploadResult(null);
  };

  // Use fetched instructor name if available, otherwise use prop or fallback
  const displayName = (!loading && currentInstructor !== "Loading..." && currentInstructor !== "Instructor") 
    ? currentInstructor 
    : (instructorName || currentInstructor);

  return (
    <nav className="bg-[#017638] border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">
              Hi, <span className="text-white font-bold">
                {loading ? "Loading..." : displayName}
              </span>!
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/coursePage" passHref>
              <Button className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#e0e0e0] text-black">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#e0e0e0] text-black"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload Class List</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between">
                  <DialogTitle>Upload Class List</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {!showResult && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="file-upload" className="text-sm font-medium">
                          Select CSV File
                        </label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                        <p className="text-xs text-muted-foreground">
                          Accepted format: University of San Carlos Class List (CSV)
                        </p>
                      </div>
                      
                      {isUploading && (
                        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-md">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-blue-700">Processing and uploading...</p>
                        </div>
                      )}
                    </>
                  )}

                  {showResult && uploadResult && (
                    <div className="space-y-4">
                      <div className={`flex items-start gap-3 p-4 rounded-md ${
                        uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        {uploadResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${
                            uploadResult.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                          </p>
                          <p className={`text-sm ${
                            uploadResult.success ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {uploadResult.message}
                          </p>
                          
                          {/* Additional warning for partial failures */}
                          {uploadResult.success && uploadResult.summary && 
                           (uploadResult.summary.errors > 0 || uploadResult.summary.duplicates > 0) && (
                            <p className="text-sm text-yellow-700 mt-2 font-medium">
                              ⚠️ Some students were not imported due to errors or duplicates.
                            </p>
                          )}
                          
                          {/* Special message for complete failure */}
                          {!uploadResult.success && uploadResult.summary && 
                           uploadResult.summary.successful === 0 && uploadResult.summary.duplicates > 0 && (
                            <p className="text-sm text-red-700 mt-2 font-medium">
                              💡 All students in this class list are already enrolled with other instructors for this course.
                            </p>
                          )}
                        </div>
                      </div>

                      {uploadResult.summary && (
                        <div className="bg-slate-50 p-4 rounded-md">
                          <h4 className="font-medium text-slate-800 mb-2">Import Summary</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span>Total Processed:</span>
                            <span className="font-medium">{uploadResult.summary.total_processed}</span>
                            <span>Successfully Imported:</span>
                            <span className="font-medium text-green-600">{uploadResult.summary.successful}</span>
                            <span>Errors:</span>
                            <span className="font-medium text-red-600">{uploadResult.summary.errors}</span>
                            <span>Duplicates Skipped:</span>
                            <span className="font-medium text-yellow-600">{uploadResult.summary.duplicates}</span>
                          </div>
                        </div>
                      )}

                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-md">
                          <h4 className="font-medium text-red-800 mb-2">Errors ({uploadResult.errors.length})</h4>
                          <div className="max-h-32 overflow-y-auto">
                            {uploadResult.errors.map((error, index) => (
                              <div key={index} className="text-xs text-red-700 mb-1">
                                Row {error.row} (Student ID: {error.student_id}): {error.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {uploadResult.duplicates && uploadResult.duplicates.length > 0 && (
                        <div className="bg-yellow-50 p-4 rounded-md">
                          <h4 className="font-medium text-yellow-800 mb-2">Duplicates Skipped ({uploadResult.duplicates.length})</h4>
                          <div className="max-h-32 overflow-y-auto">
                            {uploadResult.duplicates.map((duplicate, index) => (
                              <div key={index} className="text-xs text-yellow-700 mb-1">
                                Row {duplicate.row}: {duplicate.name} (ID: {duplicate.student_id}) already exists
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowResult(false);
                            setUploadResult(null);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Upload Another File
                        </Button>
                        <Button
                          onClick={closeDialog}
                          className="flex-1"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Link href="/activitylog" passHref>
              <Button className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#e0e0e0] text-black">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Activity Log</span>
              </Button>
            </Link>

            <Button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#e0e0e0] text-black"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
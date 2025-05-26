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
  course_code?: string; // Add course code for tracking
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

interface BulkImportResult {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  results: ImportResult[];
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
  const [uploadResult, setUploadResult] = useState<ImportResult | BulkImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentInstructor, setCurrentInstructor] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);
  const [isBulkUpload, setIsBulkUpload] = useState(false); // Track if it's bulk upload
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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const isBulk = fileArray.length > 1;
    setIsBulkUpload(isBulk);

    // Reset previous results
    setUploadResult(null);
    setShowResult(false);
    setIsUploading(true);

    try {
      if (isBulk) {
        // Handle multiple files
        await processBulkFiles(fileArray);
      } else {
        // Handle single file (existing logic)
        await processSingleFile(fileArray[0]);
      }
    } catch (error) {
      console.error('File processing error:', error);
      setUploadResult({
        success: false,
        message: 'Failed to process the file(s)'
      } as ImportResult);
      setShowResult(true);
      setIsUploading(false);
    }
  };

  const processBulkFiles = async (files: File[]) => {
    const results: ImportResult[] = [];
    let successfulFiles = 0;
    let failedFiles = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        const result = await processIndividualFile(file);
        results.push({
          ...result,
          course_code: result.course_code || 'Unknown'
        });
        
        if (result.success) {
          successfulFiles++;
        } else {
          failedFiles++;
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.push({
          success: false,
          message: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          course_code: file.name
        });
        failedFiles++;
      }
    }

    const bulkResult: BulkImportResult = {
      totalFiles: files.length,
      successfulFiles,
      failedFiles,
      results
    };

    setUploadResult(bulkResult);
    setShowResult(true);
    setIsUploading(false);

    // Trigger course refresh if any files were successful
    if (successfulFiles > 0 && onCourseUpdate) {
      onCourseUpdate();
    }
  };

  const processSingleFile = async (file: File) => {
    const result = await processIndividualFile(file);
    setUploadResult(result);
    setShowResult(true);
    setIsUploading(false);

    // Only trigger course refresh if the import was successful
    if (result.success && onCourseUpdate) {
      onCourseUpdate();
    }
  };

  const processIndividualFile = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
      // Read file as binary first to handle encoding
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const decoder = new TextDecoder('windows-1252');
          const fileContent = decoder.decode(arrayBuffer);

          // Parse CSV file
          Papa.parse(fileContent, {
            header: false,
            skipEmptyLines: false,
            complete: async (parseResults) => {
              try {
                const rows = parseResults.data as string[][];
                
                // Find header row
                let headerRowIndex = -1;
                rows.forEach((row, index) => {
                  if (row.some(cell => cell && cell.toString().toLowerCase().includes('id number'))) {
                    headerRowIndex = index;
                  }
                });

                if (headerRowIndex === -1) {
                  throw new Error(`Invalid USC class list format in ${file.name}. Could not find header row with "ID Number".`);
                }

                // Extract course code
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

                // Extract student data
                const studentRows = rows.slice(headerRowIndex + 1).filter(row => 
                  row.length > 1 && row[1] && row[1].toString().trim() !== ''
                );

                if (studentRows.length === 0) {
                  throw new Error(`No student records found in ${file.name}.`);
                }

                // Process student data
                const students: StudentData[] = studentRows.map(row => {
                  const studentId = row[1] ? row[1].toString().trim() : '';
                  const fullName = row[5] ? row[5].toString().trim() : '';
                  const program = row[10] ? row[10].toString().trim() : '';
                  
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
                  throw new Error(`No valid student records found in ${file.name}. Please check the file format.`);
                }

                // Send to backend
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
                      course_name: courseCode,
                      teacher_name: rows[2] && rows[2][4] ? rows[2][4].toString().trim() : null
                    }
                  }),
                });

                const result: ImportResult = await response.json();
                result.course_code = courseCode; // Add course code to result
                resolve(result);

              } catch (error) {
                reject(error);
              }
            },
            error: (error: Error) => {
              reject(new Error(`Failed to parse ${file.name}: ${error.message}`));
            }
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsArrayBuffer(file);
    });
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
    setIsBulkUpload(false);
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
                          multiple // Enable multiple file selection
                        />
                        <p className="text-xs text-muted-foreground">
                          Accepted format: University of San Carlos Class List (CSV)
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold text-blue-600">
                          💡 Select multiple files for bulk upload
                        </p>
                      </div>
                      
                      {isUploading && (
                        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-md">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-blue-700">
                            {isBulkUpload ? 'Processing multiple files...' : 'Processing and uploading...'}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {showResult && uploadResult && (
                    <div className="space-y-4">
                      {/* Handle bulk upload results */}
                      {isBulkUpload && 'totalFiles' in uploadResult ? (
                        <div className="space-y-4">
                          {/* Bulk Summary */}
                          <div className={`flex items-start gap-3 p-4 rounded-md ${
                            uploadResult.successfulFiles > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                          }`}>
                            {uploadResult.successfulFiles > 0 ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className={`font-medium ${
                                uploadResult.successfulFiles > 0 ? 'text-green-800' : 'text-red-800'
                              }`}>
                                Bulk Upload {uploadResult.successfulFiles > 0 ? 'Completed' : 'Failed'}
                              </p>
                              <p className={`text-sm ${
                                uploadResult.successfulFiles > 0 ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {uploadResult.successfulFiles} of {uploadResult.totalFiles} files uploaded successfully
                              </p>
                            </div>
                          </div>

                          {/* Individual File Results */}
                          <div className="bg-slate-50 p-4 rounded-md max-h-64 overflow-y-auto">
                            <h4 className="font-medium text-slate-800 mb-3">Individual File Results</h4>
                            <div className="space-y-2">
                              {uploadResult.results.map((result, index) => (
                                <div key={index} className={`p-3 rounded-md text-sm ${
                                  result.success ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                      {result.course_code || `File ${index + 1}`}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                    }`}>
                                      {result.success ? 'Success' : 'Failed'}
                                    </span>
                                  </div>
                                  <p className={`text-xs mt-1 ${
                                    result.success ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {result.message}
                                  </p>
                                  {result.summary && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {result.summary.successful}/{result.summary.total_processed} students imported
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Handle single upload results */
                        <div className={`flex items-start gap-3 p-4 rounded-md ${
                          (uploadResult as ImportResult).success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          {(uploadResult as ImportResult).success ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium ${
                              (uploadResult as ImportResult).success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {(uploadResult as ImportResult).success ? 'Upload Successful!' : 'Upload Failed'}
                            </p>
                            <p className={`text-sm ${
                              (uploadResult as ImportResult).success ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {(uploadResult as ImportResult).message}
                            </p>
                            
                            {/* Additional warnings and messages for single uploads */}
                            {(uploadResult as ImportResult).success && (uploadResult as ImportResult).summary && 
                             ((uploadResult as ImportResult).summary!.errors > 0 || (uploadResult as ImportResult).summary!.duplicates > 0) && (
                              <p className="text-sm text-yellow-700 mt-2 font-medium">
                                ⚠️ Some students were not imported due to errors or duplicates.
                              </p>
                            )}
                            
                            {!(uploadResult as ImportResult).success && (uploadResult as ImportResult).summary && 
                             (uploadResult as ImportResult).summary!.successful === 0 && (uploadResult as ImportResult).summary!.duplicates > 0 && (
                              <p className="text-sm text-red-700 mt-2 font-medium">
                                💡 All students in this class list are already enrolled with other instructors for this course.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Show detailed errors/duplicates for single uploads */}
                      {!isBulkUpload && (uploadResult as ImportResult).summary && (
                        <div className="bg-slate-50 p-4 rounded-md">
                          <h4 className="font-medium text-slate-800 mb-2">Import Summary</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span>Total Processed:</span>
                            <span className="font-medium">{(uploadResult as ImportResult).summary!.total_processed}</span>
                            <span>Successfully Imported:</span>
                            <span className="font-medium text-green-600">{(uploadResult as ImportResult).summary!.successful}</span>
                            <span>Errors:</span>
                            <span className="font-medium text-red-600">{(uploadResult as ImportResult).summary!.errors}</span>
                            <span>Duplicates Skipped:</span>
                            <span className="font-medium text-yellow-600">{(uploadResult as ImportResult).summary!.duplicates}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowResult(false);
                            setUploadResult(null);
                            setIsBulkUpload(false);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Upload More Files
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
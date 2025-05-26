import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  BookOpen, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  Download,
  Search,
  Filter,
  FileText
} from 'lucide-react';

interface Student {
  id: number;
  student_id: number;
  first_name: string;
  last_name: string;
  program: string;
  enrolled_course: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface CourseDetails {
  course_code: string;
  course_name: string;
  instructor_name: string;
  schedule?: string;
  time_slot?: string;
  location?: string;
  semester: string;
  group: string;
  enrolled_count: number;
  students: Student[];
}

interface CourseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseCode: string;
}

const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  isOpen,
  onClose,
  courseCode
}) => {
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (isOpen && courseCode) {
      fetchCourseDetails();
    }
  }, [isOpen, courseCode]);

  useEffect(() => {
    if (courseDetails) {
      const filtered = courseDetails.students.filter(student =>
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toString().includes(searchTerm) ||
        student.program.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, courseDetails]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching course details for:', courseCode);
      console.log('API URL:', `${API_BASE_URL}/courses/${courseCode}/details`);
      
      // Get auth token from localStorage
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        throw new Error('Please login to view course details');
      }
      
      // Fetch detailed course information
      const response = await fetch(`${API_BASE_URL}/courses/${courseCode}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`, // Add auth token
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          throw new Error('Session expired. Please login again.');
        }
        
        // Get more detailed error information
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch course details (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to load course details');
      }

      // Map the API response to our interface
      const details: CourseDetails = {
        course_code: result.data.course_code,
        course_name: result.data.course_name,
        instructor_name: result.data.instructor_name,
        schedule: `${result.data.group} - ${result.data.semester}`,
        time_slot: result.data.schedule || "FSat - 10:30 AM - 01:30 PM",
        location: result.data.location || "CNLab",
        semester: result.data.semester,
        group: result.data.group,
        enrolled_count: result.data.enrolled_count,
        students: result.data.students.map((student: any) => ({
          id: student.id,
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          program: student.program,
          enrolled_course: student.enrolled_course,
          created_at: student.created_at,
          updated_at: student.updated_at,
          deleted_at: student.deleted_at
        }))
      };

      setCourseDetails(details);
      
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const exportStudentList = () => {
    if (!courseDetails) return;

    const csvContent = [
      // Header
      ['Student ID', 'First Name', 'Last Name', 'Program', 'Course', 'Date Enrolled'].join(','),
      // Data
      ...courseDetails.students.map(student => [
        student.student_id,
        `"${student.first_name}"`,
        `"${student.last_name}"`,
        `"${student.program}"`,
        student.enrolled_course,
        new Date(student.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${courseCode}_students.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header - Match navbar green theme */}
        <div className="bg-[#017638] text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6" />
              <div>
                <h2 className="text-2xl font-bold">
                  {loading ? 'Loading...' : courseDetails?.course_name || courseCode}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors p-1 rounded-full hover:bg-green-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#017638]"></div>
              <span className="ml-3 text-gray-600">Loading course details...</span>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-4">{error}</div>
              <button
                onClick={fetchCourseDetails}
                className="px-4 py-2 bg-[#017638] text-white rounded hover:bg-green-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {courseDetails && (
            <div className="p-6 space-y-6">
              {/* Course Information Grid - Updated color scheme */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-[#017638]" />
                    <span className="text-sm font-medium text-[#017638]">Instructor</span>
                  </div>
                  <p className="text-green-900 font-semibold">{courseDetails.instructor_name}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-[#f5c034]" />
                    <span className="text-sm font-medium text-yellow-800">Enrolled</span>
                  </div>
                  <p className="text-yellow-900 font-semibold">{courseDetails.enrolled_count} Students</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-[#017638]" />
                    <span className="text-sm font-medium text-[#017638]">Schedule</span>
                  </div>
                  <p className="text-green-900 font-semibold text-sm">{courseDetails.time_slot}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-[#f5c034]" />
                    <span className="text-sm font-medium text-yellow-800">Location</span>
                  </div>
                  <p className="text-yellow-900 font-semibold">{courseDetails.location}</p>
                </div>
              </div>

              {/* CSV Import Information - Updated color scheme */}
              <div className="bg-gradient-to-r from-green-50 to-yellow-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-[#017638] mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Class List Information
                </h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-[#017638] font-medium">Course:</span>
                    <p className="text-green-900">{courseDetails.course_code}</p>
                  </div>
                </div>
              </div>

              {/* Students Section - Updated styling */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-[#017638] px-6 py-4 border-b border-green-600">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Student List ({filteredStudents.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#f5c034] focus:border-[#f5c034] text-gray-900"
                        />
                      </div>
                      <button
                        onClick={exportStudentList}
                        className="flex items-center gap-1 px-3 py-2 bg-[#f5c034] hover:bg-yellow-500 text-gray-900 rounded-md text-sm font-medium transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#017638] uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#017638] uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#017638] uppercase tracking-wider">
                          Program
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#017638] uppercase tracking-wider">
                          Date Enrolled
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#017638] uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            {searchTerm ? 'No students found matching your search.' : 'No students enrolled yet.'}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student, index) => (
                          <tr key={student.id} className="hover:bg-green-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900 font-medium">
                              {student.student_id}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {student.first_name} {student.last_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {student.program}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(student.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                student.deleted_at 
                                  ? 'bg-red-100 text-red-800 border border-red-200' 
                                  : 'bg-green-100 text-[#017638] border border-green-200'
                              }`}>
                                {student.deleted_at ? 'Inactive' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Updated styling */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#017638] hover:bg-green-700 text-white rounded-md font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsModal;
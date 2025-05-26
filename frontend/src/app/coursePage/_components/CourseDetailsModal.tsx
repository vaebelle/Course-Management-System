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
  FileText,
  Edit,
  Trash2,
  UserPlus,
  Save,
  Ban,
  RotateCcw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Student {
  student_id: number;
  first_name: string;
  last_name: string;
  program: string;
  enrolled_course: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  status?: 'active' | 'inactive';
}

interface CourseDetails {
  course_code: string;
  course_name: string;
  instructor_name: string;
  schedule?: string;
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

interface EditingStudent {
  student_id: number;
  first_name: string;
  last_name: string;
  program: string;
}

interface NewStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
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
  
  // Edit functionality states
  const [editingStudent, setEditingStudent] = useState<EditingStudent | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Add student states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudent>({
    student_id: '',
    first_name: '',
    last_name: '',
    program: ''
  });
  
  // Action states
  const [savingStudent, setSavingStudent] = useState<number | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<number | null>(null);
  const [addingStudent, setAddingStudent] = useState(false);
  
  // Notification states
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (isOpen && courseCode) {
      fetchCourseDetails();
    }
  }, [isOpen, courseCode]);

  useEffect(() => {
    if (courseDetails) {
      // Filter out soft-deleted students by default and apply search
      const activeStudents = courseDetails.students.filter(student => !student.deleted_at);
      const filtered = activeStudents.filter(student =>
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toString().includes(searchTerm) ||
        student.program.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, courseDetails]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching course details for:', courseCode);
      console.log('API URL:', `${API_BASE_URL}/courses/${courseCode}/details`);
      
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        throw new Error('Please login to view course details');
      }
      
      const response = await fetch(`${API_BASE_URL}/courses/${courseCode}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          throw new Error('Session expired. Please login again.');
        }
        
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch course details (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      console.log('Schedule from API:', result.data?.schedule);

      if (!result.success) {
        throw new Error(result.message || 'Failed to load course details');
      }

      const details: CourseDetails = {
        course_code: result.data.course_code,
        course_name: result.data.course_name,
        instructor_name: result.data.instructor_name,
        schedule: result.data.schedule || 'TBD',
        location: result.data.location || 'TBD',
        semester: result.data.semester,
        group: result.data.group,
        enrolled_count: result.data.enrolled_count,
        students: result.data.students.map((student: any) => ({
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          program: student.program,
          enrolled_course: student.enrolled_course,
          created_at: student.created_at,
          updated_at: student.updated_at,
          deleted_at: student.deleted_at,
          status: student.deleted_at ? 'inactive' : 'active'
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

  const startEditing = (student: Student) => {
    setEditingId(student.student_id);
    setEditingStudent({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      program: student.program
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingStudent(null);
  };

  const saveStudent = async (studentId: number) => {
    if (!editingStudent) return;
    
    setSavingStudent(studentId);
    
    try {
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: editingStudent.first_name.toUpperCase(),
          last_name: editingStudent.last_name.toUpperCase(),
          program: editingStudent.program.toUpperCase()
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update student: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state with uppercase values
        setCourseDetails(prev => {
          if (!prev) return prev;
          
          const updatedStudents = prev.students.map(student => 
            student.student_id === studentId 
              ? { 
                  ...student, 
                  first_name: editingStudent.first_name.toUpperCase(),
                  last_name: editingStudent.last_name.toUpperCase(),
                  program: editingStudent.program.toUpperCase(),
                  updated_at: new Date().toISOString() 
                }
              : student
          );
          
          return { ...prev, students: updatedStudents };
        });
        
        cancelEditing();
        showNotification('success', 'Student updated successfully');
      } else {
        throw new Error(result.message || 'Failed to update student');
      }
    } catch (err) {
      console.error('Error updating student:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to update student');
    } finally {
      setSavingStudent(null);
    }
  };

  const softDeleteStudent = async (studentId: number) => {
    if (!confirm('Are you sure you want to remove this student from the course?')) {
      return;
    }
    
    setDeletingStudent(studentId);
    
    try {
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove student: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state - soft delete
        setCourseDetails(prev => {
          if (!prev) return prev;
          
          const updatedStudents = prev.students.map(student => 
            student.student_id === studentId 
              ? { 
                  ...student, 
                  deleted_at: new Date().toISOString(),
                  status: 'inactive' as const
                }
              : student
          );
          
          const newEnrolledCount = updatedStudents.filter(s => !s.deleted_at).length;
          
          return { 
            ...prev, 
            students: updatedStudents,
            enrolled_count: newEnrolledCount
          };
        });
        
        showNotification('success', 'Student removed from course');
      } else {
        throw new Error(result.message || 'Failed to remove student');
      }
    } catch (err) {
      console.error('Error removing student:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to remove student');
    } finally {
      setDeletingStudent(null);
    }
  };

  const restoreStudent = async (studentId: number) => {
    setDeletingStudent(studentId);
    
    try {
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to restore student: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state - restore student
        setCourseDetails(prev => {
          if (!prev) return prev;
          
          const updatedStudents = prev.students.map(student => 
            student.student_id === studentId 
              ? { 
                  ...student, 
                  deleted_at: undefined,
                  status: 'active' as const
                }
              : student
          );
          
          const newEnrolledCount = updatedStudents.filter(s => !s.deleted_at).length;
          
          return { 
            ...prev, 
            students: updatedStudents,
            enrolled_count: newEnrolledCount
          };
        });
        
        showNotification('success', 'Student restored to course');
      } else {
        throw new Error(result.message || 'Failed to restore student');
      }
    } catch (err) {
      console.error('Error restoring student:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to restore student');
    } finally {
      setDeletingStudent(null);
    }
  };

  const addNewStudent = async () => {
    if (!newStudent.student_id || !newStudent.first_name || !newStudent.last_name || !newStudent.program) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }
    
    setAddingStudent(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: parseInt(newStudent.student_id),
          first_name: newStudent.first_name.toUpperCase(),
          last_name: newStudent.last_name.toUpperCase(),
          program: newStudent.program.toUpperCase(),
          enrolled_course: courseCode
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add student: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Add to local state with uppercase values
        const newStudentData: Student = {
          student_id: parseInt(newStudent.student_id),
          first_name: newStudent.first_name.toUpperCase(),
          last_name: newStudent.last_name.toUpperCase(),
          program: newStudent.program.toUpperCase(),
          enrolled_course: courseCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active'
        };
        
        setCourseDetails(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            students: [...prev.students, newStudentData],
            enrolled_count: prev.enrolled_count + 1
          };
        });
        
        // Reset form
        setNewStudent({
          student_id: '',
          first_name: '',
          last_name: '',
          program: ''
        });
        setShowAddForm(false);
        
        showNotification('success', 'Student added successfully');
      } else {
        throw new Error(result.message || 'Failed to add student');
      }
    } catch (err) {
      console.error('Error adding student:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to add student');
    } finally {
      setAddingStudent(false);
    }
  };

  const exportStudentList = () => {
    if (!courseDetails) return;

    // Export only active students (non-deleted)
    const activeStudents = courseDetails.students.filter(student => !student.deleted_at);

    const csvContent = [
      ['Student ID', 'First Name', 'Last Name', 'Program', 'Course', 'Date Enrolled'].join(','),
      ...activeStudents.map(student => [
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
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Notification */}
        {notification && (
          <div className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-md shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-[#017638] text-white p-5">
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

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
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
              {/* Course Information Grid */}
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
                    <FileText className="h-4 w-4 text-[#f5c034]" />
                    <span className="text-sm font-medium text-yellow-800">Course</span>
                  </div>
                  <p className="text-yellow-900 font-semibold">{courseDetails.course_code}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-[#017638]" />
                    <span className="text-sm font-medium text-[#017638]">Schedule</span>
                  </div>
                  <p className="text-green-900 font-semibold text-sm">{courseDetails.schedule}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-[#f5c034]" />
                    <span className="text-sm font-medium text-yellow-800">Enrolled</span>
                  </div>
                  <p className="text-yellow-900 font-semibold">{courseDetails.enrolled_count} Students</p>
                </div>
              </div>

              {/* Add Student Form */}
              {showAddForm && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="h-5 w-5 text-[#017638]" />
                    <h4 className="text-lg font-semibold text-[#017638]">Add New Student</h4>
                  </div>
                  
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                      <input
                        type="number"
                        value={newStudent.student_id}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, student_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#017638] focus:border-[#017638]"
                        placeholder="ENTER STUDENT ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={newStudent.first_name}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, first_name: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#017638] focus:border-[#017638] uppercase"
                        placeholder="Enter first name"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={newStudent.last_name}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, last_name: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#017638] focus:border-[#017638] uppercase"
                        placeholder="Enter last name"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                      <input
                        type="text"
                        value={newStudent.program}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, program: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#017638] focus:border-[#017638] uppercase"
                        placeholder="Enter program"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={addNewStudent}
                      disabled={addingStudent}
                      className="flex items-center gap-2 px-4 py-2 bg-[#017638] hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                      {addingStudent ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Add Student
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors"
                    >
                      <Ban className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Students Section */}
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
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-1 px-3 py-2 bg-[#017638] hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Student
                      </button>
                      
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
                          First Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#017638] uppercase tracking-wider">
                          Last Name
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#017638] uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            {searchTerm ? 'No students found matching your search.' : 'No students enrolled yet.'}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.student_id} className="hover:bg-green-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900 font-medium">
                              {student.student_id}
                            </td>
                            
                            {/* Editable First Name */}
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {editingId === student.student_id ? (
                                <input
                                  type="text"
                                  value={editingStudent?.first_name || ''}
                                  onChange={(e) => setEditingStudent(prev => 
                                    prev ? { ...prev, first_name: e.target.value.toUpperCase() } : null
                                  )}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#017638] uppercase"
                                  style={{ textTransform: 'uppercase' }}
                                />
                              ) : (
                                <span className="font-medium">{student.first_name}</span>
                              )}
                            </td>
                            
                            {/* Editable Last Name */}
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {editingId === student.student_id ? (
                                <input
                                  type="text"
                                  value={editingStudent?.last_name || ''}
                                  onChange={(e) => setEditingStudent(prev => 
                                    prev ? { ...prev, last_name: e.target.value.toUpperCase() } : null
                                  )}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#017638] uppercase"
                                  style={{ textTransform: 'uppercase' }}
                                />
                              ) : (
                                <span className="font-medium">{student.last_name}</span>
                              )}
                            </td>
                            
                            {/* Editable Program */}
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {editingId === student.student_id ? (
                                <input
                                  type="text"
                                  value={editingStudent?.program || ''}
                                  onChange={(e) => setEditingStudent(prev => 
                                    prev ? { ...prev, program: e.target.value.toUpperCase() } : null
                                  )}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#017638] uppercase"
                                  style={{ textTransform: 'uppercase' }}
                                />
                              ) : (
                                <span>{student.program}</span>
                              )}
                            </td>
                            
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(student.created_at).toLocaleDateString()}
                            </td>
                            
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-[#017638] border border-green-200">
                                Active
                              </span>
                            </td>
                            
                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {editingId === student.student_id ? (
                                  // Save/Cancel buttons when editing
                                  <>
                                    <button
                                      onClick={() => saveStudent(student.student_id)}
                                      disabled={savingStudent === student.student_id}
                                      className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                                      title="Save changes"
                                    >
                                      {savingStudent === student.student_id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <Save className="h-3 w-3" />
                                      )}
                                      Save
                                    </button>
                                    
                                    <button
                                      onClick={cancelEditing}
                                      className="flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
                                      title="Cancel editing"
                                    >
                                      <Ban className="h-3 w-3" />
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  // Edit/Delete buttons for active students
                                  <>
                                    <button
                                      onClick={() => startEditing(student)}
                                      className="flex items-center gap-1 px-2 py-1 bg-[#f5c034] hover:bg-yellow-500 text-gray-900 rounded text-xs font-medium transition-colors"
                                      title="Edit student"
                                    >
                                      <Edit className="h-3 w-3" />
                                      Edit
                                    </button>
                                    
                                    <button
                                      onClick={() => softDeleteStudent(student.student_id)}
                                      disabled={deletingStudent === student.student_id}
                                      className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                                      title="Remove student from course"
                                    >
                                      {deletingStudent === student.student_id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                      Remove
                                    </button>
                                  </>
                                )}
                              </div>
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

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-1 border-t border-gray-200">
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
"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

interface AddStudentProps {
  onSearchChange?: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

interface StudentFormData {
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  enrolled_course: string;
}

export default function AddStudent({
  onSearchChange,
  placeholder = "Add Student",
  className = "",
}: AddStudentProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    student_id: '',
    first_name: '',
    last_name: '',
    program: '',
    enrolled_course: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

    // Replace with your Laravel backend URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert student_id to integer for API
      const submitData = {
        ...formData,
        student_id: parseInt(formData.student_id)
      };

      // Make API call to your Laravel backend
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success - reset form and close popup
        setFormData({
          student_id: '',
          first_name: '',
          last_name: '',
          program: '',
          enrolled_course: ''
        });
        setIsPopupOpen(false);
        
        alert('Student added successfully!');
        
      } else {
        // Handle validation errors or other errors
        if (result.errors) {
          // Display validation errors
          const errorMessages = Object.values(result.errors).flat().join('\n');
          alert(`Validation errors:\n${errorMessages}`);
        } else {
          alert(result.message || 'Failed to add student');
        }
      }
      
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      student_id: '',
      first_name: '',
      last_name: '',
      program: '',
      enrolled_course: ''
    });
    setIsPopupOpen(false);
  };

  return (
    <div className={className}>
      <Button 
        onClick={() => setIsPopupOpen(true)}
        className="bg-[#017638] hover:bg-[#015a2b] text-white"
      >
        Add Student
      </Button>

      {/* Popup Overlay */}
      {isPopupOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Student ID */}
                <div>
                  <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    id="student_id"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student ID number"
                  />
                </div>

                {/* First Name */}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                </div>

                {/* Program */}
                <div>
                  <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">
                    Program
                  </label>
                  <input
                    type="text"
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange} 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Program"
                  />
                </div>

                {/* Enrolled Course */}
                <div>
                  <label htmlFor="enrolled_course" className="block text-sm font-medium text-gray-700 mb-1">
                    Enrolled Course
                  </label>
                  <select
                    id="enrolled_course"
                    name="enrolled_course"
                    value={formData.enrolled_course}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a course</option>
                    <option value="CS049">CS049</option>
                    <option value="CS050">CS050</option>
                    <option value="CS051">CS051</option>
                    <option value="CS052">CS052</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#017638] hover:bg-[#015a2b] text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Confirm'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
"use client";

import type React from "react";

import { LogOut, Upload, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";

interface CourseNavbarProps {
  instructorName?: string;
}

export default function CourseNavBar({
  instructorName = "Bea Belle Therese Caños",
}: CourseNavbarProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (E: React.ChangeEvent<HTMLInputElement>) => {
    const file = E.target.files?.[0];
    if (file) {
      setIsUploading(true);
      //this part is only stimulation part only for now huehue
      setTimeout(() => {
        setIsUploading(false);
        alert(`File "${file.name}" uploaded successfully!`);
      }, 1500);
    }
  };

  const handleLogout = () => {
    //no logout logic yet for now huehue
    alert("Logging out");
  };

  return (
    <nav className="bg-[#017638] border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">
              Hi, <span className="text-white font-bold">{instructorName}</span>
              !
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/coursePage" passHref>
              <Button className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#e0e0e0] text-black">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#e0e0e0] text-black"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload Class List</span>
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Class List</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <p className="text-sm text-muted-foreground">
                        Uploading...
                      </p>
                    )}
                  </div>
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

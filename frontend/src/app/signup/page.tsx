"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "../../components/ui/separator";

export default function Signup() {
  const [form, setForm] = useState({
    teacher_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/instructor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: form.teacher_id,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
       
          const errorMessages = Object.values(data.errors).flat();
          setError(errorMessages.join(", "));
        } else {
          setError(data.message || "Signup failed");
        }
      } else {
        setSuccess("Signup successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1200);
      }
    } catch (err) {
      setError("Network error: Could not connect to backend. Is it running on http://localhost:8000?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Green Header */}
      <header className="w-full bg-green-900 h-10" />

      {/* Main Content */}
      <main className="flex-1 bg-[#fcfcfcfc] flex flex-col md:flex-row">
        {/* Left side - Logo */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <img
            src="/Images/CPE_Logo-1.png"
            alt="Logo"
            className="w-2/3 max-w-xs md:max-w-sm bg-transparent opacity-70"
          />
        </div>

        {/* Right side - Signup Card */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <Card className="w-full max-w-md shadow-xl p-7">
            <CardHeader className="pb-8">
              <CardTitle className="text-[18px] text-left pt-5 font-bold">
                SIGNUP
              </CardTitle>
              <Separator className="my-2" />
            </CardHeader>
            <CardContent className="space-y-5 -mt-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  type="text"
                  name="teacher_id"
                  placeholder="ID Number"
                  value={form.teacher_id}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {error && <div className="text-red-600 text-sm">{error}</div>}
                {success && <div className="text-green-700 text-sm">{success}</div>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg mt-4 w-full bg-black text-white border border-transparent hover:bg-white hover:text-black hover:border-black transition-colors duration-200"
                >
                  {loading ? "Signing up..." : "Signup"}
                </Button>
              </form>
              <p className="text-center text-sm pt-6">
                You already have an account?{" "}
                <Link href="/login" passHref className="text-green-900">
                  Log in.
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Green Footer */}
      <footer className="w-full bg-green-900 h-10" />
    </div>
  );
}
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import { Separator } from "../../components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
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
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/instructor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
      } else {
        // Store token in localStorage for authentication
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          router.push("/coursePage"); // Redirect to /coursePage after login
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

      <header className="w-full bg-green-900 h-10" />


      <main className="flex-1 bg-[#fcfcfcfc] flex flex-col md:flex-row">

        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <img
            src="/Images/CPE_Logo-1.png"
            alt="Logo"
            className="w-2/3 max-w-xs md:max-w-sm bg-transparent opacity-70"
          />
        </div>

        {/* Right side - Login Card */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <Card className="w-full max-w-md shadow-xl p-7">
            <CardHeader className="pb-8">
              <CardTitle className="text-[18px] text-left pt-5 font-bold">
                LOGIN
              </CardTitle>
              <Separator className="my-2" />
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="focus:border-black focus:outline-black focus:ring-2 focus:ring-black"
                />
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
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
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
              <p className="text-center text-sm pt-6 mt-6">
                Don't have an account yet?{" "}
                <Link href="/signup" className="text-green-900">
                  Create one.
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
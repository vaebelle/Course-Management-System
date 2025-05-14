import { CourseCards } from "../coursePage/_components/courseCards";
import Link from "next/link";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import { Separator } from "../../components/ui/separator";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Signup() {
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

        {/* Right side - Login Card */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <Card className="w-full max-w-md shadow-xl p-7">
            <CardHeader className="pb-8">
              <CardTitle className="text-[18px] text-left pt-5 font-bold">SIGNUP</CardTitle>
              <Separator className="my-2" />
            </CardHeader>
            <CardContent className="space-y-5 -mt-8">
                <Input type="email" placeholder="Name"/>
                <Input type="email" placeholder="Email"/>
                <Input type="password" placeholder="Password" />
                <Input type="password" placeholder="Confirm password" />
                <Button className="rounded-lg mt-4 w-full bg-black text-white border border-transparent hover:bg-white hover:text-black hover:border-black transition-colors duration-200">
                    Signup
                </Button>
              <p className="text-center text-sm pt-6 mt-6">
                You already have an account?{" "}
                <Link href="/" className="text-green-900">
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

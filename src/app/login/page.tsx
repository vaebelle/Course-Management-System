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

export default function Login() {
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
              <CardTitle className="text-[18px] text-left pt-5 font-bold">LOGIN</CardTitle>
              <Separator className="my-2" />
            </CardHeader>
            <CardContent className="space-y-5">
              <Input
                type="email"
                placeholder="Email"
                className="focus:border-black focus:outline-black focus:ring-2 focus:ring-black"
              />
              <Input type="password" placeholder="Password" />
              <Button className="rounded-lg mt-4 w-full bg-black text-white border border-transparent hover:bg-white hover:text-black hover:border-black transition-colors duration-200">
                Login
              </Button>
              <p className="text-center text-sm pt-6 mt-6">
                Don’t have an account yet?{" "}
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

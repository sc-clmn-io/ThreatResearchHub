import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import LabEnvironmentGenerator from "@/components/lab-environment-generator";

export default function LabEnvironmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lab Environment Generator</h1>
            <p className="text-gray-600">Generate complete testing environments for threat scenarios</p>
          </div>
        </div>

        {/* Lab Environment Generator */}
        <LabEnvironmentGenerator />
      </div>
    </div>
  );
}
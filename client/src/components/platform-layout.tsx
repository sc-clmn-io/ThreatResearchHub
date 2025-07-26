import { ReactNode } from "react";
import MainNavigation from "./main-navigation";

interface PlatformLayoutProps {
  children: ReactNode;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <MainNavigation />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
import { useState } from "react";
import UserGuide from "@/components/user-guide";
import InteractiveTutorial from "@/components/interactive-tutorial";

export default function UserGuidePage() {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <UserGuide onStartTutorial={() => setShowTutorial(true)} />
      
      <InteractiveTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        tutorialType="full-workflow"
      />
    </div>
  );
}
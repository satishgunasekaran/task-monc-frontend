import React from "react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export default function CtaGithub() {
  return (
    <Button variant="outline" size="sm" asChild>
      <a
        href="https://github.com/satishgunasekaran/task-monc-frontend"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <Github className="h-4 w-4" />
        <span className="hidden sm:inline">Star on GitHub</span>
      </a>
    </Button>
  );
}

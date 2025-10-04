import { CheckCircle2 } from "lucide-react";

interface Step {
  title: string;
  description: string;
}

interface InstallationStepsProps {
  steps: Step[];
}

export function InstallationSteps({ steps }: InstallationStepsProps) {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className="w-0.5 h-full min-h-[40px] bg-border mt-2" />
            )}
          </div>
          <div className="flex-1 pb-8">
            <h4 className="font-semibold mb-2">{step.title}</h4>
            <p className="text-muted-foreground text-sm">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

import { Loader2 } from "lucide-react";

 function Loading({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`h-6 w-6 animate-spin ${className}`} />
    </div>
  );
}

export default Loading;
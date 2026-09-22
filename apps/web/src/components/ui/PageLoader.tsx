import React from "react";

export const PageLoader: React.FC = () => {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">Loading workspace…</p>
    </div>
  );
};

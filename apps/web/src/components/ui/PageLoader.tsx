import React from "react";

export const PageLoader: React.FC = () => {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center">
        {/* Outer subtle spinning ring */}
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
        {/* Inner static dot */}
        <div className="absolute w-3 h-3 rounded-full bg-blue-600" />
      </div>
      <p className="mt-3 text- xs font-medium text-slate-400 animate-pulse">
        Loading...
      </p>
    </div>
  );
};

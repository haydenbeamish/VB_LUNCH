import { useNavigate } from "react-router-dom";
import { MapPinOff } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
        <MapPinOff className="w-7 h-7 text-zinc-400" />
      </div>
      <h2 className="text-lg font-bold text-zinc-800 mb-1">You've gone walkabout</h2>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">
        This page doesn't exist, mate. Reckon you took a wrong turn.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold active:scale-95 transition-transform"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

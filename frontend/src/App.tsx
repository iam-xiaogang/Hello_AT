import { Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import Welcome from "./pages/Welcome";
import { tools } from "./tools/registry";
import { ErrorBoundary } from "./components/ErrorBoundary";

/** 懒加载工具组件时的加载占位 */
function ToolFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="flex items-center gap-2.5 text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        <span className="text-sm">加载中……</span>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Welcome />} />
        {tools.map(({ meta, Component }) => (
          <Route
            key={meta.id}
            path={meta.path}
            element={
              <ErrorBoundary key={location.pathname}>
                <Suspense fallback={<ToolFallback />}>
                  <Component />
                </Suspense>
              </ErrorBoundary>
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

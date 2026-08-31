import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** 工具级错误边界：单个工具崩溃时显示友好提示，而不是整个应用白屏。 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("工具运行时错误:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <span className="text-4xl" role="img" aria-label="出错">😵</span>
          <p className="font-semibold text-slate-700">这个工具出错了</p>
          <p className="max-w-md break-all text-sm text-slate-500">{this.state.error.message}</p>
          <div className="flex gap-2">
            <button className="btn" onClick={() => this.setState({ error: null })}>
              重试
            </button>
            <a className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50" href="/">
              回到首页
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

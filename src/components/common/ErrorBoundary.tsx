import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ProLink ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      localStorage.removeItem('prolink_cached_posts');
      localStorage.removeItem('prolink_cached_jobs');
    } catch {}
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6" dir="rtl">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-400">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-xl font-black text-white mb-2">حدث خطأ غير متوقع</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              تم حماية جلستك بنجاح لمنع توقف التطبيق. يمكنك إعادة تحميل الصفحة للعودة للعمل فوراً.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30"
              >
                <RefreshCw size={15} />
                <span>إعادة تحميل التطبيق 🔄</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-700"
              >
                <Home size={15} />
                <span>المحاولة مجدداً</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

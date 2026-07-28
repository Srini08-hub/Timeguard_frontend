import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-white to-blue-100 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(91,196,221,0.38)_0%,rgba(143,205,245,0.3)_34%,rgba(255,255,255,0.86)_72%)]" />
      <div className="absolute -left-24 top-0 h-[46vh] w-[66vw] bg-sky-200/45 [clip-path:polygon(0_0,100%_0,70%_100%,0_62%)]" />
      <div className="absolute right-0 top-0 h-[47vh] w-[42vw] bg-blue-200/45 [clip-path:polygon(28%_0,100%_0,100%_55%,0_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[56vh] bg-white/70 [clip-path:polygon(0_28%,52%_0,100%_24%,100%_100%,0_100%)]" />

      <div className="relative z-10 flex w-full max-w-[430px] flex-col rounded-lg border border-white/70 bg-white/[0.58] px-10 pb-9 pt-8 shadow-2xl shadow-slate-900/[0.12] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 text-blue-500 drop-shadow-sm">
            <Shield className="h-10 w-10 fill-blue-100 stroke-[1.9]" />
          </div>
          <h2 className="text-2xl font-bold leading-tight text-slate-800">
            Welcome to TimeGuard
          </h2>
          <p className="mt-2 max-w-[260px] text-xs font-medium leading-relaxed text-slate-600">
            Please authenticate to access the administration and control panels.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};

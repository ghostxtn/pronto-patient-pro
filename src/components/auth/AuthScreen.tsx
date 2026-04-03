import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface AuthScreenProps {
  children: ReactNode;
}

export default function AuthScreen({ children }: AuthScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen flex"
    >
      <div
        className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #c8e6f5 0%, #b5d1cc 40%, #9ecfbd 100%)",
        }}
      >
        <div className="absolute left-[-5rem] top-[-4rem] h-64 w-64 rounded-full bg-[#4f8fe6] opacity-20 blur-[80px]" />
        <div className="absolute bottom-[-5rem] right-[-4rem] h-72 w-72 rounded-full bg-[#236a53] opacity-15 blur-[90px]" />
        <div className="relative z-10 w-full max-w-xl px-10">
          <div className="rounded-3xl border border-white/40 bg-white/20 p-10 backdrop-blur-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/50 bg-white/30 px-4 py-1.5">
              <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" className="h-9 w-9">
                <rect x="0" y="13" width="44" height="18" rx="9" fill="#65a98f" />
                <rect x="13" y="0" width="18" height="22" rx="9" fill="#4f8fe6" />
                <rect x="13" y="22" width="18" height="22" rx="9" fill="#4f8fe6" />
              </svg>
              <span className="font-medium tracking-tight text-[#081e2a]" style={{ fontFamily: "Manrope, sans-serif" }}>
                Pronto Klinik
              </span>
            </div>

            <div className="mt-8 space-y-3">
              <h2
                className="text-2xl font-light tracking-tight text-[#081e2a]"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Saginiz, <strong className="font-semibold text-[#005cae]">onceligimiz.</strong>
              </h2>
              <p className="text-sm text-[#3a5a6a]">
                Modern klinik yonetimi ile randevularinizi kolayca planlayin.
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              {[
                ["2.4k+", "Hasta"],
                ["98%", "Memnuniyet"],
                ["7/24", "Destek"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="flex-1 rounded-2xl border border-white/35 bg-white/25 p-3 text-center"
                >
                  <div
                    className="text-lg font-semibold text-[#081e2a]"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {value}
                  </div>
                  <div className="text-[11px] text-[#3a5a6a]">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#f4f8fd] p-4 md:p-8 lg:p-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-4 flex items-center justify-between">
            <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-[#5a7a8a] hover:text-[#1a2e3b]">
              <ArrowLeft className="h-4 w-4" />
              Girise don
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="w-full rounded-2xl bg-white p-6 shadow-[0_20px_40px_rgba(8,30,42,0.07)] md:p-10">
            <div className="mb-8 flex items-center gap-3">
              <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" className="h-11 w-11">
                <rect x="0" y="13" width="44" height="18" rx="9" fill="#65a98f" />
                <rect x="13" y="0" width="18" height="22" rx="9" fill="#4f8fe6" />
                <rect x="13" y="22" width="18" height="22" rx="9" fill="#4f8fe6" />
              </svg>
              <span
                className="text-[15px] font-light tracking-tight text-[#081e2a]"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Pronto Klinik
              </span>
            </div>

            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Layers3,
  Workflow,
} from "lucide-react";

export default function SplashPage() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setLeaving(true);
    }, 3200);

    const redirectTimer = window.setTimeout(() => {
      sessionStorage.setItem("wms_splash_seen", "true");
      navigate("/login", { replace: true });
    }, 3900);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.7 }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071126]"
    >
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="/media/wms-intro.mp4"
          type="video/mp4"
        />
      </video>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-[#071126]/65" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,12,30,0.35)_45%,rgba(5,12,30,0.92)_100%)]" />

      {/* Moving glow blobs */}
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-[12%] top-[15%] h-72 w-72 rounded-full bg-blue-500/20 blur-[110px]"
      />

      <motion.div
        animate={{
          x: [0, -50, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[10%] right-[10%] h-80 w-80 rounded-full bg-violet-500/20 blur-[120px]"
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)",
          backgroundSize: "45px 45px",
        }}
      />

      {/* Splash card */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
          y: 35,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-10 w-[90%] max-w-xl"
      >
        {/* Glow behind card */}
        <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-400/30 blur-xl" />

        <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-white/[0.07] px-8 py-10 shadow-2xl backdrop-blur-2xl md:px-12 md:py-12">
          {/* top shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

          {/* icon */}
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{
              delay: 0.25,
              duration: 0.6,
            }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-xl"
          >
            <Workflow
              size={30}
              className="text-blue-300"
            />
          </motion.div>

          {/* WMS */}
          <div className="mt-6 text-center">
            <div className="flex justify-center gap-1">
              {["W", "M", "S"].map((letter, index) => (
                <motion.span
                  key={letter}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.35 + index * 0.12,
                  }}
                  className="text-6xl font-black tracking-tight text-white md:text-7xl"
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="mt-3 text-sm tracking-[0.28em] text-slate-300 uppercase"
            >
              Workflow Management Suite
            </motion.p>
          </div>

          {/* small feature chips */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
              <Layers3 size={14} />
              Organize
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
              <Activity size={14} />
              Track
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
              <CheckCircle2 size={14} />
              Complete
            </div>
          </motion.div>

          {/* Progress */}
          <div className="mt-10">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 3.4,
                  ease: "linear",
                }}
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400"
              />
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              Preparing your workspace...
            </p>
          </div>
        </div>
      </motion.div>

      {/* bottom text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 text-xs tracking-wide text-white/35"
      >
        Secure · Structured · Efficient
      </motion.p>
    </motion.div>
  );
}
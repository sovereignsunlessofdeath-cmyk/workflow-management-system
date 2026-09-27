import { motion } from "framer-motion";
import type { ReactNode } from "react";

import SystemStory from "./SystemStory";

type AuthShellProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthShell({
  title = "WMS",
  subtitle = "Workflow Management Suite",
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071126]">
      {/* Moving background */}
<motion.div
  initial={{
    scale: 1.05,
    x: 0,
    y: 0,
  }}
  animate={{
    scale: [1.05, 1.1, 1.05],
    x: [0, -20, 0],
    y: [0, -10, 0],
  }}
  transition={{
    duration: 18,
    repeat: Infinity,
    ease: "easeInOut",
  }}
  className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.22),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.18),transparent_38%),linear-gradient(135deg,#071126,#0b1733,#071126)]"
/>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#071126]/72" />

      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_38%)]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[44%_56%]">
        {/* Left */}
        <div className="hidden p-14 text-white lg:flex lg:flex-col">
          <div>
            <motion.h1
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
              }}
              className="text-5xl font-bold tracking-tight"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
                delay: 0.1,
              }}
              className="mt-3 text-slate-300"
            >
              {subtitle}
            </motion.p>
          </div>

          <div className="flex flex-1 items-center">
            <SystemStory />
          </div>

          <p className="text-xs tracking-wide text-slate-500">
            Plan · Assign · Track · Approve · Audit
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center justify-center px-5 py-10 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
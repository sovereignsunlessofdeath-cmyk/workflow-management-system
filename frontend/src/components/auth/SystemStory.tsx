import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  BellRing,
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const stories = [
  {
    number: "01",
    eyebrow: "Workflow Management",
    title: "Organize work from start to finish.",
    description:
      "Create structured workflows that keep every process clear, connected and easy to follow.",
    icon: Workflow,
    accent: "text-blue-300",
    glow: "bg-blue-500/20",
  },
  {
    number: "02",
    eyebrow: "Task Management",
    title: "Turn workflows into actionable tasks.",
    description:
      "Assign responsibilities, monitor progress and keep work moving through every stage.",
    icon: ClipboardList,
    accent: "text-cyan-300",
    glow: "bg-cyan-500/20",
  },
  {
    number: "03",
    eyebrow: "Approvals",
    title: "Move decisions forward with clarity.",
    description:
      "Route work to the right people for review and keep approval decisions connected to the process.",
    icon: CheckCircle2,
    accent: "text-violet-300",
    glow: "bg-violet-500/20",
  },
  {
    number: "04",
    eyebrow: "Collaboration",
    title: "Keep conversations close to the work.",
    description:
      "Communicate in real time and keep teams connected while work progresses across the system.",
    icon: MessageSquareText,
    accent: "text-indigo-300",
    glow: "bg-indigo-500/20",
  },
  {
    number: "05",
    eyebrow: "Real-Time Updates",
    title: "Know when something changes.",
    description:
      "Receive live updates for important workflow, task and approval activity without constantly refreshing.",
    icon: BellRing,
    accent: "text-sky-300",
    glow: "bg-sky-500/20",
  },
  {
    number: "06",
    eyebrow: "Accountability",
    title: "Keep every important action traceable.",
    description:
      "Maintain visibility across activity and changes so teams can understand what happened and when.",
    icon: ShieldCheck,
    accent: "text-emerald-300",
    glow: "bg-emerald-500/20",
  },
];

export default function SystemStory() {
  const [activeIndex, setActiveIndex] =
    useState(0);

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        setActiveIndex((current) =>
          current ===
          stories.length - 1
            ? 0
            : current + 1,
        );
      }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const story =
    stories[activeIndex];

  const Icon = story.icon;

  return (
    <div className="relative w-full max-w-md">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{
            opacity: 0,
            y: 28,
            filter: "blur(8px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
          }}
          exit={{
            opacity: 0,
            y: -22,
            filter: "blur(8px)",
          }}
          transition={{
            duration: 0.7,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold tracking-[0.28em] ${story.accent}`}
            >
              {story.number}
            </span>

            <div className="h-px w-10 bg-white/20" />

            <span
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${story.accent}`}
            >
              {story.eyebrow}
            </span>
          </div>

          <div className="relative mt-8 inline-flex">
            <motion.div
              initial={{
                scale: 0.7,
                rotate: -8,
              }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              transition={{
                duration: 0.7,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl"
            >
              <Icon
                size={28}
                className={
                  story.accent
                }
              />
            </motion.div>

            <motion.div
              animate={{
                scale: [
                  1,
                  1.35,
                  1,
                ],
                opacity: [
                  0.45,
                  0.15,
                  0.45,
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute inset-0 rounded-2xl blur-xl ${story.glow}`}
            />
          </div>

          <motion.h2
            initial={{
              opacity: 0,
              x: -18,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.12,
            }}
            className="mt-7 max-w-sm text-3xl font-bold leading-tight text-white"
          >
            {story.title}
          </motion.h2>

          <motion.p
            initial={{
              opacity: 0,
              x: -18,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.2,
            }}
            className="mt-4 max-w-sm text-sm leading-7 text-slate-400"
          >
            {story.description}
          </motion.p>

          <div className="mt-9">
            <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                key={`progress-${activeIndex}`}
                initial={{
                  width: "0%",
                }}
                animate={{
                  width: "100%",
                }}
                transition={{
                  duration: 5,
                  ease: "linear",
                }}
                className="h-full bg-linear-to-r from-blue-400 via-violet-400 to-cyan-300"
              />
            </div>

            <div className="mt-4 flex gap-2">
              {stories.map(
                (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setActiveIndex(
                        index,
                      )
                    }
                    aria-label={`Show information ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index ===
                      activeIndex
                        ? "w-7 bg-blue-300"
                        : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ),
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
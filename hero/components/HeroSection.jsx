"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

// ─── Frame config ────────────────────────────────────────────────────────────
const TOTAL_FRAMES = 192;
const FPS = 25; // ~40ms per frame
const FRAME_INTERVAL = 1000 / FPS;

function getFrameSrc(index) {
  // Build filename from index, handling the known delay variants
  const padded = String(index).padStart(3, "0");
  // Most frames are 0.04s; a handful are 0.05s — we'll try both
  return `/frames/frame_${padded}_delay-0.04s.webp`;
}

// ─── Bullet points ───────────────────────────────────────────────────────────
const bullets = [
  "Heat in 3 seconds",
  "Wireless freedom",
  "3 temp levels",
  "30-Day Guarantee",
];

// ─── Headline words ──────────────────────────────────────────────────────────
const headlineWords = ["Feel", "the", "Relief.", "Instantly."];

// ─── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const bulletContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.9,
    },
  },
};

const bulletVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const ctaVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: 1.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function HeroSection() {
  const imgRef = useRef(null);
  const sectionRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const currentFrameRef = useRef(0);
  const imagesRef = useRef([]);
  const [loaded, setLoaded] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // Scroll progress for scrubbing (sticky section covers 100vh + 200vh spacer)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
  });

  // ── Preload all frames ──
  useEffect(() => {
    let loadedCount = 0;
    imagesRef.current = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) setLoaded(true);
      };
      img.onerror = () => {
        // Try alternate delay suffix
        const padded = String(i).padStart(3, "0");
        img.src = `/frames/frame_${padded}_delay-0.05s.webp`;
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) setLoaded(true);
      };
      imagesRef.current[i] = img;
    }
  }, []);

  // ── RAF loop for free-play ──
  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;

      if (delta >= FRAME_INTERVAL) {
        lastTimeRef.current = timestamp;
        currentFrameRef.current = (currentFrameRef.current + 1) % TOTAL_FRAMES;
        if (imgRef.current && imagesRef.current[currentFrameRef.current]) {
          imgRef.current.src = imagesRef.current[currentFrameRef.current].src;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    }
  }, []);

  // ── Start loop once loaded ──
  useEffect(() => {
    if (!loaded) return;
    startLoop();
    return () => stopLoop();
  }, [loaded, startLoop, stopLoop]);

  // ── Scroll scrubbing ──
  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (v) => {
      if (v <= 0.01) return; // don't scrub at top — let loop play

      // Detect scroll
      setIsScrolling(true);
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 300);

      if (v > 0.01) {
        stopLoop();
        const frameIndex = Math.min(
          Math.floor(v * TOTAL_FRAMES),
          TOTAL_FRAMES - 1
        );
        currentFrameRef.current = frameIndex;
        if (imgRef.current && imagesRef.current[frameIndex]) {
          imgRef.current.src = imagesRef.current[frameIndex].src;
        }
      }
    });

    return () => unsubscribe();
  }, [smoothProgress, stopLoop, startLoop]);

  // Resume loop when scroll stops and we're at top
  useEffect(() => {
    if (!isScrolling && loaded) {
      const currentProgress = scrollYProgress.get();
      if (currentProgress <= 0.02) {
        startLoop();
      }
    }
  }, [isScrolling, loaded, scrollYProgress, startLoop]);

  return (
    <section
      ref={sectionRef}
      style={{ height: "300vh", background: "#0a0a0a" }}
    >
      {/* Sticky viewport */}
      <div
        className="sticky top-0 w-full overflow-hidden flex items-center justify-center"
        style={{ height: "100vh" }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 70% 50%, rgba(249,165,201,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Content grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">

          {/* ── LEFT: Text ── */}
          <div className="flex-1 flex flex-col items-start gap-6 md:gap-8 max-w-xl">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-2"
            >
              <span
                className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full border"
                style={{
                  color: "#f9a5c9",
                  borderColor: "rgba(249,165,201,0.35)",
                  background: "rgba(249,165,201,0.06)",
                }}
              >
                Heat Therapy Reimagined
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-black leading-none tracking-tight"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {headlineWords.map((word, i) => (
                <motion.span
                  key={i}
                  variants={wordVariants}
                  className="inline-block mr-4"
                  style={{
                    color: word === "Relief." ? "#f9a5c9" : "#ffffff",
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            {/* Bullets */}
            <motion.ul
              className="flex flex-col gap-3"
              variants={bulletContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {bullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  variants={bulletVariants}
                  className="flex items-center gap-3 text-base md:text-lg font-medium"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0"
                    style={{
                      background: "rgba(249,165,201,0.15)",
                      color: "#f9a5c9",
                    }}
                  >
                    ✓
                  </span>
                  {bullet}
                </motion.li>
              ))}
            </motion.ul>

            {/* CTA */}
            <motion.div variants={ctaVariants} initial="hidden" animate="visible">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="relative px-8 py-4 rounded-full text-base font-bold tracking-wide cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, #f9a5c9 0%, #f472b6 100%)",
                  color: "#0a0a0a",
                  boxShadow:
                    "0 0 32px rgba(249,165,201,0.45), 0 4px 16px rgba(249,165,201,0.25)",
                  border: "none",
                }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(249,165,201,0.3)",
                      "0 0 45px rgba(249,165,201,0.6)",
                      "0 0 20px rgba(249,165,201,0.3)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                Shop Now — Free Shipping
              </motion.button>
            </motion.div>
          </div>

          {/* ── RIGHT: Product animation ── */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Glow behind product */}
            <div
              className="absolute rounded-full blur-3xl pointer-events-none"
              style={{
                width: "420px",
                height: "420px",
                background: "radial-gradient(circle, rgba(249,165,201,0.18) 0%, transparent 70%)",
              }}
            />

            {/* Loading shimmer */}
            {!loaded && (
              <div
                className="w-72 h-72 md:w-96 md:h-96 rounded-2xl animate-pulse"
                style={{ background: "rgba(249,165,201,0.08)" }}
              />
            )}

            {/* Frame image */}
            <img
              ref={imgRef}
              src={getFrameSrc(0)}
              alt="Volenu heat therapy device"
              className="relative z-10 select-none"
              draggable={false}
              style={{
                width: "clamp(280px, 40vw, 520px)",
                height: "auto",
                opacity: loaded ? 1 : 0,
                transition: "opacity 0.4s ease",
                filter: "drop-shadow(0 20px 60px rgba(249,165,201,0.2))",
              }}
            />

            {/* Scroll hint */}
            <motion.div
              className="absolute bottom-[-2rem] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              <span
                className="text-xs tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Scroll to explore
              </span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ color: "#f9a5c9", fontSize: "18px" }}
              >
                ↓
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

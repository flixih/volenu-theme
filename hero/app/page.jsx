import HeroSection from "../components/HeroSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      {/* Spacer so scroll-scrub has room */}
      <div style={{ height: "200vh", background: "#0a0a0a" }} />
    </main>
  );
}

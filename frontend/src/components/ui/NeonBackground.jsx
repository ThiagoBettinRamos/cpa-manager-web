import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function NeonBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(() => ({
    background: {
      color: { value: "#020617" }, // Fundo Slate-950
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "grab", // Faz as linhas conectarem ao rato
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 180,
          links: { opacity: 0.6 },
        },
      },
    },
    particles: {
      color: { value: "#d946ef" }, // Cor Fuchsia-500
      links: {
        color: "#d946ef",
        distance: 150,
        enable: true,
        opacity: 0.15,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.8,
        direction: "none",
        outModes: { default: "out" },
      },
      number: {
        density: { enable: true, area: 800 },
        value: 100,
      },
      opacity: {
        value: 0.3,
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 2 },
      },
    },
    detectRetina: true,
  }), []);

  if (init) {
    return (
      <Particles
        id="tsparticles"
        options={options}
        className="fixed top-0 left-0 w-full h-full -z-10"
      />
    );
  }

  return <div className="fixed top-0 left-0 w-full h-full -z-10 bg-slate-950" />;
}
"use client";

import { useState } from "react";
import { Plus, Minus, Globe, Heart, FileText, GraduationCap, Network } from "lucide-react";


const items = [
  {
    icon: Globe,
    title: "Action-Oriented, End-to-End Training",
    content:
      "We don’t just teach theory; we bridge the gap between education and industry. Our Academy offers a complete journey—from initial product analysis and Design for Manufacturing (DFM) to final tooling design—structured around real-world case studies that prepare you for complex, professional workflows.",
  },
  {
    icon: Heart,
    title: "Ready-to-Use Professional Assets",
    content:
      "Accelerate your project timelines with our extensive Library. We provide downloadable 3D native CAD designs based on successful case studies. By integrating these precision-engineered assets into your system, you reduce development time and ensure superior accuracy from day one.",
  },
  {
    icon: FileText,
    title: "Expert Knowledge for Every Career Stage",
    content:
      "Whether you are a recent graduate or a seasoned professional, our Blog and Academy provide updated, expert-written content. We help you stay ahead of industry standards with tutorials that range from fundamental design principles to the latest advanced manufacturing innovations.",
  },
  {
    icon: GraduationCap,
    title: "A Verified Global Supplier Network",
    content:
      "Eliminate the guesswork in procurement. Our comprehensive database gives you access to verified global suppliers, from toolmakers to software providers. Expertly organized by location and specialization, our directory is designed to help you find the right partners with speed and confidence.",
  },
  {
    icon: Network,
    title: "Your Connection to the Global Industry",
    content:
      "Stay at the forefront of the field with our dedicated Events Calendar. We curate the most relevant international trade shows, summits, and workshops, ensuring you never miss an opportunity to network, discover new technologies, and grow your professional circle.",
  },
];

export default function HomeAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-zinc-200 border-y border-zinc-200">
      {items.map((item, i) => {
        const Icon = item.icon;
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="shrink-0 text-primary" />
                <span className="text-sm font-medium text-zinc-800">{item.title}</span>
              </div>
              {isOpen ? (
                <Minus size={16} className="shrink-0 text-zinc-400" />
              ) : (
                <Plus size={16} className="shrink-0 text-zinc-400" />
              )}
            </button>
            {isOpen && (
              <p className="pb-5 pl-9 text-sm text-zinc-500 leading-relaxed">{item.content}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

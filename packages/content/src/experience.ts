import type { Education, Experience } from "./types";

export const experience: Experience[] = [
  {
    id: "tamilarasi-full-stack",
    role: "Full Stack Developer",
    company: "Tamilarasi Technologies Pvt Ltd",
    location: "Chennai, India",
    start: "2024-10",
    end: null,
    highlights: [
      "Build features end to end across four live SaaS products: data models, Node.js APIs, React Native, Flutter and web front ends, and deployment.",
      "Work on Razorpay payment flows: orders, signature-verified webhooks, per-card billing and payment fixes.",
      "Build generative AI features with Google Gemini: content suggestions and scanning paper visiting cards into digital cards.",
      "Trace production defects from logs to root cause and verify each fix against existing business rules.",
    ],
  },
];

export const education: Education[] = [
  {
    degree: "Bachelor of Engineering (B.E.)",
    field: "Mechatronics Engineering",
    institution: "Nehru Institute of Engineering and Technology",
    region: "India",
    startYear: 2017,
    endYear: 2021,
    cgpa: "7.25 / 10",
  },
];

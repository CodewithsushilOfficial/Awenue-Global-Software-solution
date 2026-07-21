"use client";

import React from "react";

interface TechLogoProps {
  slug?: string;
  name?: string;
  customLogo?: string;
  className?: string;
}

export const OFFICIAL_TECH_LOGOS: Record<string, { name: string; category: string; svg: React.ReactNode }> = {
  react: {
    name: "React",
    category: "Frontend",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(0 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="2" fill="#61DAFB" />
      </svg>
    ),
  },
  nextjs: {
    name: "Next.js",
    category: "Frontend",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M14.7 17.5L8.5 9.2V16H7V8h1.8l6.2 8.3V8h1.5v9.5h-1.8z" fill="#000000" />
        <path d="M15.5 8H17v4.5l-1.5-2.2V8z" fill="#FFFFFF" />
      </svg>
    ),
  },
  nodejs: {
    name: "Node.js",
    category: "Backend",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z" fill="#339933" />
        <path d="M12 4.5l6.5 3.8v7.4L12 19.5 5.5 15.7V8.3L12 4.5z" fill="#339933" />
        <path d="M12 7l4 2.3v4.4L12 16l-4-2.3V9.3L12 7z" fill="#FFFFFF" opacity="0.9" />
      </svg>
    ),
  },
  typescript: {
    name: "TypeScript",
    category: "Frontend",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <rect width="24" height="24" rx="4" fill="#3178C6" />
        <path d="M11.5 16.5h-1.8v-6.7H7.2V8.3h6.8v1.5h-2.5v6.7zm4.3.1c-1.3 0-2.3-.6-2.7-1.6l1.4-.8c.3.6.8.9 1.4.9.7 0 1.1-.3 1.1-.8 0-.4-.3-.7-1.1-.9l-.6-.2c-1.3-.4-1.9-1.1-1.9-2.1 0-1.3 1.1-2.2 2.6-2.2 1.2 0 2 .5 2.5 1.4l-1.3.8c-.3-.5-.7-.7-1.2-.7-.6 0-.9.3-.9.7 0 .4.2.6.9.8l.6.2c1.4.4 2.1 1.1 2.1 2.2 0 1.4-1.1 2.3-2.9 2.3z" fill="#FFFFFF" />
      </svg>
    ),
  },
  javascript: {
    name: "JavaScript",
    category: "Frontend",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <rect width="24" height="24" rx="4" fill="#F7DF1E" />
        <path d="M12.6 17.5c.4.8 1 1.3 2.1 1.3 1.1 0 1.8-.5 1.8-1.5 0-1-.7-1.4-1.9-1.9l-.6-.3c-1.8-.8-3-1.8-3-3.9 0-2.1 1.6-3.7 4.1-3.7 1.8 0 3 .6 3.8 2.1l-1.6 1c-.4-.7-1-1.1-2.1-1.1-1 0-1.7.5-1.7 1.2 0 .8.5 1.2 1.6 1.6l.6.3c2.1.9 3.3 1.8 3.3 4.1 0 2.4-1.8 3.9-4.4 3.9-2.4 0-3.9-1.1-4.7-2.6l1.7-1.1zM6.5 17.6c.3.5.7.9 1.4.9.7 0 1.2-.4 1.2-1.4V8.5h2.4v8.6c0 2.2-1.3 3.3-3.4 3.3-1.8 0-3-1-3.6-2.3l2-1.1z" fill="#000000" />
      </svg>
    ),
  },
  express: {
    name: "Express.js",
    category: "Backend",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
        <path d="M22 17.6l-5.6-7.3L21.7 3h-3.3l-3.8 5.6L10.8 3H4.5l6.4 8.7L4 17.6h3.4l4.4-6.3 4.7 6.3H22zM8.3 4.8h1.6l9.3 11.3h-1.6L8.3 4.8z" fill="currentColor" />
      </svg>
    ),
  },
  mongodb: {
    name: "MongoDB",
    category: "Database",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2C12 2 6.5 7.5 6.5 13.5C6.5 17.5 9 20.5 11.5 21.8V22H12.5V21.8C15 20.5 17.5 17.5 17.5 13.5C17.5 7.5 12 2 12 2ZM12 19.5C11.7 19.5 11.5 18 11.5 15.5C11.5 13 11.8 8.5 12 7.2C12.2 8.5 12.5 13 12.5 15.5C12.5 18 12.3 19.5 12 19.5Z" fill="#47A248" />
      </svg>
    ),
  },
  postgresql: {
    name: "PostgreSQL",
    category: "Database",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2C6.5 2 2 6.2 2 11.5c0 4.2 2.8 7.8 6.7 9l.3-1.8c-3-1-5.1-3.8-5.1-7.2 0-4.2 3.6-7.5 8.1-7.5s8.1 3.3 8.1 7.5c0 3.4-2.1 6.2-5.1 7.2l.3 1.8c3.9-1.2 6.7-4.8 6.7-9C22 6.2 17.5 2 12 2z" fill="#4169E1" />
        <path d="M12 6.5C9.2 6.5 7 8.5 7 11c0 1.8 1.1 3.4 2.8 4.1l.4-1.3C8.9 13.2 8.2 12.2 8.2 11c0-1.8 1.7-3.2 3.8-3.2s3.8 1.4 3.8 3.2c0 1.2-.7 2.2-2 2.8l.4 1.3c1.7-.7 2.8-2.3 2.8-4.1 0-2.5-2.2-4.5-5-4.5z" fill="#336791" />
      </svg>
    ),
  },
  firebase: {
    name: "Firebase",
    category: "Backend",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M3.8 15.5L8.2 3.2c.2-.5.9-.6 1.2-.2l3.4 5.9-12.8 6.6z" fill="#FFCA28" />
        <path d="M14.5 10.2l2.3-4.3c.3-.5 1-.5 1.3 0l2.1 9.6-5.7-5.3z" fill="#FFA000" />
        <path d="M3.8 15.5L12 22l8.2-6.5-7.4-13.8c-.3-.5-1.1-.4-1.3.1L3.8 15.5z" fill="#F57C00" />
      </svg>
    ),
  },
  prisma: {
    name: "Prisma",
    category: "Database",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
        <path d="M19.5 17.8L13.8 2.5c-.3-.8-1.4-.8-1.7 0L6.4 17.8c-.3.8.3 1.7 1.2 1.7h10.7c.9 0 1.5-.9 1.2-1.7zM12.9 5.8l3.8 10.7H13V5.8h-.1z" fill="currentColor" />
      </svg>
    ),
  },
  docker: {
    name: "Docker",
    category: "Cloud & DevOps",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M13.9 10.2h2.2v2.2h-2.2v-2.2zm-2.8 0h2.2v2.2h-2.2v-2.2zm-2.8 0h2.2v2.2H8.3v-2.2zm5.6-2.8h2.2v2.2h-2.2V7.4zm-2.8 0h2.2v2.2h-2.2V7.4zm-2.8 0h2.2v2.2H8.3V7.4zm-2.8 0h2.2v2.2H5.5V7.4zm5.6-2.8h2.2v2.2h-2.2V4.6zm-2.8 0h2.2v2.2h-2.2V4.6z" fill="#2496ED" />
        <path d="M22.5 12.3c-.6-.4-1.6-.5-2.4-.3-.4.1-.7.4-1 .7-.4-.3-1-.4-1.6-.4-1.3 0-2.4.9-2.7 2.1-.5-.1-1.1 0-1.6.3H.8c-.3 1.5.2 3.1 1.2 4.3 1.5 1.8 3.9 2.8 6.3 2.8 5.6 0 10.4-3.6 11.9-8.8.8.2 1.6-.2 2.3-.7z" fill="#2496ED" />
      </svg>
    ),
  },
  kubernetes: {
    name: "Kubernetes",
    category: "Cloud & DevOps",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2L3 6.5v11L12 22l9-4.5v-11L12 2zm0 2.3l6.7 3.3-2.5 1.5-4.2-2.5-4.2 2.5-2.5-1.5L12 4.3zm-6.8 5l2.5 1.5v4.9l-2.5 1.5V9.3zm8.3 8.4l-3.5 2-3.5-2v-3.5l3.5 2 3.5-2v3.5zm1-4.9V7.9l3.5-2 3.5 2v4.9l-3.5 2-3.5-2z" fill="#326CE5" />
      </svg>
    ),
  },
  aws: {
    name: "AWS",
    category: "Cloud & DevOps",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M6.8 12.8c-.8.5-1.4 1.1-1.4 1.9 0 1.2 1 1.9 2.4 1.9 1.4 0 2.6-.7 3.2-1.7V17h1.9v-6.2h-1.9v.9c-.6-.9-1.7-1.4-2.9-1.4-2.1 0-3.6 1.4-3.6 3.3 0 1.2.6 2.1 1.6 2.6L6.8 12.8zm2.2.8c0 1.1-.7 1.7-1.6 1.7-.8 0-1.3-.5-1.3-1.2 0-.8.6-1.3 1.5-1.6l1.4-.6v1.7z" fill="#FF9900" />
        <path d="M12 18.5c5.2 0 8.5-2.2 9.5-3.5l-1.3-1c-.8 1-3.4 2.8-8.2 2.8-3.1 0-6.1-.9-8.4-2.5l-1 1.3c2.6 1.9 6.1 2.9 9.4 2.9z" fill="#FF9900" />
        <path d="M21.5 14.8l-1.8-2.6 2.8-.5-1 3.1z" fill="#FF9900" />
      </svg>
    ),
  },
  azure: {
    name: "Microsoft Azure",
    category: "Cloud & DevOps",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M5.4 19.5h11.2l-5.1-9.3-6.1 9.3z" fill="#0078D4" />
        <path d="M13.2 3.5L7.8 12.9l3.3.9 5.5-10.3h-3.4z" fill="#5E96D8" />
        <path d="M12.2 12.3L7.4 20.5h11.2L20 16.2l-7.8-3.9z" fill="#0078D4" />
      </svg>
    ),
  },
  gcp: {
    name: "Google Cloud",
    category: "Cloud & DevOps",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M19.4 10.4c.2.8.3 1.6.3 2.5 0 4.1-2.8 7.1-7.7 7.1-4.4 0-8-3.6-8-8s3.6-8 8-8c2.2 0 4.1.8 5.5 2.1l-2.3 2.3c-.7-.6-1.8-1.2-3.2-1.2-2.7 0-4.9 2.2-4.9 4.9s2.2 4.9 4.9 4.9c2.8 0 4-1.8 4.3-3.1h-4.3v-3.5h7.4z" fill="#4285F4" />
      </svg>
    ),
  },
  flutter: {
    name: "Flutter",
    category: "AI & Mobile",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M14.3 2.5L5.7 11.1l3.5 3.5 12.1-12.1h-7z" fill="#02569B" />
        <path d="M14.3 13.9L9.2 19l3.5 3.5 5.1-5.1 3.5-3.5h-7z" fill="#0175C2" />
        <path d="M9.2 19l5.1-5.1 3.5 3.5-5.1 5.1L9.2 19z" fill="#02569B" />
        <path d="M12.7 17.5l2.6-2.6 2.6 2.6-2.6 2.6-2.6-2.6z" fill="#39CEFD" />
      </svg>
    ),
  },
  reactnative: {
    name: "React Native",
    category: "AI & Mobile",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(0 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="2.2" fill="#61DAFB" />
      </svg>
    ),
  },
  python: {
    name: "Python",
    category: "AI & Mobile",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M11.9 2c-4.4 0-4.1 1.9-4.1 1.9v2h4.2v.6H6.1S2 6.1 2 10.6s3.6 4.3 3.6 4.3h1.3v-1.8c0-2.4 2.1-2.4 2.1-2.4h3.7s2.1 0 2.1-2.1V4.1S15.4 2 11.9 2zm-1.8 1.4c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7z" fill="#3776AB" />
        <path d="M12.1 22c4.4 0 4.1-1.9 4.1-1.9v-2h-4.2v-.6h5.9s4.1.4 4.1-4.1-3.6-4.3-3.6-4.3h-1.3v1.8c0 2.4-2.1 2.4-2.1 2.4h-3.7s-2.1 0-2.1 2.1v4.4s-.6 2.2 2.9 2.2zm1.8-1.4c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z" fill="#FFD43B" />
      </svg>
    ),
  },
  openai: {
    name: "OpenAI",
    category: "AI & Mobile",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
        <path d="M22.2 9.7a5.8 5.8 0 0 0-.5-4.8 5.9 5.9 0 0 0-6.1-2.8 5.9 5.9 0 0 0-4.6-2.1 5.9 5.9 0 0 0-5.7 4A5.9 5.9 0 0 0 1.2 7a5.9 5.9 0 0 0 .8 6.7 5.8 5.8 0 0 0 .5 4.8 5.9 5.9 0 0 0 6.1 2.8 5.9 5.9 0 0 0 4.6 2.1 5.9 5.9 0 0 0 5.7-4 5.9 5.9 0 0 0 4.1-3 5.9 5.9 0 0 0-.8-6.7zM12 20a4.1 4.1 0 0 1-3.1-1.4l.1-.1 3.6-2.1a.9.9 0 0 0 .4-.7v-4.9l1.5.8a.1.1 0 0 1 .1.1v4.3A4.1 4.1 0 0 1 12 20zm-7.6-4.4a4.1 4.1 0 0 1-.5-3.3l.1.1 3.6 2.1a.9.9 0 0 0 .9 0l4.3-2.5v1.7a.1.1 0 0 1-.1.1l-3.7 2.1a4.1 4.1 0 0 1-4.6-.3zm-1-8.5a4.1 4.1 0 0 1 2.5-1.9v4.4a.9.9 0 0 0 .4.8l4.3 2.5-1.5.8a.1.1 0 0 1-.1 0L5.3 12a4.1 4.1 0 0 1-1.9-4.9zm13.1 3.2l-4.3-2.5 1.5-.8a.1.1 0 0 1 .1 0l3.7 2.1a4.1 4.1 0 0 1-.5 7.4v-4.4a.9.9 0 0 0-.5-.8zm2.1-3.6a4.1 4.1 0 0 1 .5 3.3l-.1-.1-3.6-2.1a.9.9 0 0 0-.9 0l-4.3 2.5V8.7a.1.1 0 0 1 .1-.1l3.7-2.1a4.1 4.1 0 0 1 4.6.3zM10.7 7.7a4.1 4.1 0 0 1 4.4.5l-.1.1-3.6 2.1a.9.9 0 0 0-.4.7v4.9l-1.5-.8a.1.1 0 0 1-.1-.1V11a4.1 4.1 0 0 1 1.3-3.3zm.4 3.2l1.9 1.1-1.9 1.1-1.9-1.1 1.9-1.1z" fill="currentColor" />
      </svg>
    ),
  },
  github: {
    name: "GitHub",
    category: "Cloud & DevOps",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="currentColor" />
      </svg>
    ),
  },
  tailwindcss: {
    name: "Tailwind CSS",
    category: "Frontend",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C7.666 17.818 9.027 19.2 12.001 19.2c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" fill="#06B6D4" />
      </svg>
    ),
  },
  redis: {
    name: "Redis",
    category: "Database",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M2 15.5l9.5 4.5 9.5-4.5-9.5-4.5L2 15.5z" fill="#D82C20" />
        <path d="M2 10.5l9.5 4.5 9.5-4.5-9.5-4.5L2 10.5z" fill="#DC382D" />
        <path d="M2 5.5l9.5 4.5 9.5-4.5L11.5 1 2 5.5z" fill="#E65549" />
      </svg>
    ),
  },
  socketio: {
    name: "Socket.IO",
    category: "Backend",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8.5 7.5l7 4.5-7 4.5v-9z" fill="currentColor" />
      </svg>
    ),
  },
  vercel: {
    name: "Vercel",
    category: "Cloud & DevOps",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
        <path d="M12 2L22 20H2L12 2z" fill="currentColor" />
      </svg>
    ),
  },
  nginx: {
    name: "Nginx",
    category: "Cloud & DevOps",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2L2.5 7.5v9L12 22l9.5-5.5v-9L12 2zm6 13.5l-5.3-7.5H12v7.5h-1.5V8h2.3l5.2 7.5H18v-7.5h1.5v9.5H18z" fill="#009639" />
      </svg>
    ),
  },
};

export default function TechLogo({ slug, name, customLogo, className = "w-7 h-7" }: TechLogoProps) {
  if (customLogo) {
    if (customLogo.trim().startsWith("<svg")) {
      return (
        <span
          className={`inline-block ${className} [&>svg]:w-full [&>svg]:h-full`}
          dangerouslySetInnerHTML={{ __html: customLogo }}
        />
      );
    }
    return (
      <img
        src={customLogo}
        alt={name || "Tech logo"}
        className={`${className} object-contain`}
      />
    );
  }

  // Normalize slug/name
  const normalizedKey = (slug || name || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const logoMatch =
    OFFICIAL_TECH_LOGOS[normalizedKey] ||
    Object.entries(OFFICIAL_TECH_LOGOS).find(
      ([key]) => normalizedKey.includes(key) || key.includes(normalizedKey)
    )?.[1];

  if (logoMatch) {
    return <div className={className}>{logoMatch.svg}</div>;
  }

  // Fallback icon
  return (
    <div className={`${className} rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-black`}>
      {(name || "T").substring(0, 2).toUpperCase()}
    </div>
  );
}

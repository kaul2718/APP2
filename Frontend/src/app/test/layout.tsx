// src/app/test/layout.tsx
import SessionAuthProvider from "@/context/SessionAuthProvider";
import React from "react";

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionAuthProvider>{children}</SessionAuthProvider>;
}

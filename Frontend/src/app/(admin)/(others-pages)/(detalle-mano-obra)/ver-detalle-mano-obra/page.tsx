import React from "react";
import { Metadata } from "next";
import DetalleManoObraComponent from "./ManoObraComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de modelo",
};

export default function Page() {
  return <DetalleManoObraComponent />;
}

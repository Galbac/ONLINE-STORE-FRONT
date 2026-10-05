import type { ReactNode } from "react";
import { Header } from "@/widgets/header";

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

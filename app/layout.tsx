import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "CampusFix AI - Intelligent Campus Maintenance Protocol",
    description: "AI-powered campus maintenance and issue reporting system",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} antialiased`}>
                <AuthProvider>
                    <ToastProvider>
                        <Navbar />
                        <main className="pt-16">
                            {children}
                        </main>
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}

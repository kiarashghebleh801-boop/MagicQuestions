import "./globals.css";

export const metadata = {
  title: "MagicQuestions",
  description: "Build custom past-paper practice in seconds."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

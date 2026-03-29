import "./globals.css";

export const metadata = {
  title: "Volenu — Feel the Relief. Instantly.",
  description: "Heat in 3 seconds. Wireless freedom. 3 temp levels.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

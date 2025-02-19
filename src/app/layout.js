import "./globals.css";
import Provider from "./Provider";
export const metadata = {
  title: "Open Data Hub",
  description: "Buy, Sell & Explore on the blockchain",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`antialiased dark`}>
        <Provider children={children} />
      </body>
    </html >
  );
}

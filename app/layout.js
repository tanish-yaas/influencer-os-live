import './globals.css';

export const metadata = {
  title: 'YAAS influencer OS (beta)',
  description: 'YAAS — influencer agency operating system',
  icons: {
    icon: 'https://framerusercontent.com/images/6ilTb1mEivC7MRT4niIsyIMktbs.png',
    shortcut: 'https://framerusercontent.com/images/6ilTb1mEivC7MRT4niIsyIMktbs.png',
    apple: 'https://framerusercontent.com/images/6ilTb1mEivC7MRT4niIsyIMktbs.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
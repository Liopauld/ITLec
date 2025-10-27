
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { UserProvider } from '../shared/hooks/useUser';
import Header from '../components/Header';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Header />
      <Component {...pageProps} />
    </UserProvider>
  );
}

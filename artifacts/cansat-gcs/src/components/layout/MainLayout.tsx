import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StatusBar } from './StatusBar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Sidebar />
      <Header />
      <main className="pl-48 pt-13 pb-7 h-screen overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
      <StatusBar />
    </div>
  );
}

import React from 'react';
import { SideBar } from './SideBar';
import { TopBar } from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-container">
      <SideBar />
      <main className="main-content">
        <TopBar />
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
};

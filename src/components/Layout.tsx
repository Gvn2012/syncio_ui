import React from 'react';
import { SideBar } from './SideBar';
import { TopBar } from './TopBar';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const element = useOutlet();

  return (
    <div className="app-container">
      <SideBar />
      <main className="main-content">
        <TopBar />
        <div className="page-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{ width: '100%', height: '100%' }}
            >
              {children || element}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

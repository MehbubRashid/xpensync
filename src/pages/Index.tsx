import React from 'react';
import { Header } from '@/components/Header';
import { DataVisualization } from '@/components/DataVisualization';
import { EntryList } from '@/components/EntryList';
import { EntryProvider } from '@/context/EntryContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { EvoluProvider } from '@/evolu/EvoluContext';

const Index = () => {
  return (
    <EvoluProvider>
      <CurrencyProvider>
        <EntryProvider>
          <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 pb-20">
            <div className="sm:max-w-5xl max-w-full px-[10px] sm:px-[40px] mx-auto">
              <Header />
              
              <div className="space-y-6 mt-6 animate-fade-in">            
                <DataVisualization />
                <EntryList />
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground py-3 [word-spacing:0.16rem]">
            Made with ❤️ by <a className='text-foreground' href="https://x.com/mehbubrashid" target="_blank" rel="noopener noreferrer">Mehbub Rashid</a>
          </div>
        </EntryProvider>
      </CurrencyProvider>
    </EvoluProvider>
  );
};

export default Index;

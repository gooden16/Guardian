import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const searchResults = [
    { type: 'customer', name: 'Alice Freeman', path: '/customers/1' },
    { type: 'customer', name: 'Bob Smith', path: '/customers/2' },
    { type: 'product', name: 'Premium Plan', path: '/products/1' },
    { type: 'campaign', name: 'Summer Sale', path: '/campaigns/1' },
  ].filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center w-full max-w-[200px] sm:max-w-md gap-2 px-4 h-10 text-gray-400 bg-gray-50 dark:bg-dark-hover rounded-lg text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
        </svg>
        <span className="flex-1 text-left hidden sm:block">Search...</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-white dark:bg-dark-card rounded border border-gray-100 dark:border-gray-700">
          ⌘K
        </kbd>
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-start justify-center p-4 pt-16">
          <Dialog.Panel className="w-full max-w-2xl bg-white dark:bg-dark-card rounded-xl shadow-xl">
            <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-gray-400 bg-gray-50 dark:bg-dark-hover rounded border border-gray-100 dark:border-gray-700">
                ESC
              </kbd>
            </div>
            
            <div className="p-2 max-h-[60vh] overflow-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  className="flex items-center gap-3 w-full p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-500">
                    {result.type === 'customer' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.83,40.31,185.71,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
                      </svg>
                    ) : result.type === 'product' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M230.66,86l-96-64a8,8,0,0,0-8.89,0l-96,64A8,8,0,0,0,26,93.33V208a16,16,0,0,0,16,16H214a16,16,0,0,0,16-16V93.33A8,8,0,0,0,230.66,86ZM214,208H42V98.67L128,41.41l86,57.26Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M240,120a48.05,48.05,0,0,0-48-48H152.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,24,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,151.12,214l11,7.33A16,16,0,0,0,186.5,212l11.77-44.36A48.07,48.07,0,0,0,240,120ZM40,199.93V40h0c42.81,35.91,86.63,45,104,47.24v65.48C126.65,155,82.84,164.07,40,199.93Zm131,8,0,.11-11-7.33V168h21.6ZM192,152H160V88h32a32,32,0,1,1,0,64Z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{result.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{result.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
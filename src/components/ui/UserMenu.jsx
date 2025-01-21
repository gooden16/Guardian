import React from 'react';
import { Menu } from '@headlessui/react';
import toast from 'react-hot-toast';

const userNavigation = [
  { id: 'profile', name: 'Your Profile', icon: 'user' },
  { id: 'settings', name: 'Settings', icon: 'settings' },
  { id: 'logout', name: 'Sign out', icon: 'logout' },
];

export function UserMenu({ onNavigate }) {
  const handleAction = (action) => {
    if (action === 'profile') {
      onNavigate('profile');
    } else if (action === 'settings') {
      onNavigate('settings');
    } else if (action === 'logout') {
      toast.success('Signed out successfully');
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors">
        <img
          src="https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png"
          alt="User"
          className="w-8 h-8 rounded-full"
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-1 w-56 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 focus:outline-none">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Alice Freeman</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">alice@example.com</p>
        </div>

        <div className="p-2">
          {userNavigation.map((item) => (
            <Menu.Item key={item.id}>
              {({ active }) => (
                <button
                  onClick={() => handleAction(item.id)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg ${
                    active ? 'bg-gray-50 dark:bg-dark-hover' : ''
                  }`}
                >
                  <span className={`text-gray-500 ${item.id === 'logout' ? 'text-red-500' : ''}`}>
                    {item.icon === 'user' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.83,40.31,185.71,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
                      </svg>
                    ) : item.icon === 'settings' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.49A107.71,107.71,0,0,0,73.89,34.49a8,8,0,0,0-3.94,6L67.31,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.93,107.21,107.21,0,0,0-10.88,26.25,8,8,0,0,0,1.48,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.49,107.71,107.71,0,0,0,26.25-10.87,8,8,0,0,0,3.94-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.93,107.21,107.21,0,0,0,10.88-26.25,8,8,0,0,0-1.48-7.06ZM128,168A40,40,0,1,1,168,128,40,40,0,0,1,128,168Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M112,216a8,8,0,0,1-8,8H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h56a8,8,0,0,1,0,16H48V208h56A8,8,0,0,1,112,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L196.69,120H104a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,221.66,122.34Z" />
                      </svg>
                    )}
                  </span>
                  <span className={`${
                    item.id === 'logout' 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-700 dark:text-gray-200'
                  }`}>
                    {item.name}
                  </span>
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}
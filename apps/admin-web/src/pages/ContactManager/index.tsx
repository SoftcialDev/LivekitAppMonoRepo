import React, { useEffect, useState, useRef } from 'react';
import { useHeader } from '@/app/providers/HeaderContext';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { useToast } from '@/shared/ui/ToastContext';
import { ContactManagerStatus, getContactManagerStatus, updateContactManagerStatus } from '@/shared/api/contactManagerClient';
import { useAuth } from '@/shared/auth/useAuth';


/**
 * ContactManagerDashboard
 *
 * - Reads the current user’s identity from `useAuth`.
 * - Fetches and displays the contact manager’s current status.
 * - Provides a custom dropdown to change the status.
 * - Shows toast notifications on success/error.
 */
const ContactManagerDashboard: React.FC = () => {
  const { account } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<ContactManagerStatus | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Valid statuses
  const statusOptions: ContactManagerStatus[] = [
    'Unavailable',
    'Available',
    'OnBreak',
    'OnAnotherTask',
  ];

  // Configure page header
  useHeader({
    title: 'Contact Manager',
    iconSrc: managementIcon,
    iconAlt: 'Contact Manager',
  });

  // On mount, load “my” profile
  useEffect(() => {
    getContactManagerStatus()
      .then(profile => setStatus(profile.status))
      .catch(err => {
        console.warn('Failed to fetch status:', err);
        showToast('Unable to load your status', 'error');
      });
  }, [showToast]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isSaving) {
      setIsOpen(prev => !prev);
    }
  };

  const selectOption = (opt: ContactManagerStatus) => {
    setIsOpen(false);
    setIsSaving(true);
    updateContactManagerStatus({ status: opt })
      .then(updated => {
        setStatus(updated.status);
        showToast('Status updated', 'success');
      })
      .catch(err => {
        console.error('Failed to update status:', err);
        showToast('Failed to update status', 'error');
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-primary-dark)] p-4">
      <div className="w-full max-w-sm bg-[var(--color-primary)] rounded-lg shadow-md p-6">

        {/* Your Current Status Container */}
        <div className="text-white rounded-md p-4 mb-4">
          <label className="block font-medium mb-2">Your Current Status:</label>
          <div className="text-lg">{status || '—'}</div>
        </div>

        {/* Change Status Container with Custom Dropdown */}
        <div className="text-white rounded-md p-4 relative" ref={dropdownRef}>
          <label className="block font-medium mb-2">Change Status:</label>
          
          {/* Dropdown button */}
          <div
            className="w-full bg-[var(--color-primary)] text-white border border-[var(--color-primary-dark)] rounded px-3 py-2 flex justify-between items-center cursor-pointer"
            onClick={toggleDropdown}
          >
            <span>{status || 'Select status'}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Dropdown list */}
          {isOpen && (
            <ul className="cursor-pointer mt-1 max-h-60 overflow-auto bg-[var(--color-primary)] rounded shadow absolute w-full z-10">
              {statusOptions.map(opt => (
                <li
                  key={opt}
                  className="px-3 py-2 text-white hover:bg-[var(--color-primary-light)] cursor-pointer"
                  onClick={() => selectOption(opt)}
                >
                  {opt}
                </li>
              ))}
            </ul>
          )}

          {/* Saving indicator */}
          {isSaving && <div className="mt-4">Saving…</div>}
        </div>
        
      </div>
    </div>
  );
};

export default ContactManagerDashboard;

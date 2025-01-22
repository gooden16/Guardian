import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';

export function WithdrawModal({ isOpen, onClose, shift, onWithdraw }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!reason.trim()) {
      toast.error('Please provide a reason for withdrawing');
      return;
    }

    try {
      setLoading(true);

      // Remove the assignment
      const { error: deleteError } = await supabase
        .from('shift_assignments')
        .delete()
        .eq('shift_id', shift.id)
        .eq('volunteer_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Send a message to the other volunteers
      const message = `Volunteer ${user.name} has withdrawn from the shift due to: ${reason}`;
      // TODO: Implement sending message to other volunteers

      toast.success('Successfully withdrew from shift');
      onWithdraw();
    } catch (error) {
      console.error('Error withdrawing from shift:', error);
      toast.error('Failed to withdraw from shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md">
          <Card>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                Withdraw from Shift
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason for withdrawing
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    rows="3"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-hover rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Withdrawing...' : 'Withdraw'}
                </Button>
              </div>
            </form>
          </Card>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

import React from 'react';
import Layout from './components/Layout';
import ShiftCard from './components/ShiftCard';
import type { Shift } from './types';
import { ShiftManager } from './services/ShiftManager';
import { logger } from './utils/logger';

const SAMPLE_SHIFT: Shift = {
  id: '1',
  date: new Date('2024-03-23'),
  startTime: '08:35',
  endTime: '10:20',
  l1Volunteers: [],
  status: 'OPEN',
};

function App() {
  const shiftManager = React.useMemo(() => ShiftManager.getInstance(), []);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    logger.info('App component mounted');
    return () => {
      logger.info('App component unmounted');
    };
  }, []);

  const handleSignUp = async () => {
    setError(null);
    try {
      const mockUser = {
        id: 'user1',
        email: 'volunteer@example.com',
        name: 'John Doe',
        role: 'L1',
        phone: '555-0123',
        active: true,
        joinDate: new Date(),
        lastActive: new Date()
      };

      await shiftManager.signUpForShift(SAMPLE_SHIFT.id, mockUser);
      alert('Successfully signed up for shift!');
    } catch (error) {
      logger.error('Failed to sign up for shift', error);
      setError(error instanceof Error ? error.message : 'Failed to sign up. Please try again.');
    }
  };

  const handleRequestCoverage = async () => {
    setError(null);
    try {
      await shiftManager.requestCoverage(
        SAMPLE_SHIFT.id,
        'user1',
        'Unable to attend due to family commitment'
      );
      alert('Coverage request submitted successfully!');
    } catch (error) {
      logger.error('Failed to request coverage', error);
      setError(error instanceof Error ? error.message : 'Failed to request coverage. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Shifts</h2>
        <div className="space-y-6">
          <ShiftCard 
            shift={SAMPLE_SHIFT}
            onSignUp={handleSignUp}
            onRequestCoverage={handleRequestCoverage}
          />
        </div>
      </div>
    </Layout>
  );
}

export default App;

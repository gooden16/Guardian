import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { SHIFT_TIMES } from '../../models/Shift';
import { getHolidayName } from '../../utils/jewishCalendar';
import { WithdrawModal } from './WithdrawModal';
import { useAuthContext } from '../../contexts/AuthContext';
import { getShiftById } from '../../lib/database';

const VolunteerCard = ({ volunteer, role }) => (
  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-dark-hover">
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {volunteer.name}
        </p>
        <span className={`text-xs px-2 py-1 rounded-full ${
          role === 'Team Leader' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            : role === 'Level 1'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
        }`}>
          {role}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {volunteer.phone} • {volunteer.email}
      </p>
    </div>
    <Button variant="secondary" onClick={() => window.location.href = `mailto:${volunteer.email}`}>
      Contact
    </Button>
  </div>
);

const Note = ({ note }) => (
  <div className="border-l-4 border-primary pl-4 py-2">
    <p className="text-sm text-gray-900 dark:text-white">{note.text}</p>
    <div className="flex items-center gap-2 mt-1">
      <p className="text-xs font-medium text-primary">{note.author}</p>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {format(new Date(note.timestamp), 'MMM d, h:mm a')}
      </span>
    </div>
  </div>
);

export function ShiftDetailPage({ shift: selectedShift, onBack }) {
  const [shift, setShift] = useState(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const { user } = useAuthContext();

  useEffect(() => {
    const loadShift = async () => {
      if (selectedShift) {
        try {
          const data = await getShiftById(selectedShift.id);
          setShift(data);
        } catch (error) {
          console.error('Error loading shift:', error);
          toast.error('Failed to load shift details');
        }
      }
    };
    loadShift();
  }, [selectedShift]);

  if (!shift) {
    return null;
  }

  const formatShiftTime = (time) => {
    const times = SHIFT_TIMES[time];
    const formatTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':');
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour = hours % 12 || 12;
      return `${hour}:${minutes} ${period}`;
    };
    return `${formatTime(times.start)} - ${formatTime(times.end)}`;
  };

  const handleWithdraw = () => {
    setIsWithdrawOpen(true);
  };

  const isUserSignedUp = () => {
    if (!user || !shift.assignments) return false;
    return shift.assignments.some(assignment => assignment.volunteer?.id === user.id);
  };

  return (
    <main className="flex-1 min-w-0 overflow-auto">
      <div className="max-w-[1440px] mx-auto animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl font-bold">
              {format(new Date(shift.date), 'EEEE, MMMM d, yyyy')}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              {formatShiftTime(shift.time)}
            </p>
            {getHolidayName(new Date(shift.date)) && (
              <p className="text-primary font-medium mt-1">
                {getHolidayName(new Date(shift.date))}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onBack}>
              Back to Shifts
            </Button>
            {isUserSignedUp() && (
              <Button variant="secondary" onClick={handleWithdraw}>
                Withdraw Signup
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Assigned Volunteers */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <h2 className="text-gray-900 dark:text-white text-lg font-semibold">
                  Assigned Volunteers
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shift.assignments.find(a => a.role === 'TEAM_LEADER')?.volunteer && (
                    <VolunteerCard 
                      volunteer={shift.assignments.find(a => a.role === 'TEAM_LEADER').volunteer} 
                      role="Team Leader"
                    />
                  )}
                  {shift.assignments.filter(a => a.role === 'LEVEL_1').map(assignment => (
                    <VolunteerCard 
                      key={assignment.volunteer.id}
                      volunteer={assignment.volunteer}
                      role="Level 1"
                    />
                  ))}
                  {shift.assignments.filter(a => a.role === 'LEVEL_2').map(assignment => (
                    <VolunteerCard 
                      key={assignment.volunteer.id}
                      volunteer={assignment.volunteer}
                      role="Level 2"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <h2 className="text-gray-900 dark:text-white text-lg font-semibold">
                  Admin Notes
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shift.notes.admin.map(note => (
                    <Note key={note.id} note={note} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Leader Notes */}
            <Card>
              <CardHeader>
                <h2 className="text-gray-900 dark:text-white text-lg font-semibold">
                  Team Leader Notes
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shift.notes.teamLeader.map(note => (
                    <Note key={note.id} note={note} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        shift={shift}
        onWithdraw={() => {
          setIsWithdrawOpen(false);
          onBack();
        }}
      />
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import { instance } from '../api/axios.api';
import { toast } from 'react-toastify';
import { ICalendarEvent, Role } from '../types/user';
import { useMyProfile } from '../hooks/useMyProfile';
import CalendarView from '../components/CalendarView';

const CalendarPage: React.FC = () => {
  const myProfile = useMyProfile();
  const [events, setEvents] = useState<ICalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      if (!myProfile) return;
      const endpoint = myProfile.role === Role.TEACHER ? '/calendar/teacher' : '/calendar/student';
      const { data } = await instance.get<ICalendarEvent[]>(endpoint);
      setEvents(data.map(event => ({
        ...event,
        start: new Date(event.date),
        end: new Date(new Date(event.date).getTime() + 60 * 60 * 1000),
      })));
    } catch (error) {
      toast.error('Не удалось загрузить события');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [myProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5B82]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Календарь событий</h2>
        </div>
        <div className="p-3 sm:p-4">
          <CalendarView
            events={events}
            readOnly={false}
            teacherEmail={myProfile?.role === Role.TEACHER ? myProfile.email : undefined}
            studentEmail={myProfile?.role === Role.STUDENT ? myProfile.email : undefined}
            onEventCreated={fetchEvents}
            onEventDeleted={fetchEvents}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
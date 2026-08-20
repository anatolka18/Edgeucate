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

  const normalizeId = (raw: any): string => {
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object' && raw !== null) {
      if (typeof raw.$oid === 'string') return raw.$oid;
      if (raw.buffer && raw.buffer.data && Array.isArray(raw.buffer.data)) {
        return raw.buffer.data.map((b: number) => b.toString(16).padStart(2, '0')).join('');
      }
      if (raw.data && Array.isArray(raw.data) && raw.type === 'Buffer') {
        return raw.data.map((b: number) => b.toString(16).padStart(2, '0')).join('');
      }
      if (typeof raw.toHexString === 'function') return raw.toHexString();
      if (typeof raw.toString === 'function') {
        const str = raw.toString();
        if (str !== '[object Object]') return str;
      }
    }
    return '';
  };

  const fetchEvents = async () => {
    try {
      if (!myProfile) return;
      const endpoint = myProfile.role === Role.TEACHER ? '/calendar/teacher' : '/calendar/student';
      const { data } = await instance.get<any[]>(endpoint);

      const mapped = data.map(rawEvent => {
        const event = rawEvent._doc || rawEvent;
        const startDate = new Date(event.date);
        return {
          _id: normalizeId(event._id),
          title: event.title,
          teacher_email: event.teacher_email,
          student_email: event.student_email,
          teacher_username: event.teacher_username,
          student_username: event.student_username,
          date: event.date,
          time: event.time,
          cost: event.cost,
          start: startDate,
          end: new Date(startDate.getTime() + 60 * 60 * 1000),
        };
      });

      setEvents(mapped as ICalendarEvent[]);
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
      <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5B82]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Календарь событий</h2>
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
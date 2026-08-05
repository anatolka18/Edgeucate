import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ICalendarEvent } from '../types/user';
import { instance } from '../api/axios.api';
import { toast } from 'react-toastify';
import { useMyProfile } from '../hooks/useMyProfile';

moment.locale('ru');
const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  events: ICalendarEvent[];
  readOnly?: boolean;
  teacherEmail?: string;
  studentEmail?: string;
  teacherUsername?: string;
  studentUsername?: string;
  onEventCreated?: () => void;
  onEventDeleted?: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  readOnly = false,
  teacherEmail,
  studentEmail,
  teacherUsername,
  studentUsername,
  onEventCreated,
  onEventDeleted,
}) => {
  const myProfile = useMyProfile();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ICalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: moment().format('YYYY-MM-DD'),
    time: '10:00',
    cost: 0,
    student_email: studentEmail || '',
    student_username: studentUsername || '',
  });

  const handleCreateEvent = async () => {
    try {
      await instance.post('/calendar', {
        ...newEvent,
        teacher_email: teacherEmail,
        teacher_username: myProfile?.username || teacherUsername,
      });
      toast.success('Событие создано');
      setShowCreateModal(false);
      onEventCreated?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка создания');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?._id) return;
    try {
      await instance.delete(`/calendar/${selectedEvent._id}`);
      toast.success('Событие удалено');
      setShowEventModal(false);
      onEventDeleted?.();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const eventStyleGetter = (event: ICalendarEvent) => {
    const isMyEvent = event.teacher_email === myProfile?.email || event.student_email === myProfile?.email;
    return {
      style: {
        backgroundColor: isMyEvent ? '#3D5B82' : '#96C3D6',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <div>
      {!readOnly && teacherEmail && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-4 px-4 py-3 bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white text-black rounded-lg transition-colors font-medium min-h-[44px] w-full sm:w-auto"
        >
          Добавить событие
        </button>
      )}

      <div className="h-[50vh] sm:h-[500px] md:h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor={(event: ICalendarEvent) => new Date(event.start || event.date)}
          endAccessor={(event: ICalendarEvent) => new Date(event.end || new Date(new Date(event.date).getTime() + 60 * 60 * 1000))}
          style={{ height: '100%' }}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setShowEventModal(true);
          }}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: 'Следующий',
            previous: 'Предыдущий',
            today: 'Сегодня',
            month: 'Месяц',
            week: 'Неделя',
            day: 'День',
          }}
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto safe-area-top safe-area-bottom">
            <h3 className="text-lg font-bold mb-4">Новое событие</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Название"
                className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
              <input
                type="time"
                className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              />
              <input
                type="number"
                placeholder="Стоимость"
                className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                value={newEvent.cost}
                onChange={(e) => setNewEvent({ ...newEvent, cost: Number(e.target.value) })}
              />
              {!studentEmail && (
                <>
                  <input
                    type="email"
                    placeholder="Email ученика"
                    className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                    value={newEvent.student_email}
                    onChange={(e) => setNewEvent({ ...newEvent, student_email: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Имя ученика"
                    className="w-full p-3 border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#96C3D6]"
                    value={newEvent.student_username}
                    onChange={(e) => setNewEvent({ ...newEvent, student_username: e.target.value })}
                  />
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 min-h-[44px] font-medium"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateEvent}
                className="px-4 py-3 bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white text-black rounded-lg min-h-[44px] font-medium transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg w-full max-w-md mx-4 safe-area-top safe-area-bottom">
            <h3 className="text-lg font-bold mb-4 break-words">{selectedEvent.title}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="break-words">Преподаватель: {selectedEvent.teacher_username}</p>
              <p className="break-words">Ученик: {selectedEvent.student_username}</p>
              <p>Дата: {moment(selectedEvent.date).format('DD.MM.YYYY')}</p>
              <p>Время: {selectedEvent.time}</p>
              <p>Стоимость: {selectedEvent.cost} ₽</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              {(selectedEvent.teacher_email === myProfile?.email || selectedEvent.student_email === myProfile?.email) && (
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 min-h-[44px] font-medium transition-colors"
                >
                  Удалить
                </button>
              )}
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 min-h-[44px] font-medium"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
import React, { useState } from 'react';
import moment from 'moment';
import { ICalendarEvent } from '../types/user';
import { instance } from '../api/axios.api';
import { toast } from 'react-toastify';
import { useMyProfile } from '../hooks/useMyProfile';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, User, DollarSign, CalendarDays, ChevronRight as ChevronRightIcon } from 'lucide-react';

moment.locale('ru');

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
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showMonthEvents, setShowMonthEvents] = useState(false);
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

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('isoWeek');
    const endDate = endOfMonth.clone().endOf('isoWeek');

    const days = [];
    const day = startDate.clone();
    while (day.isSameOrBefore(endDate)) {
      days.push(day.clone());
      day.add(1, 'day');
    }
    return days;
  };

  const getEventsForDate = (date: moment.Moment) => {
    const dateStr = date.format('YYYY-MM-DD');
    return events.filter(event => {
      const eventDate = moment(event.date).format('YYYY-MM-DD');
      return eventDate === dateStr;
    });
  };

  const getMonthEvents = () => {
    return events
      .filter(event => moment(event.date).isSame(currentDate, 'month'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getSelectedDayEvents = () => {
    if (!selectedDate) return [];
    return events.filter(event => moment(event.date).format('YYYY-MM-DD') === selectedDate);
  };

  const handleDayClick = (date: moment.Moment) => {
    setSelectedDate(date.format('YYYY-MM-DD'));
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => prev.clone().subtract(1, 'month'));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => prev.clone().add(1, 'month'));
    setSelectedDate(null);
  };

  const handleToday = () => {
    const today = moment();
    setCurrentDate(today.clone());
    setSelectedDate(today.format('YYYY-MM-DD'));
    setShowMonthEvents(false);
  };

  const handleCreateEvent = async () => {
    try {
      await instance.post('/calendar', {
        ...newEvent,
        teacher_email: teacherEmail,
        teacher_username: myProfile?.username || teacherUsername,
      });
      toast.success('Событие создано');
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        date: moment().format('YYYY-MM-DD'),
        time: '10:00',
        cost: 0,
        student_email: studentEmail || '',
        student_username: studentUsername || '',
      });
      onEventCreated?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка создания');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?._id) return;
    try {
      const id = typeof selectedEvent._id === 'object' && selectedEvent._id
        ? (selectedEvent._id as any).toString()
        : selectedEvent._id;
      await instance.delete(`/calendar/${id}`);
      toast.success('Событие удалено');
      setShowEventModal(false);
      onEventDeleted?.();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const days = getDaysInMonth();
  const monthEvents = getMonthEvents();
  const selectedDayEvents = getSelectedDayEvents();

  return (
    <div>
      {!readOnly && teacherEmail && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-4 px-4 py-3 bg-[#96C3D6] hover:bg-[#3D5B82] hover:text-white text-black rounded-lg transition-colors font-medium min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить событие
        </button>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center gap-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 capitalize">
              {currentDate.format('MMMM YYYY')}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handleToday}
                className="text-xs text-[#3D5B82] hover:underline px-2 py-0.5 font-medium"
              >
                Сегодня
              </button>
              <button
                onClick={() => setShowMonthEvents(!showMonthEvents)}
                className={`text-xs px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  showMonthEvents
                    ? 'bg-[#3D5B82] text-white'
                    : 'text-[#3D5B82] hover:bg-[#3D5B82]/10'
                }`}
              >
                <CalendarDays className="w-3 h-3" />
                Месяц
              </button>
            </div>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Следующий месяц"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-white">
          {days.map((day, index) => {
            const isCurrentMonth = day.month() === currentDate.month();
            const isToday = day.isSame(moment(), 'day');
            const isSelected = selectedDate === day.format('YYYY-MM-DD');
            const dayEvents = getEventsForDate(day);

            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  relative min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 border-r border-b border-gray-100
                  transition-colors hover:bg-gray-50 active:bg-gray-100
                  ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                  ${isSelected ? 'ring-2 ring-[#3D5B82] ring-inset bg-blue-50/50' : ''}
                `}
                aria-label={`День ${day.format('D MMMM YYYY')}`}
              >
                <div className={`
                  text-xs sm:text-sm font-medium
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                  ${isToday ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#3D5B82] text-white flex items-center justify-center mx-auto' : ''}
                `}>
                  {day.date()}
                </div>

                {dayEvents.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5 justify-center">
                    {dayEvents.slice(0, 3).map((event, i) => {
                      const isMyEvent = event.teacher_email === myProfile?.email || event.student_email === myProfile?.email;
                      return (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${isMyEvent ? 'bg-[#3D5B82]' : 'bg-[#96C3D6]'}`}
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-gray-500 font-semibold">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && selectedDayEvents.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 px-1 mb-2">
            События на {moment(selectedDate).format('D MMMM YYYY')}:
          </h4>
          <div className="space-y-2">
            {selectedDayEvents.map((event, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventModal(true);
                }}
                className="w-full text-left bg-gradient-to-r from-[#3D5B82]/10 to-[#96C3D6]/10 hover:from-[#3D5B82]/20 hover:to-[#96C3D6]/20 border border-[#3D5B82]/20 rounded-lg p-3 transition-colors min-h-[48px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {event.teacher_username} → {event.student_username}
                      </span>
                      {event.cost > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {event.cost} ₽
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showMonthEvents && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 px-1 mb-2 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Все события за {currentDate.format('MMMM YYYY')} ({monthEvents.length})
          </h4>
          {monthEvents.length > 0 ? (
            <div className="space-y-2">
              {monthEvents.map((event, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  className="w-full text-left bg-gradient-to-r from-[#3D5B82]/10 to-[#96C3D6]/10 hover:from-[#3D5B82]/20 hover:to-[#96C3D6]/20 border border-[#3D5B82]/20 rounded-lg p-3 transition-colors min-h-[48px]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {moment(event.date).format('D MMM')} · {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {event.teacher_username} → {event.student_username}
                        </span>
                        {event.cost > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {event.cost} ₽
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Событий в этом месяце нет</p>
            </div>
          )}
        </div>
      )}

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
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-700">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="break-words">Преподаватель: <b>{selectedEvent.teacher_username}</b></span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="break-words">Ученик: <b>{selectedEvent.student_username}</b></span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>
                  {moment(selectedEvent.date).format('D MMMM YYYY')} в {selectedEvent.time}
                </span>
              </div>
              {selectedEvent.cost > 0 && (
                <div className="flex items-center gap-3 text-gray-700">
                  <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Стоимость: <b>{selectedEvent.cost} ₽</b></span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              {(selectedEvent.teacher_email === myProfile?.email || selectedEvent.student_email === myProfile?.email) && (
                <button
                  onClick={handleDeleteEvent}
                  className="flex-1 py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl transition-colors min-h-[48px] flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </button>
              )}
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 py-3 px-4 bg-[#96C3D6] hover:bg-[#3D5B82] text-white font-medium rounded-xl transition-colors min-h-[48px]"
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
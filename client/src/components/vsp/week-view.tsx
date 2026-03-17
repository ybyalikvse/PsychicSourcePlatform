import React from 'react';

interface WeekViewProps {
  currentDate: Date;
  calendarData: any;
  getEventsForDate: (date: Date) => any;
  onDateClick: (date: string) => void;
  onEventClick: (event: any) => void;
}

export function WeekView({
  currentDate,
  calendarData,
  getEventsForDate,
  onDateClick,
  onEventClick
}: WeekViewProps) {
  // Get start of week (Sunday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-3 text-center text-sm font-medium bg-muted">
          {day}
        </div>
      ))}

      {weekDays.map((day, index) => {
        const isToday = day.toDateString() === new Date().toDateString();
        const dayEvents = getEventsForDate(day);
        const hasContent = dayEvents.events.length > 0 || dayEvents.projects.length > 0;

        return (
          <div
            key={index}
            className={`
              bg-background p-3 min-h-[150px] cursor-pointer hover:bg-muted/50 transition-colors border rounded
              ${isToday ? 'ring-2 ring-primary' : ''}
              ${hasContent ? 'bg-blue-50 dark:bg-blue-950/30' : ''}
            `}
            onClick={() => onDateClick(day.toISOString().split('T')[0])}
          >
            <div className="text-sm font-medium mb-2">{day.getDate()}</div>
            <div className="space-y-1">
              {dayEvents.events.slice(0, 3).map((event: any) => (
                <div
                  key={event.id}
                  className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.projects.slice(0, 2).map((project: any) => (
                <div
                  key={project.id}
                  className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1 py-0.5 rounded truncate"
                >
                  {project.subtopic}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

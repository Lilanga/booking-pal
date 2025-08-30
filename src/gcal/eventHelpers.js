
  const processEvents = (events) => {
    const allDayEvents = markAllDayEvents(events);
    const confirmedEvents = removeUnconfirmedEvents(allDayEvents);
    return confirmedEvents;
  };

  const markAllDayEvents = (events) => {
    return events?.map((event) => {
      if (event.start.dateTime) {
        return {
          ...event,
          isAllDay: false,
        };
      }
      // all day events received from api call don't have the dateTime field
      const start = new Date(event.start.date);
      start.setHours(0);
      const end = new Date(event.end.date);
      end.setHours(0);
      return {
        ...event,
        start: { ...event.start, dateTime: start },
        end: { ...event.end, dateTime: end },
        isAllDay: true,
      };
    });
  };

  const removeUnconfirmedEvents = (events) => {
    return events?.filter(event => {
      return event.status === 'confirmed';
    });
  };

export {processEvents};
import React, { useState } from 'react'
import { Button } from 'semantic-ui-react'
import moment from "moment";

const formatTime = (date) => {
  let formattedDate = moment.utc(date).format("YYYYMMDDTHHmmssZ");
  return formattedDate.replace("+00:00", "Z");
}

const buildURL = (event) => {
  let calendarUrl = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    "URL:" + document.URL,
    "DTSTART:" + formatTime(event.startTime),
    "DTEND:" + formatTime(event.endTime),
    "SUMMARY:" + event.title,
    "LOCATION:" + event.location,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");

  calendarUrl = encodeURI(
    "data:text/calendar;charset=utf8," + calendarUrl
  );
  console.log(calendarUrl)
  return calendarUrl
}

const AddToCalendar = ({
  event,
  disabled
}) => {

  return (
    <Button
      disabled={disabled}
      onClick={() => {
        const url = buildURL(event)
        window.location = url
      }}
    >
      Add to Calendar
    </Button>
  )

}

export default AddToCalendar
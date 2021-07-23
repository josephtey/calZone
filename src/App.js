/*global chrome*/
import React, { useEffect, useState } from 'react'
import './App.css';
import styled from 'styled-components'
import * as chrono from 'chrono-node';
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import TimezoneSelect from 'react-timezone-select'
import timeZoneConverter from 'time-zone-converter'
import AddToCalendarButton from './AddToCalendarButton'
import { Input } from 'semantic-ui-react'



const DateSection = styled.div`
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
`

const Container = styled.div`
  width: 780px;
  padding: 30px;
  height: 200px;
  background: white;
`

const TimezoneSelectWrapper = styled(TimezoneSelect)`
  width: 300px;
`

const DateTimeRangePickerWrapper = styled(DateTimeRangePicker)`
  width: 400px;
`

const CalendarSection = styled.div`
  display: flex;
  gap: 15px;
`

const getSelectedText = () => {
  const selection = window.getSelection().toString();
  return selection

}

function App() {

  const [initFlag, setInitFlag] = useState(false)

  const [date, setDate] = useState(null)
  const [timezone, setTimezone] = useState()

  const [convertedDate, setConvertedDate] = useState(null)
  const [convertedTimezone, setConvertedTimezone] = useState()

  const [eventName, setEventName] = useState("")
  const [eventLocation, setEventLocation] = useState("")

  const initFunc = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const selection = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectedText,
    });

    const parsedDate = chrono.parse(selection[0]['result'])

    setDate([parsedDate[0].start ? parsedDate[0].start.date() : null, parsedDate[0].end ? parsedDate[0].end.date() : null])
  }

  const setTimezones = () => {
    chrome.storage.sync.get("timezone1", data => {
      if (data.timezone1) {
        setTimezone(data.timezone1)
      } else {
        setTimezone({
          "value": "Australia/Sydney",
          "label": "(GMT+10:00) Canberra, Melbourne, Sydney (Australian Eastern Standard Time)",
          "offset": 10,
          "abbrev": "AEST",
          "altName": "Australian Eastern Standard Time"
        })
      }
    })

    chrome.storage.sync.get("timezone2", data => {
      if (data.timezone2) {
        setConvertedTimezone(data.timezone2)
      } else {
        setConvertedTimezone({
          "value": "Australia/Sydney",
          "label": "(GMT+10:00) Canberra, Melbourne, Sydney (Australian Eastern Standard Time)",
          "offset": 10,
          "abbrev": "AEST",
          "altName": "Australian Eastern Standard Time"
        })
      }
    })
  }

  useEffect(() => {
    setTimezones()
  }, [])

  useEffect(() => {
    if (timezone && convertedTimezone && !initFlag) {
      initFunc()

      setInitFlag(true)
    }
  }, [timezone, convertedTimezone])

  // Update converted date
  useEffect(() => {
    if (date) {
      setConvertedDate([date[0] ? timeZoneConverter(date[0], timezone.offset, convertedTimezone.offset) : null, date[1] ? timeZoneConverter(date[1], timezone.offset, convertedTimezone.offset) : null])
    }
  }, [date])

  useEffect(() => {
    if (convertedDate) {
      console.log("converted date: ", convertedDate)
    }
  }, [convertedDate])

  if (!timezone || !convertedTimezone) return null

  return (
    <Container>
      <DateSection>
        <TimezoneSelectWrapper
          value={timezone}
          onChange={(newTimezone) => {
            setTimezone(newTimezone)
            chrome.storage.sync.set({ timezone1: newTimezone });

            setConvertedDate([date[0] ? timeZoneConverter(date[0], newTimezone.offset, convertedTimezone.offset) : null, date[1] ? timeZoneConverter(date[1], newTimezone.offset, convertedTimezone.offset) : null])
          }}
        />
        <DateTimeRangePickerWrapper
          onChange={(newDate) => {
            setDate(newDate)
          }}
          value={date}
        />

      </DateSection>

      <DateSection>
        <TimezoneSelectWrapper
          value={convertedTimezone}
          onChange={(newConvertedTimezone) => {
            setConvertedTimezone(newConvertedTimezone)
            chrome.storage.sync.set({ timezone2: newConvertedTimezone });

            setConvertedDate([date[0] ? timeZoneConverter(date[0], timezone.offset, newConvertedTimezone.offset) : null, date[1] ? timeZoneConverter(date[1], timezone.offset, newConvertedTimezone.offset) : null])
          }}
        />
        <DateTimeRangePickerWrapper
          onChange={setConvertedDate}
          value={convertedDate}
          disabled={true}
        />
      </DateSection>

      <CalendarSection>
        <Input placeholder='What?' value={eventName} onChange={(e) => {
          setEventName(e.target.value)
        }} />
        <Input placeholder='Location?' value={eventLocation} onChange={e => {
          setEventLocation(e.target.value)
        }} />

        <AddToCalendarButton
          event={{
            title: eventName,
            location: eventLocation,
            startTime: convertedDate && convertedDate[0] ? convertedDate[0] : '',
            endTime: convertedDate && convertedDate[1] ? convertedDate[1] : ''
          }}
          disabled={eventName !== "" && convertedDate && convertedDate[0] && convertedDate[1] ? false : true}
        />
      </CalendarSection>

    </Container>
  );
}

export default App;

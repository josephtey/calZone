/*global chrome*/
import React, { useEffect, useState } from 'react'
import './App.css';
import styled from 'styled-components'
import * as chrono from 'chrono-node';
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import TimezoneSelect from 'react-timezone-select'
import timeZoneConverter from 'time-zone-converter'
import AddToCalendarButton from './AddToCalendarButton'
import { Input, Dropdown } from 'semantic-ui-react'


const Title = styled.div`
  text-align: center;
  margin-bottom: 20px;
`
const DateSection = styled.div`
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
`

const Container = styled.div`
  padding: 30px;
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
  width: 100%;
`

const SectionQuestion = styled.div`
  margin-bottom: 10px;
`

function App() {

  const [date, setDate] = useState(null)
  const [timezone, setTimezone] = useState()

  const [convertedDate, setConvertedDate] = useState(null)
  const [convertedTimezone, setConvertedTimezone] = useState()

  const [eventName, setEventName] = useState("")
  const [eventLocation, setEventLocation] = useState("")

  const updateConvertedDate = (fromTimezone, toTimezone) => {
    setConvertedDate([date[0] ? new Date(timeZoneConverter(date[0], fromTimezone.offset, toTimezone.offset)) : null, date[1] ? new Date(timeZoneConverter(date[1], fromTimezone.offset, toTimezone.offset)) : null])
  }

  const getSelectedDateTime = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const selection = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const selection = window.getSelection().toString();
        return selection
      },
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

    // Get timezones from storage
    setTimezones()

    // Get selected date time from DOM
    getSelectedDateTime()

  }, [])

  // Update converted date every time date, timezone or convertedTimezone changes
  useEffect(() => {
    if (date && timezone && convertedTimezone) {
      updateConvertedDate(timezone, convertedTimezone)
    }
  }, [date, timezone, convertedTimezone])


  if (!timezone || !convertedTimezone) return null

  return (
    <Container>
      <Title>
        <h3>tmzne</h3>
      </Title>

      <SectionQuestion>
        <b>What date & time?</b> (or highlight text)
      </SectionQuestion>
      <DateSection>
        <TimezoneSelectWrapper
          value={timezone}
          onChange={(newTimezone) => {
            setTimezone(newTimezone)
            chrome.storage.sync.set({ timezone1: newTimezone });
          }}
        />
        <DateTimeRangePickerWrapper
          onChange={(newDate) => {
            setDate(newDate)
          }}
          value={date}
        />

      </DateSection>

      <SectionQuestion>
        <b>What timezone do you want to convert to?</b>
      </SectionQuestion>
      <DateSection>
        <TimezoneSelectWrapper
          value={convertedTimezone}
          onChange={(newConvertedTimezone) => {
            setConvertedTimezone(newConvertedTimezone)
            chrome.storage.sync.set({ timezone2: newConvertedTimezone });
          }}
        />
        <DateTimeRangePickerWrapper
          onChange={setConvertedDate}
          value={convertedDate}
          disabled={true}
        />
      </DateSection>

      <SectionQuestion>
        <b>Do you want to add this to your calendar?</b>
      </SectionQuestion>
      <CalendarSection>
        <Input style={{ flex: 1 }} placeholder='What?' value={eventName} onChange={(e) => {
          setEventName(e.target.value)
        }} />
        <Input style={{ flex: 1 }} placeholder='Location?' value={eventLocation} onChange={e => {
          setEventLocation(e.target.value)
        }} />

        <AddToCalendarButton
          style={{ flex: 1 }}
          event={{
            title: eventName,
            location: eventLocation,
            startTime: convertedDate && convertedDate[0] ? convertedDate[0].toISOString() : '',
            endTime: convertedDate && convertedDate[1] ? convertedDate[1].toISOString() : ''
          }}
          disabled={eventName !== "" && convertedDate && convertedDate[0] && convertedDate[1] ? false : true}
        />
      </CalendarSection>

    </Container>
  );
}

export default App;

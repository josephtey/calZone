/*global chrome*/
import React, { useEffect, useState } from 'react'
import './App.css';
import styled from 'styled-components'
import * as chrono from 'chrono-node';
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import TimezoneSelect from 'react-timezone-select'


const DateSection = styled.div`
  margin-bottom: 15px;
`

const Container = styled.div`
  width: 380px;
  padding: 30px;
  background: white;
`

const getSelectedText = () => {
  const selection = window.getSelection().toString();
  return selection

}

const convertTZ = (date, tzString) => {
  return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
}

function App() {

  const [initFlag, setInitFlag] = useState(false)

  const [date, setDate] = useState(null)
  const [timezone, setTimezone] = useState()

  const [convertedDate, setConvertedDate] = useState(null)
  const [convertedTimezone, setConvertedTimezone] = useState()

  const initFunc = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const selection = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectedText,
    });

    const parsedDate = chrono.parse(selection[0]['result'])
    console.log(parsedDate)

    setDate([parsedDate[0].start ? parsedDate[0].start.date() : null, parsedDate[0].end ? parsedDate[0].end.date() : null])
    console.log(timezone)
    console.log(convertedTimezone)
    setConvertedDate([parsedDate[0].start ? convertTZ(parsedDate[0].start.date(), convertedTimezone.value) : null, parsedDate[0].end ? convertTZ(parsedDate[0].end.date(), convertedTimezone.value) : null])
  }

  const setTimezones = () => {
    chrome.storage.sync.get("timezone1", data => {
      console.log(data)
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
      console.log(data)
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

  if (!timezone || !convertedTimezone) return null

  return (
    <Container>
      <DateSection>
        <TimezoneSelect
          value={timezone}
          onChange={(newTimezone) => {

            if (newTimezone !== timezone) {
              setTimezone(newTimezone)
              setConvertedDate([convertedDate[0] ? convertTZ(convertedDate[0], newTimezone.value) : null, convertedDate[1] ? convertTZ(convertedDate[1], newTimezone.value) : null])
              chrome.storage.sync.set({ timezone1: newTimezone });
            }
          }}
        />
        <DateTimeRangePicker
          onChange={(newDate) => {
            setDate(newDate)
            setConvertedDate([newDate[0] ? convertTZ(newDate[0], convertedTimezone.value) : null, newDate[1] ? convertTZ(newDate[1], convertedTimezone.value) : null])
          }}
          value={date}
        />

      </DateSection>

      <DateSection>
        <TimezoneSelect
          value={convertedTimezone}
          onChange={(newConvertedTimezone) => {
            if (newConvertedTimezone !== convertedTimezone) {
              setConvertedTimezone(newConvertedTimezone)
              setConvertedDate([convertedDate[0] ? convertTZ(convertedDate[0], newConvertedTimezone.value) : null, convertedDate[1] ? convertTZ(convertedDate[1], newConvertedTimezone.value) : null])
              chrome.storage.sync.set({ timezone2: newConvertedTimezone });
            }
          }}
        />
        <DateTimeRangePicker
          onChange={setConvertedDate}
          value={convertedDate}
          disabled={true}
        />
      </DateSection>

    </Container>
  );
}

export default App;

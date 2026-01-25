/*
Script to pull drop-in program schedules from a City of Toronto webpage
Author: Ben Coleman (https://github.com/tallcoleman)
*/

/**
 * Update this function to select the programs you want to add to your calendar
 * Properties in each "programs" variable should be as follows:
 * - locationID: number at the very end of the webpage for the facility, e.g. 189 for https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=189
 * - courseTitle: Title in the "Program" column of the schedule, e.g. "Lane Swim" or "Aquafit: Shallow". Do not include the age information below the course title.
 * - calendarID: Calendar ID from the "Integrate calendar" section of your Google Calendar settings
 * - userAge: OPTIONAL, e.g. your age or the age of a family member, in years, helps to filter out irrelevant programs with the same courseTitle
 * - color: OPTIONAL, color to use for the Google Calendar event, see https://github.com/tallcoleman/tor-rec-sched-to-cal/tree/main?tab=readme-ov-file#guide-to-updated-google-calendar-colors
 */
function updateSchedules() {
  const programs = [
    {
      // EXAMPLE: delete or change for your desired programs
      locationID: 189,
      courseTitle: "Lane Swim",
      calendarID: "LONG_STRING_OF_LETTERS_AND_NUMBERS@group.calendar.google.com",
      userAge: 40,
      color: "peacock",
    },
  ];
  scheduleSync(programs);
}

/* 
  KEY URLS AND RESOURCES
  ======================
*/

// CKAN resources and URLs should be JSON versions of Drop-In Programs and Locations from https://open.toronto.ca/dataset/registered-programs-and-drop-in-courses-offering/

const DROP_IN_SCHEDULE_RESOURCE = "067b41e7-ac8a-4d3f-ad08-089f8cd70316";
const DROP_IN_SCHEDULE_URL = `https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/1a5be46a-4039-48cd-a2d2-8e702abf9516/resource/${DROP_IN_SCHEDULE_RESOURCE}/download/Drop-in.json`;
const DROP_IN_SCHEDULE_META =
  "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=registered-programs-and-drop-in-courses-offering";
const LOCATION_DATA_URL =
  "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/1a5be46a-4039-48cd-a2d2-8e702abf9516/resource/87f95a5a-184f-4df5-ad37-84bcc1ea99a9/download/Locations.json";
const FACILITY_BASE_URL =
  "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=";

// Conversion dict to turn age range descriptions from the Web API into Age Min and Age Max values.
const WEB_API_AGE_RANGES = {
  "0 years and over": { "Age Min": "None", "Age Max": "None" },
  "0 - 5 years": { "Age Min": "None", "Age Max": 5 * 12 },
  "6 - 12 years": { "Age Min": 6 * 12, "Age Max": 12 * 12 },
  "7 years and over": { "Age Min": 7 * 12, "Age Max": "None" },
  "8 - 12 years": { "Age Min": 8 * 12, "Age Max": 12 * 12 },
  "10 - 24 years": { "Age Min": 10 * 12, "Age Max": 24 * 12 },
  "13 years and over": { "Age Min": 13 * 12, "Age Max": "None" },
  "13 - 23 years": { "Age Min": 13 * 12, "Age Max": 23 * 12 },
  "13 - 24 years": { "Age Min": 13 * 12, "Age Max": 24 * 12 },
  "16 years and over": { "Age Min": 16 * 12, "Age Max": "None" },
  "18 years and over": { "Age Min": 18 * 12, "Age Max": "None" },
  "60 years and over": { "Age Min": 60 * 12, "Age Max": "None" },
};

/* 
  TYPE DEFINITIONS
  ================
*/

/**
 * @typedef {Object} DropInSchedule
 * @property {number=} _id
 * @property {number} `Location ID`
 * @property {number=} Course_ID
 * @property {string} `Course Title`
 * @property {string} `Age Min` - Age, in number of months, or "None"
 * @property {string} `Age Max` - Age, in number of months, or "None"
 * @property {string=} `Date From` - "YYYYMMDD" format
 * @property {string=} `Date Range` - "MMM D to MMM D" format
 * @property {number=} `Start Hour` - 24h clock
 * @property {number=} `Start Minute`
 * @property {number} `End Hour` - 24h clock
 * @property {number} `End Min`
 * @property {"Skating" | "General" | "Arts" | "Sports" | "Fitness" | "Swimming"} Category
 * @property {string} `First Date` - ISO Date with no tz or offset (YYYY-MM-DD)
 * @property {string} `Last Date` - ISO Date with no tz or offset (YYYY-MM-DD)
 */

/**
 * @typedef {Object} Location
 * @property {number=} `_id`
 * @property {number} `Location ID`
 * @property {number=} `Parent Location ID`
 * @property {string} `Location Name`
 * @property {string} `Location Type` - uses "None" for null
 * @property {"Fully Accessible" | "Partially Accessible" | "None"} `Accessibility`
 * @property {string} `Intersection` - uses "None" for null
 * @property {string} `TTC Information` - uses "None" for null
 * @property {string} `District` - uses "None" for null
 * @property {string} `Street No` - uses "None" for null
 * @property {string} `Street No Suffix` - uses "None" for null
 * @property {string} `Street Name` - uses "None" for null
 * @property {string} `Street Type` - uses "None" for null
 * @property {string} `Street Direction` - uses "None" for null
 * @property {string} `Postal Code` - uses "None" for null
 * @property {string} `Description`  - uses "None" for null
 */

/**
 * @typedef {Object} ProgramQuery
 * @property {number} locationID
 * @property {string} courseTitle
 * @property {string} calendarID - Calendar ID under the Integrate Calendar section of Google Calendar options
 * @property {number=} userAge - age in years
 * @property {string=} color - calendar event color, see https://developers.google.com/apps-script/reference/calendar/event-color
 */

/**
 * @typedef {Object} EventDetails
 * @property {string} title - the title of the event
 * @property {Date} startTime - the date and time when the event starts
 * @property {Date} endTime - the date and time when the event ends
 * @property {EventOptions} options - advanced parameters
 */

/**
 * @typedef {Object} EventOptions
 * @property {string} description	- the description of the event
 * @property {string} location - the location of the event
 * @property {string} guests - a comma-separated list of email addresses that should be added as guests
 * @property {boolean} sendInvites - whether to send invitation emails (default: false)
 */

/* 
  FUNCTIONS
  =========
*/

/**
 * Gets drop-in program schedules and updates them in the specified Google Calendars
 * @param {Array<ProgramQuery>} programs
 * @param {Boolean=} updatePastDates - Whether to update calendar events in the past. False by default.
 */
function scheduleSync(programs, updatePastDates = false) {
  const daysSinceScheduleUpdate = getDaysSinceScheduleUpdate();

  // Fallback to web API if Open Data has not been updated in over 2 weeks
  let currentSchedule;
  if (daysSinceScheduleUpdate > 14) {
    Logger.log(
      `Open Data for drop-in programs has not be updated in ${Math.round(daysSinceScheduleUpdate)} days, falling back to web API instead.`
    );
    const programLocations = [...new Set(programs.map((p) => p.locationID))];
    currentSchedule = getAllDropInSchedulesWeb(programLocations);
  } else {
    currentSchedule = getDropInSchedule();
  }

  const locations = getFacilityLocations();
  const dtnow = new Date();
  const todayStart = new Date(dtnow.getFullYear(), dtnow.getMonth(), dtnow.getDate());

  for (let { locationID, courseTitle, calendarID, userAge, color } of programs) {
    const programSchedule = currentSchedule.filter(
      (entry) =>
        entry["Location ID"] === locationID &&
        entry["Course Title"] === courseTitle &&
        userIsInAgeRange(entry, userAge) &&
        (updatePastDates ? true : getStartDateTime(entry) >= todayStart),
    );

    // skip calendar updates if there are no results
    // Note: this may result in cancelled events not being removed from the calendar
    if (programSchedule.length === 0) {
      Logger.log(
        `No matching events found for location ID ${locationID} with title "${courseTitle}"${userAge ? ` and user age of ${userAge}` : ""}`
      );
      continue;
    }

    const programEvents = programSchedule.map((x) => convertEntryToEvent(x, locations));

    // delete current calendar events within result timeframe
    // + Time offsets added due to known quirk of Date constructor - needed to ensure ISO date is interpreted in user's timezone and to represent end or start of day
    const firstDate = updatePastDates
      ? programSchedule
          .map((e) => new Date(e["First Date"] + "T00:00:00"))
          .reduce((p, c) => (c < p ? c : p))
      : todayStart;
    const lastDate = programSchedule
      .map((e) => new Date(e["Last Date"] + "T23:59:59"))
      .reduce((p, c) => (c > p ? c : p));
    const eventTitles = [...new Set(programEvents.map((e) => e.title))];
    const eventLocation = programEvents[0]["options"]["location"];
    deleteExistingEvents(firstDate, lastDate, eventTitles, eventLocation, calendarID);

    // add new calendar events within timeframe
    Logger.log(
      `Adding or updating ${programEvents.length} events at ${eventLocation} between ${firstDate} and ${lastDate} with titles ${eventTitles.map((x) => `"${x}"`).join("; ")}...`
    );
    for (const event of programEvents) {
      createEvent(event, calendarID, color);
    }
  }
}

/**
 * Requests and returns the number of days since the drop-in schedule data was updated from the Toronto Open Data Portal (https://open.toronto.ca/dataset/registered-programs-and-drop-in-courses-offering/).
 * @param {string=} url - URL of the Open Data Portal data source
 * @param {string=} resource - Resource ID from the Open Data Portal
 * @returns {number} - Number of days since the data was updated
 */
function getDaysSinceScheduleUpdate(
  url = DROP_IN_SCHEDULE_META,
  resource = DROP_IN_SCHEDULE_RESOURCE
) {
  let response = UrlFetchApp.fetch(url);
  if (response.getResponseCode() !== 200) {
    throw new Error(
      `Request to Toronto open data portal for drop in schedule metadata failed with response code ${response.getResponseCode()}`
    );
  }
  let data = JSON.parse(response);

  const [resourceMeta] = data.result.resources.filter((r) => r.id === resource);
  if (!resourceMeta) {
    throw new Error(`Resource ${resource} not found in data returned by ${url}`);
  }

  const dateLastUpdated = new Date(resourceMeta.last_modified);
  const today = new Date();
  const daysSinceUpdate = (today - dateLastUpdated) / (1000 * 60 * 60 * 24);

  return daysSinceUpdate;
}

/**
 * Requests and returns the drop-in schedule from the Toronto Open Data Portal (https://open.toronto.ca/dataset/registered-programs-and-drop-in-courses-offering/).
 * @param {string=} url - URL of the Open Data Portal data source
 * @returns {Array<DropInSchedule>}
 */
function getDropInSchedule(url = DROP_IN_SCHEDULE_URL) {
  let response = UrlFetchApp.fetch(url);
  if (response.getResponseCode() !== 200) {
    throw new Error(
      `Request to Toronto open data portal for drop in schedule failed with response code ${response.getResponseCode()}`
    );
  }
  let data = JSON.parse(response);
  return data;
}

/**
 * Requests and returns the facility locations from the Toronto Open Data Portal ()
 * @param {string=} url - URL of the Open Data Portal data source
 * @returns {Array<Location>}
 */
function getFacilityLocations(url = LOCATION_DATA_URL) {
  let response = UrlFetchApp.fetch(url);
  if (response.getResponseCode() !== 200) {
    throw new Error(
      `Request to Toronto open data portal for locations failed with response code ${response.getResponseCode()}`
    );
  }
  let data = JSON.parse(response);
  return data;
}

/**
 * Test whether user age fits program minimum and maximum age range
 * @param {DropInSchedule} entry
 * @param {number} userAge
 * @returns {boolean}
 */
function userIsInAgeRange(entry, userAge) {
  if (userAge === null) return true;

  const userAgeMonths = userAge * 12;
  let minTest, maxTest;
  const entryAgeMin = Number(entry["Age Min"]);
  const entryAgeMax = Number(entry["Age Max"]);

  if (entry["Age Min"] === "None") minTest = true;
  else if (Number.isInteger(entryAgeMin)) {
    minTest = userAgeMonths >= entryAgeMin;
  } else {
    throw new Error(
      `Unable to determine if user age matches program. User age: ${userAge} years, Program age min: ${entry["Age Min"]} months, for ${entry["Course Title"]} at location ${entry["Location ID"]}`
    );
  }

  if (entry["Age Max"] === "None") maxTest = true;
  else if (Number.isInteger(entryAgeMax)) {
    maxTest = userAgeMonths <= entryAgeMax;
  } else {
    throw new Error(
      `Unable to determine if user age matches program. User age: ${userAge} years, Program age max: ${entry["Age Max"]} months, for ${entry["Course Title"]} at location ${entry["Location ID"]}`
    );
  }

  return minTest && maxTest;
}

/**
 * Convert schedule entry into calendar event parameters
 * @param {DropInSchedule} entry
 * @returns {EventDetails}
 */
function convertEntryToEvent(entry, locations) {
  const title = `${entry["Course Title"]} (${generateAgeRangeDescription(entry)})`;
  const startTime = getStartDateTime(entry);
  let endTime = new Date(startTime);
  endTime.setHours(entry["End Hour"], entry["End Min"] ?? 0);
  const description = `More details at ${FACILITY_BASE_URL}${entry["Location ID"]}`;
  const location = getLocationAddress(entry["Location ID"], locations);

  return {
    title: title,
    startTime: startTime,
    endTime: endTime,
    options: {
      description: description,
      location: location,
    },
  };
}

/**
 * Delete calendar events within a specified date range if they have matching titles
 * @param {Date} firstDate
 * @param {Date} lastDate
 * @param {Array<string>} eventTitles
 * @param {string} eventLocation
 * @param {string} calendarID
 */
function deleteExistingEvents(
  firstDate,
  lastDate,
  eventTitles,
  eventLocation,
  calendarID
) {
  const inputCalendar = CalendarApp.getCalendarById(calendarID);
  const existingEvents = inputCalendar.getEvents(firstDate, lastDate);

  Logger.log(
    `Deleting ${existingEvents.length} existing events at ${eventLocation} between ${firstDate} and ${lastDate} with titles ${eventTitles.map((x) => `"${x}"`).join("; ")} ...`
  );
  for (let existingEvent of existingEvents) {
    if (
      eventTitles.includes(existingEvent.getTitle()) &&
      existingEvent.getLocation() === eventLocation
    ) {
      existingEvent.deleteEvent();
    }
  }
}

/**
 * Create a calendar event based on supplied event details
 * @param {EventDetails} eventDetails
 * @param {string} calendarID
 * @param {string=} color
 * @returns {Object} event
 */
function createEvent(eventDetails, calendarID, color) {
  const inputCalendar = CalendarApp.getCalendarById(calendarID);
  const event = inputCalendar.createEvent(
    eventDetails["title"],
    eventDetails["startTime"],
    eventDetails["endTime"],
    eventDetails["options"]
  );
  if (color) event.setColor(getCalendarColor(color));
  return event;
}

/**
 * Converts Location data into an address string. Assumes address is in Toronto, ON.
 * @param {number} location ID
 * @param {Array<Location>} locations
 * @returns {string}
 */
function getLocationAddress(locationID, locations) {
  const [location] = locations.filter((l) => l["Location ID"] === locationID);

  const convertNull = (x) => (x === "None" ? null : x);
  const streetNumber = convertNull(location["Street No"]);
  const streetNumberSuffix = convertNull(location["Street No Suffix"]);
  const streetName = convertNull(location["Street Name"]);
  const streetType = convertNull(location["Street Type"]);
  const streetDirection = convertNull(location["Street Direction"]);
  const postalCode = convertNull(location["Postal Code"]);

  const address = `${location["Location Name"]}, ${[streetNumber, streetNumberSuffix, streetName, streetType, streetDirection].join(" ").trim()}, Toronto, ON  ${postalCode}`;
  return address;
}

/**
 * Generate a description of a program's age range
 * @param {DropInSchedule} entry
 * @returns {string}
 */
function generateAgeRangeDescription(entry) {
  const entryAgeMin = Number(entry["Age Min"]);
  const entryAgeMax = Number(entry["Age Max"]);

  if (entry["Age Min"] === "None" && entry["Age Max"] === "None") {
    return "All Ages";
  } else if (entry["Age Min"] === "None" && Number.isInteger(entryAgeMax)) {
    return `Ages ${generateAgeDescription(entryAgeMax)} and under`;
  } else if (Number.isInteger(entryAgeMin) && entry["Age Max"] == "None") {
    return `Ages ${generateAgeDescription(entryAgeMin)} and over`;
  } else if (Number.isInteger(entryAgeMin) && Number.isInteger(entryAgeMax)) {
    return `Ages ${generateAgeDescription(entryAgeMin)} to ${generateAgeDescription(entryAgeMax)}`;
  } else {
    throw new Error(
      `Unable to generate age range description based on min age ${entry["Age Min"]} months and max age ${entry["Age Max"]} months`
    );
  }
}

/**
 * Generate an age description based on an age specified in number of months
 * @param {number} ageInMonths
 * @returns {string}
 */
function generateAgeDescription(ageInMonths) {
  const years = Math.floor(ageInMonths / 12);
  const months = ageInMonths % 12;
  const yearsDescription = years > 0 ? `${years} years` : null;
  const monthsDescription = months > 0 ? `${months} months` : null;
  return [yearsDescription, monthsDescription].join(" ").trim();
}

/**
 * Return calendar color enum based on various string or number inputs
 * @param {string | number} input
 * @returns {string} CalendarApp.EventColor enum
 */
function getCalendarColor(input) {
  inputCaseInsensitive = String(input).toLowerCase().trim();
  let calendarColor;
  switch (inputCaseInsensitive) {
    case CalendarApp.EventColor.PALE_BLUE:
    case "pale blue":
    case "lavender":
      calendarColor = CalendarApp.EventColor.PALE_BLUE;
      break;
    case CalendarApp.EventColor.PALE_GREEN:
    case "pale green":
    case "sage":
      calendarColor = CalendarApp.EventColor.PALE_GREEN;
      break;
    case CalendarApp.EventColor.MAUVE:
    case "mauve":
    case "grape":
      calendarColor = CalendarApp.EventColor.MAUVE;
      break;
    case CalendarApp.EventColor.PALE_RED:
    case "pale red":
    case "flamingo":
      calendarColor = CalendarApp.EventColor.PALE_RED;
      break;
    case CalendarApp.EventColor.YELLOW:
    case "yellow":
    case "banana":
      calendarColor = CalendarApp.EventColor.YELLOW;
      break;
    case CalendarApp.EventColor.ORANGE:
    case "orange":
    case "tangerine":
      calendarColor = CalendarApp.EventColor.ORANGE;
      break;
    case CalendarApp.EventColor.CYAN:
    case "cyan":
    case "peacock":
      calendarColor = CalendarApp.EventColor.CYAN;
      break;
    case CalendarApp.EventColor.GRAY:
    case "gray":
    case "grey":
    case "graphite":
      calendarColor = CalendarApp.EventColor.GRAY;
      break;
    case CalendarApp.EventColor.BLUE:
    case "blue":
    case "blueberry":
      calendarColor = CalendarApp.EventColor.BLUE;
      break;
    case CalendarApp.EventColor.GREEN:
    case "green":
    case "basil":
      calendarColor = CalendarApp.EventColor.GREEN;
      break;
    case CalendarApp.EventColor.RED:
    case "red":
    case "tomato":
      calendarColor = CalendarApp.EventColor.RED;
      break;
    default:
      calendarColor = null;
  }
  return calendarColor;
}

/* 
  WEB API FALLBACK
  ================
*/

const PROGRAM_TYPES = {
  fitness: "Fitness",
  skate: "Skating",
  sports: "Sports",
  swim: "Swimming",
  arts: "Arts",
  // unsure what the key is for "General"
};

/**
 * Return drop-in schedules for a list of locations using the Parks and Recreation Web API
 * @param {number[]} locations - Array of location ids
 * @param {object=} programTypes
 * @returns {Array<DropInSchedule>}
 */
function getAllDropInSchedulesWeb(locations, programTypes = PROGRAM_TYPES) {
  let schedules = [];
  for (const location of locations) {
    Logger.log(`Getting drop-in program data using Web API for location ${location}`);
    for (const type of Object.keys(programTypes)) {
      const schedule = getDropInScheduleWeb(location, type);
      schedules.push(...schedule);
    }
  }
  return schedules;
}

/**
 * Requests, formats, and returns the drop-in schedule from Parks, Forestry, and Education's web API for a specific location and program type
 * @param {number} location
 * @param {"fitness" | "skate" | "sports" | "swim" | "arts"} programType
 * @param {object=} programTypes
 * @returns {Array<DropInSchedule>}
 */
function getDropInScheduleWeb(location, programType, programTypes = PROGRAM_TYPES) {
  const info = pfrAPIRequest(location, programType, "info.json");

  let programs = [];
  const programCategory = programTypes[programType] ?? "Unknown";
  for (const week of info.weeks) {
    // check if week has programs
    const weekHasPrograms = week.hasPrograms;
    if (weekHasPrograms !== "true") continue;

    const weekStart = week.title;
    const weekResource = week.json;
    const weekSchedule = pfrAPIRequest(location, programType, weekResource);

    for (const program of weekSchedule.programs) {
      for (const day of program.days) {
        const programTitle = day.title;
        const programAgeDescription = day.age;
        const programAgeRange = getAgeRange(programAgeDescription);
        if (day.status !== "active") Logger.log("Found an inactive day");

        for (const time of day.times) {
          const programDayName = time.day;
          const programTimeDescription = time.title;
          if (time.status !== "active") Logger.log("Found an inactive time");

          const programDateTimes = getProgramDateTimes(
            weekStart,
            programDayName,
            programTimeDescription
          );

          programs.push({
            "Location ID": location,
            "Course Title": programTitle,
            ...programAgeRange,
            ...programDateTimes,
            Category: programCategory,
          });
        }
      }
    }
  }

  return programs;
}

/**
 * Requests and returns raw drop-in schedule data from Parks, Forestry, and Education's web API
 * @param {number} location
 * @param {string} programType
 * @param {"info.json" | "week1.json" | "week2.json", | "week3.json" | "week4.json"} resource
 * @returns {object}
 */
function pfrAPIRequest(location, programType, resource) {
  const url = `https://www.toronto.ca/data/parks/live/locations/${location}/${programType}/${resource}`;
  let response = UrlFetchApp.fetch(url);
  if (response.getResponseCode() !== 200) {
    throw new Error(
      `Request to PF&R web API for ${resource} for ${programType} at location ${location} failed with response code ${response.getResponseCode()}`
    );
  }
  let data = JSON.parse(response.getContentText("UTF-16"));
  return data;
}

/**
 * Function to return 'Age Min' and 'Age Max' values using age range description from Web API. Should be replaced later with a parsing function.
 * @param {string} programAgeDescription - e.g. "7 years and over", "6 - 12 years"
 * @param {object} ageRanges
 * @returns {object}
 */
function getAgeRange(programAgeDescription, ageRanges = WEB_API_AGE_RANGES) {
  if (!ageRanges.hasOwnProperty(programAgeDescription)) {
    Logger.log(`Unable to decode age range for description '${programAgeDescription}'`);
  }
  return ageRanges[programAgeDescription] ?? { "Age Min": "None", "Age Max": "None" };
}

/**
 * Function to get a Start Date Time from 'First Date', 'Start Hour', and 'Start Minute'
 * @param {DropInSchedule} entry
 * @returns {Date}
 */
function getStartDateTime(entry) {
  // Addition of time string required because of known quirk of Date: when the time zone offset is absent, date-only forms are interpreted as a UTC time
  const startDateTime = new Date(entry["First Date"] + "T00:00:00");
  startDateTime.setHours(entry["Start Hour"], entry["Start Minute"] ?? 0);
  return startDateTime;
}

/**
 * Function to return 'Start Hour', 'Start Minute', 'End Hour', 'End Min', 'First Date', and 'Last Date' values using data from Web API.
 * @param {string} weekStart - date string in YYYY-MM-DD format
 * @param {"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"} programDayName
 * @param {string} programTimeDescription - e.g. "07:45 PM - 09:00 PM"
 * @returns {object}
 */
function getProgramDateTimes(weekStart, programDayName, programTimeDescription) {
  const dayNumbers = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };

  if (!dayNumbers.hasOwnProperty(programDayName))
    throw Error(`Invalid programDayName '${programDayName}'`);

  // get the program date
  const weekStartDate = new Date(weekStart + "T00:00:00");
  const nextWeekStartDate = new Date(weekStartDate);
  nextWeekStartDate.setDate(weekStartDate.getDate() + 7);
  const programDate = new Date(weekStartDate);
  programDate.setDate(weekStartDate.getDate() + dayNumbers[programDayName]);
  const programDateString = programDate.toLocaleDateString("en-CA");

  // parse out the start and end times
  const [programStartTimeDescription, programEndTimeDescription] =
    programTimeDescription.split(" - ").map((s) => s.trim());
  const programStartDateTime = new Date(
    programDateString + " " + programStartTimeDescription
  );
  const programEndDateTime = new Date(
    programDateString + " " + programEndTimeDescription
  );

  return {
    "Start Hour": programStartDateTime.getHours(),
    "Start Minute": programStartDateTime.getMinutes(),
    "End Min": programEndDateTime.getMinutes(),
    "First Date": weekStart,
    "Last Date": nextWeekStartDate.toLocaleDateString("en-CA"),
  };
}

/*
Optional Utility - delete all calendar events

WARNING - this will delete ALL events within the specified time frame, regardless of whether they were generated by this script or not. By default, this function will not let you delete events from your account's main calendar.

To use:
- paste in the relevant Calendar ID from the "Integrate calendar" section of your Google Calendar settings
- select clearCalendar from the function drop down in Google Apps Script editor
- select "▶ Run"
*/
function clearCalendar(calendarID = "") {
  // date range to delete
  const startDate = new Date("January 1 2020");
  const endDate = new Date("December 31 2030");

  // failsafe
  const yourEmail = Session.getActiveUser().getEmail();
  if (yourEmail == calendarID) {
    Logger.log("Events not deleted - this is your account's main calendar.");
    return;
  }

  // get events in date range and delete
  const calendar = CalendarApp.getCalendarById(calendarID);
  let events = calendar.getEvents(startDate, endDate);
  for (let event of events) {
    event.deleteEvent();
  }
}

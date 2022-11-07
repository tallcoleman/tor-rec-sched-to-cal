/*
Script to pull drop-in program schedules from a City of Toronto webpage
Author: Ben Coleman (ben[dot]coleman[at]alum[dot]utoronto[dot]ca)
*/

// Fill out the config details in the 'programs' constant and create a weekly trigger to run this function
function updateSchedules() {
  /*
    CONFIGURATION
    -------------
  
    calendar_id: Calendar ID from the "Integrate calendar" section of your Google Calendar settings.
  
    facility_url: Webpage address for the City of Toronto recreation facility you want to sync a schedule from. The full list of facilities can be found here: https://www.toronto.ca/data/parks/prd/facilities/recreationcentres/index.html
    
    program_type: 'Arts', 'Fitness', 'General Interest', 'Skating', 'Sports', or 'Swimming'
  
    course_title: Title in the "Program" column of the schedule, e.g. "Lane Swim" or "Aquafit: Shallow". Do not include the age information below the course title.
  
    color: (Optional) an enum or number (as a string) from this list: https://developers.google.com/apps-script/reference/calendar/event-color, e.g. "1" or CalendarApp.EventColor.PALE_BLUE
  */
  const programs = [
    {
      'calendar_id': "",
      'facility_url': "",
      'program_type': "",
      'course_title': "",
      'color': ""
    }
  ];
  
  // update schedules
  scheduleSync(programs);
  }
  
  
function scheduleSync(programs) {
  // generic regular expressions
  const re_facility_name = /<div class="accbox">.*?<h1>\s*?(?<name>\S.*?)\s*?<\/h1>/s;
  const re_facility_address = /<span class="addressbar">.*?<span class="badge">\s+?(?<address>\S.*?)\s+?<span/s
  const re_date_row = /<thead>[\s\S]+?<\/thead>/m;
  const re_dates = /<th scope.*?>([\w\s]+?\d+?)<\/th>/gm;
  const re_program_time_collections = /<td class="coursehrscol">(.*?)<\/td>/gm;

  for (let {calendar_id, facility_url, program_type, course_title, color} of programs) {
    // per-program regular expressions
    const re_program_dropin = new RegExp(
      String.raw`<div.*?id="content_dropintype_` +
      program_type.split(' ')[0] +
      String.raw`".*?>[\s\S]+?<\/div>`,
      'm');
    const re_program_weeks = new RegExp(
      String.raw`<tr.*?id="dropin_` +
      program_type.split(' ')[0] +
      String.raw`_\d".*?>[\s\S]*?<td>[\s\S]*?<table>[\s\S]+?<\/table>[\s\S]*?<\/td>[\s\S]*?<\/tr>`,
    'gm');
    const re_program_row = new RegExp(
      String.raw`<tr>.*?<th.*?class="coursetitlecell".*?>.*?<span.*?class="coursetitlecol".*?>` +
      course_title +
      String.raw`[\s\S]+?<\/tr>`,
      'gm');
  
    // get html from facility page and pull out schedule section
    Logger.log(`Pulling data on ${program_type}: ${course_title} from ${facility_url}`);
    let response = UrlFetchApp.fetch(facility_url);
    let response_text = response.getContentText("UTF-8");
    let facility_name = response_text.match(re_facility_name).groups['name'];
    let facility_address = response_text.match(re_facility_address).groups['address'];
    let program_dropin = response_text.match(re_program_dropin)[0];
    let program_weeks = program_dropin.matchAll(re_program_weeks);
  
    // parse schedule section
    let program_data = [];
    for (let [program_week] of program_weeks) {
      // grab dates from header row
      let date_row = program_week.match(re_date_row)[0];
      let dates = [...date_row.matchAll(re_dates)].map(x => x[1]);
  
      // grab times from appropriate program row
      let program_row = program_week.match(re_program_row)[0];
      let program_time_collections = [...program_row.matchAll(re_program_time_collections)].map(x => x[1]);
      let program_times = program_time_collections.map(x => x.split("<hr />"));
  
      program_data = program_data.concat(zip(dates, program_times))
    }
  
    // Logger.log(program_data);
  
    // convert program times into Date object pairs
    let program_data_D = [];
    for (let program_date of program_data) {
      if (!program_date[1] || program_date[1][0] === "&nbsp;") continue; // catch &nbsp;
      program_data_D = program_data_D.concat(parseDates(program_date));
    }
  
    // Logger.log(program_data_D);
  
    // Update Google Calendar
    const input_calendar = CalendarApp.getCalendarById(calendar_id);
    const event_location = facility_name + ", " + facility_address;
  
    // delete current calendar events within input timeframe
    let earliest_date = program_data_D.reduce((p, c) => c[0] < p[0] ? c : p)[0];
    let latest_date   = program_data_D.reduce((p, c) => c[1] > p[1] ? c : p)[1];
    let existing_events = input_calendar.getEvents(earliest_date, latest_date);
  
    Logger.log(`Deleting existing events...`);
    for (let existing_event of existing_events) {
      if (existing_event.getTitle() === course_title && existing_event.getLocation() === event_location) {
        existing_event.deleteEvent();
      }
    }
    
    // add new calendar events within timeframe
    Logger.log(`Adding or updating ${program_data_D.length} events...`);
    for (let [start_D, end_D] of program_data_D) {
      let event = input_calendar.createEvent(
        course_title,
        start_D,
        end_D,
        {
          location: event_location,
          description: "More details at: " + facility_url
        }
      );
      if (color) event.setColor(color);
    }
  }
}
    
// Utility Functions
const zip = (a, b) => a.map((k, i) => [k, b[i]]);

function parseDates([date, times]) {
  // parse date
  let current_date = new Date().toString();
  let current_year = current_date.slice(11,15);
  let current_month = current_date.slice(4,7);
  let date_year = current_year;

  // catch year crossover
  if (current_month === "Dec" && date.slice(4,7) === "Jan") {
    date_year = (Number(date_year) + 1).toString();
  }

  // parse times
  const re_time = /(?<hours>\d{1,2}):?(?<minutes>\d{2})?(?<am_pm>am|pm)?/gi;
  let times_D = [];

  for (let time of times) {
    [start, end] = [...time.matchAll(re_time)];

    let end_D = new Date([
      date + ", ",
      date_year + " ",
      end.groups['hours'] + ":",
      end.groups['minutes'] ? end.groups['minutes'] : "00",
      " ",
      end.groups['am_pm']
    ].join(""));

    let start_D = new Date([
      date + ", ",
      date_year + " ",
      start.groups['hours'] + ":",
      start.groups['minutes'] ? start.groups['minutes'] : "00",
      " ",
      start.groups['am_pm'] ? start.groups['am_pm'] : end.groups['am_pm']
    ].join(""));

    times_D.push([start_D, end_D]);
  }

  return times_D;
}
  
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

    age_info: (Optional) Age information specified below the course title. Only use this if there are multiple courses with the same title but intended for different ages (e.g. "Fitness Workout /  (18yrs and over)" and "Fitness Workout /  (60yrs and over)").
  
    color: (Optional) a number (as a string) from this list: https://github.com/tallcoleman/tor-rec-sched-to-cal#guide-to-updated-google-calendar-colors, e.g. "1" 
  */
  const programs = [
    {
      'calendar_id': "",
      'facility_url': "",
      'program_type': "",
      'course_title': "",
      'age_info': "", // optional
      'color': "" // optional
    }
  ];
  
  // update schedules
  scheduleSync(programs);
  }
  
  
  function scheduleSync(programs) {
    // generic regular expressions
    const re_facility_name = /<div class="accbox">.*?<h1>\s*?(?<name>\S.*?)\s*?<\/h1>/s;
    const re_facility_address = /<div class="accbox">.*?Address:.*?<span>\s+?(?<address>\S.*?)\s+?<\/strong>/s;
    const re_date_row = /<thead>[\s\S]+?<\/thead>/m;
    const re_dates = /<th scope.*?>([\w\s]+?\d+?)<\/th>/gm;
    const re_program_time_collections = /<td class="coursehrscol">(.*?)<\/td>/gm;
  
    for (let {calendar_id, facility_url, program_type, course_title, age_info, color} of programs) {
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
      const re_program_rows = new RegExp(
        String.raw`<tr>.*?<th.*?class="coursetitlecell".*?>.*?<span.*?class="coursetitlecol".*?>` +
        course_title +
        String.raw`<\/span>[\s\S]+?<span.*?class="courseagecol".*?>(?<age_info>.*?)<\/span>[\s\S]+?<\/tr>`,
        'gm');
    
      // get html from facility page and pull out schedule section
      Logger.log(`Pulling data on ${program_type}: ${course_title} from ${facility_url}`);
      let response = UrlFetchApp.fetch(facility_url);
      let response_text = response.getContentText("UTF-8");
      let facility_name = response_text.match(re_facility_name).groups['name'];
      Logger.log(`(${facility_name})`);
      let facility_address = response_text.match(re_facility_address).groups['address'];
      let program_dropin = response_text.match(re_program_dropin)[0];
      let program_weeks = program_dropin.matchAll(re_program_weeks);
    
      // parse schedule section
      let program_data = [];
      let result_dates = [];
      for (let [program_week] of program_weeks) {
        // grab dates from header row
        let date_row = program_week.match(re_date_row)[0];
        let dates = [...date_row.matchAll(re_dates)].map(x => x[1]);
        result_dates = result_dates.concat(dates);
    
        // grab times from appropriate program rows
        let program_rows = [...program_week.matchAll(re_program_rows)];
        if (program_rows.length > 0) {
          for (let program_row of program_rows) {
            // check age info matches if specified
            let program_age_info = program_row.groups['age_info'].trim();
            if (age_info && (program_age_info !== age_info)) continue;
            
            // collect dates and times for program week
            let program_time_collections = [...program_row[0].matchAll(re_program_time_collections)].map(x => x[1]);
            let program_times = program_time_collections.map(x => x.split("<hr />"));
            for (let data_row of zip(dates, program_times)) {
              program_data.push({
                'date_raw': data_row[0],
                'times_raw': data_row[1],
                'program_age_info': program_age_info
              });
            }
          } 
        }
      }
      
      // convert date headers into Date objects
      let result_dates_D = result_dates.map((datestring) => parseDates(datestring)[0]);
  
      // skip calendar updates if there are no results
      // Note: this may result in cancelled events not being removed from the calendar
      if (program_data.length === 0) continue;
  
      // convert program times into Date object pairs
      let program_data_D = program_data.map(function(program_date){
        if (!program_date['times_raw'] || program_date['times_raw'][0] === "&nbsp;") return null; // catch &nbsp;
        let date_pairs = parseDates(program_date['date_raw'],program_date['times_raw']);
        return date_pairs.map(function(date_pair){
          return {
          'start_Date': date_pair[0],
          'end_Date': date_pair[1],
          'program_title': `${course_title} ${program_date['program_age_info']}`,
          'program_age_info': program_date['program_age_info']
          };
        });
      }).filter(e => !!e).flat();
  
      // Update Google Calendar
      const input_calendar = CalendarApp.getCalendarById(calendar_id);
      const event_location = facility_name + ", " + facility_address;
    
      // delete current calendar events within result timeframe
      let earliest_date = result_dates_D.reduce((p, c) => c < p ? c : p);
      let latest_date = result_dates_D.reduce((p, c) => c > p ? c : p);
      let existing_events = input_calendar.getEvents(earliest_date, latest_date);
      let program_titles = program_data_D.map(e => e['program_title']).filter(onlyUnique);
    
      Logger.log(`Deleting existing events...`);
      for (let existing_event of existing_events) {
        if (program_titles.includes(existing_event.getTitle()) && existing_event.getLocation() === event_location) {
          existing_event.deleteEvent();
        }
      }
      
      // add new calendar events within timeframe
      Logger.log(`Adding or updating ${program_data_D.length} events...`);
      for (let {start_Date, end_Date, program_age_info} of program_data_D) {
        let event = input_calendar.createEvent(
          `${course_title} ${program_age_info}`,
          start_Date,
          end_Date,
          {
            location: event_location,
            description: `More details at: ${facility_url}`
          }
        );
        if (color) event.setColor(color);
      }
    }
  }
      
  // Utility Functions
  const zip = (a, b) => a.map((k, i) => [k, b[i]]);
  
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
  
  /**
   * Returns an array of Date objects parsed from text strings
   * 
   * @param {string} date Date text string without a year, e.g. "Mon Aug 28"
   * @param {string} [times] Optional: time string, e.g. "7 - 9:15am"
   * @return {array}
   */
  function parseDates(date, times) {
    // parse date
    let current_date = new Date().toString();
    let current_year = current_date.slice(11,15);
    let current_month = current_date.slice(4,7);
    let date_year = current_year;
  
    // catch year crossover
    if (current_month === "Dec" && date.slice(4,7) === "Jan") {
      date_year = (Number(date_year) + 1).toString();
    }
  
    // return date only if no times
    if (times === undefined) {
      return [new Date(date + ", " + date_year)];
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

/*
Optional Utility - delete all calendar events

WARNING - this will delete ALL events within the specified time frame, regardless of whether they were generated by this script or not. By default, this function will not let you delete events from your account's main calendar.

To use:
- paste in the relevant Calendar ID from the "Integrate calendar" section of your Google Calendar settings
- select clearCalendar from the function drop down in Google Apps Script editor
- select "▶ Run"
*/ 
function clearCalendar() {
  // calendar to delete events from
  const calendar_id = "";
  // date range to delete
  const start_date = new Date("January 1 2020");
  const end_date = new Date("December 31 2030");

  // failsafe
  const yourEmail = Session.getActiveUser().getEmail();
  if (yourEmail == calendar_id) {
    Logger.log("Events not deleted - this is your account's main calendar.")
    return;
  }

  // get events in date range and delete
  const calendar = CalendarApp.getCalendarById(calendar_id);
  let events = calendar.getEvents(start_date, end_date);
  for (let event of events) {
    event.deleteEvent();
  }
}

# Toronto Recreation Schedule to Google Calendar

 A Google Apps Script to sync a City of Toronto recreation program schedule (e.g. swimming times) to your Google calendar.

 ## Installation

1. Open Google Apps Script at [script.google.com](https://script.google.com) and log in to your Google Account if neccessary.

2. Copy the [schedulesync.gs script](https://github.com/tallcoleman/tor-rec-sched-to-cal/blob/main/schedulesync.gs), paste it into the script editor, and select 'Save'. (You can delete any existing text in the editor.)

3. At this point, it is also a good idea to rename the script project from 'Untitled project' to something like "Toronto Rec Schedule Sync". You can rename the project by selecting its name at the top of your screen.

4. Fill out the config details below where it says `const programs = [`. There are instructions in the script and samples below for additional help.

5. To the right of the icon is a function drop-down (it will probably say 'updateSchedules'). Open this drop-down, select 'updateSchedules', and then select 'Run'. This will sync your selected schedule(s) to your calendar for the first time.

6. Since this is the first time you are using the script, it will ask you for permissions. (If you are unfamiliar with Google Apps Script permissions, you can [read a short explainer below](#google-apps-script-permissions-why-does-google-say-this-script-is-unsafe).)

7. After selecting "Continue", you may come to a screen that says "Google hasn't verified this app". If you are presented with this screen, select "Advanced" at the bottom-left and then "Go to Untitled project (unsafe)".

8. When you reach the permissions screen, select "Allow".

9.  Check to make sure that the script ran correctly and that the events have appeared in your calendar.

10. In order to run the script every week, you will have to set up a trigger. In the menu to the left, select the alarm clock icon to go to the Triggers menu. Select "Add Trigger" at the bottom-right.

11. Choose or leave the following trigger settings and then select save. You should be all done!

### Trigger Settings

* **Which function to run:** updateSchedules
* **Which deployment to run:** Head
* **Event source:** Time-driven
* **Type of time based trigger:** Week timer
* **Day of week:** Every Monday (or your choice)
* **Time of Day:** Midnight to 1am (or your choice)
* **Failure notification settings:** Notify me immediately (or your choice)

## Example Configurations

One schedule, e.g. the regular lane swim at [North Toronto Memorial Community Centre](https://www.toronto.ca/data/parks/prd/facilities/complex/189/index.html):

```js
const programs = [
    {
      'calendar_id': "<example>@group.calendar.google.com",
      'facility_url': "https://www.toronto.ca/data/parks/prd/facilities/complex/189/index.html",
      'program_type': "Swimming",
      'course_title': "Lane Swim",
      'color': ""
    }
  ];
```

Multiple schedules (can be in the same calendar), e.g. Bridge and Gentle AquaFit at North Toronto Memorial, with AquaFit events coloured blue:

```js
const programs = [
    {
      'calendar_id': "<example>@group.calendar.google.com",
      'facility_url': "https://www.toronto.ca/data/parks/prd/facilities/complex/189/index.html",
      'program_type': "General Interest",
      'course_title': "Cards: Bridge",
      'color': ""
    },
    {
      'calendar_id': "<example>@group.calendar.google.com",
      'facility_url': "https://www.toronto.ca/data/parks/prd/facilities/complex/189/index.html",
      'program_type': "Swimming",
      'course_title': "Aquafit: Gentle",
      'color': CalendarApp.EventColor.BLUE
    }
  ];
```

## Google Apps Script Permissions (Why does Google say this script is unsafe?)
Google Apps use the same security system for scripts that you write (or copy in) yourself and add-ons created by third parties. The permissions system is therefore designed to be very cautious so that users do not give third parties unintended permissions for their Google Account.

The permissions used by the script are required for the following reasons:

**See, edit, share, and permanently delete all the calendars you can access using Google Calendar**

This permission is required for the script to add and update events in your calendar. The script will not share your calendar or delete any events other than the ones it keeps updated.

**Connect to an external service**

This permission is required for the script to read City of Toronto webpages. The script only reads data and does not send any of your data to an external service.


## Troubleshooting

If you have any problems or questions while using the script, please open a new issue in the "Issues" tab of this repository.

## Guide to Updated Google Calendar Colors

The documentation for the [EventColor Enum](https://developers.google.com/apps-script/reference/calendar/event-color) appears to be out of date. The actual colors you will get from the following Enums/Indexes are as follows:

| Property Name | Index | Documentation Description                                                                                   | Actual Color                                                                                               |
| :------------ | :---- | :---------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| PALE_BLUE     | "1"   | <div style="background-color: #A4BDFC; display: inline-block; height: 10px; width: 10px;"></div> Pale Blue  | <div style="background-color: #7B86C6; display: inline-block; height: 10px; width: 10px;"></div> Lavender  |
| PALE_GREEN    | "2"   | <div style="background-color: #7AE7BF; display: inline-block; height: 10px; width: 10px;"></div> Pale Green | <div style="background-color: #5DB47E; display: inline-block; height: 10px; width: 10px;"></div> Sage      |
| MAUVE         | "3"   | <div style="background-color: #BDADFF; display: inline-block; height: 10px; width: 10px;"></div> Mauve      | <div style="background-color: #832DA4; display: inline-block; height: 10px; width: 10px;"></div> Grape     |
| PALE_RED      | "4"   | <div style="background-color: #FF887C; display: inline-block; height: 10px; width: 10px;"></div> Pale Red   | <div style="background-color: #D88177; display: inline-block; height: 10px; width: 10px;"></div> Flamingo  |
| YELLOW        | "5"   | <div style="background-color: #FBD75B; display: inline-block; height: 10px; width: 10px;"></div> Yellow     | <div style="background-color: #EDC14B; display: inline-block; height: 10px; width: 10px;"></div> Banana    |
| ORANGE        | "6"   | <div style="background-color: #FFB878; display: inline-block; height: 10px; width: 10px;"></div> Orange     | <div style="background-color: #E25D33; display: inline-block; height: 10px; width: 10px;"></div> Tangerine |
| CYAN          | "7"   | <div style="background-color: #46D6DB; display: inline-block; height: 10px; width: 10px;"></div> Cyan       | <div style="background-color: #4599DF; display: inline-block; height: 10px; width: 10px;"></div> Peacock   |
| GRAY          | "8"   | <div style="background-color: #E1E1E1; display: inline-block; height: 10px; width: 10px;"></div> Gray       | <div style="background-color: #616161; display: inline-block; height: 10px; width: 10px;"></div> Graphite  |
| BLUE          | "9"   | <div style="background-color: #5484ED; display: inline-block; height: 10px; width: 10px;"></div> Blue       | <div style="background-color: #4350AF; display: inline-block; height: 10px; width: 10px;"></div> Blueberry |
| GREEN         | "10"  | <div style="background-color: #51B749; display: inline-block; height: 10px; width: 10px;"></div> Green      | <div style="background-color: #397E49; display: inline-block; height: 10px; width: 10px;"></div> Basil     |
| RED           | "11"  | <div style="background-color: #DC2127; display: inline-block; height: 10px; width: 10px;"></div> Red        | <div style="background-color: #C3291C; display: inline-block; height: 10px; width: 10px;"></div> Tomato    |
# Toronto Recreation Schedule to Google Calendar

 A Google Apps Script to sync a City of Toronto recreation program schedule (e.g. swimming times) to your Google calendar.

 ## Installation

1. Open Google Apps Script at [script.google.com](https://script.google.com) and log in to your Google Account if neccessary.

2. Copy the [schedulesync.gs script](https://github.com/tallcoleman/tor-rec-sched-to-cal/blob/main/schedulesync.gs), paste it into the script editor, and select 'Save'. (You can delete any existing text in the editor.)

3. At this point, it is also a good idea to rename the script project from 'Untitled project' to something like "Toronto Rec Schedule Sync". You can rename the project by selecting its name at the top of your screen.

4. Fill out the config details below where it says `const programs = [`. There are instructions in the script and samples below for additional help. You might also find it helpful to [create a separate calendar](https://support.google.com/calendar/answer/37095?hl=en) for the script.

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
      'age_info': "",
      'color': ""
    }
  ];
```

Multiple schedules (can be in the same calendar), e.g. Bridge and Gentle AquaFit at North Toronto Memorial, with AquaFit events [coloured "Lavender"](#guide-to-updated-google-calendar-colors):

```js
const programs = [
    {
      'calendar_id': "<example>@group.calendar.google.com",
      'facility_url': "https://www.toronto.ca/data/parks/prd/facilities/complex/189/index.html",
      'program_type': "General Interest",
      'course_title': "Cards: Bridge",
      'age_info': "",
      'color': ""
    },
    {
      'calendar_id': "<example>@group.calendar.google.com",
      'facility_url': "https://www.toronto.ca/data/parks/prd/facilities/complex/189/index.html",
      'program_type': "Swimming",
      'course_title': "Aquafit: Gentle",
      'age_info': "",
      'color': "1"
    }
  ];
```

Beginner Pilates at North Toronto Memorial, but only for ages 16 and older:

```js
const programs = [
    {
      'calendar_id': "<example>@group.calendar.google.com",
      'facility_url': "https://www.toronto.ca/data/parks/prd/facilities/complex/189/index.html",
      'program_type': "Fitness",
      'course_title': "Pilates - Beginner",
      'age_info': "(16yrs and over)",
      'color': ""
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

| Property Name | Index | Documentation Description                                           | Actual Color                                                       |
| :------------ | :---- | :------------------------------------------------------------------ | :----------------------------------------------------------------- |
| PALE_BLUE     | "1"   | ![#A4BDFC](https://placehold.co/10x10/A4BDFC/A4BDFC.png) Pale Blue  | ![#7B86C6](https://placehold.co/10x10/7B86C6/7B86C6.png) Lavender  |
| PALE_GREEN    | "2"   | ![#7AE7BF](https://placehold.co/10x10/7AE7BF/7AE7BF.png) Pale Green | ![#5DB47E](https://placehold.co/10x10/5DB47E/5DB47E.png) Sage      |
| MAUVE         | "3"   | ![#BDADFF](https://placehold.co/10x10/BDADFF/BDADFF.png) Mauve      | ![#832DA4](https://placehold.co/10x10/832DA4/832DA4.png) Grape     |
| PALE_RED      | "4"   | ![#FF887C](https://placehold.co/10x10/FF887C/FF887C.png) Pale Red   | ![#D88177](https://placehold.co/10x10/D88177/D88177.png) Flamingo  |
| YELLOW        | "5"   | ![#FBD75B](https://placehold.co/10x10/FBD75B/FBD75B.png) Yellow     | ![#EDC14B](https://placehold.co/10x10/EDC14B/EDC14B.png) Banana    |
| ORANGE        | "6"   | ![#FFB878](https://placehold.co/10x10/FFB878/FFB878.png) Orange     | ![#E25D33](https://placehold.co/10x10/E25D33/E25D33.png) Tangerine |
| CYAN          | "7"   | ![#46D6DB](https://placehold.co/10x10/46D6DB/46D6DB.png) Cyan       | ![#4599DF](https://placehold.co/10x10/4599DF/4599DF.png) Peacock   |
| GRAY          | "8"   | ![#E1E1E1](https://placehold.co/10x10/E1E1E1/E1E1E1.png) Gray       | ![#616161](https://placehold.co/10x10/616161/616161.png) Graphite  |
| BLUE          | "9"   | ![#5484ED](https://placehold.co/10x10/5484ED/5484ED.png) Blue       | ![#4350AF](https://placehold.co/10x10/4350AF/4350AF.png) Blueberry |
| GREEN         | "10"  | ![#51B749](https://placehold.co/10x10/51B749/51B749.png) Green      | ![#397E49](https://placehold.co/10x10/397E49/397E49.png) Basil     |
| RED           | "11"  | ![#DC2127](https://placehold.co/10x10/DC2127/DC2127.png) Red        | ![#C3291C](https://placehold.co/10x10/C3291C/C3291C.png) Tomato    |
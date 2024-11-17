# Toronto Recreation Schedule to Google Calendar

 A Google Apps Script to sync a City of Toronto recreation program schedule (e.g. lane swim times) to your Google calendar.

 This script uses Open Data from the City of Toronto, specifically the "Facilities" and "Drop-In" datasets from https://open.toronto.ca/dataset/registered-programs-and-drop-in-courses-offering/.

 ## Installation

1. Open Google Apps Script at [script.google.com](https://script.google.com) and log in to your Google Account if neccessary.

2. Copy the [schedulesync.gs script](https://github.com/tallcoleman/tor-rec-sched-to-cal/blob/main/schedulesync.gs), paste it into the script editor, and select 'Save'. (You can delete any existing text in the editor.)

3. At this point, it is also a good idea to rename the script project from 'Untitled project' to something like "Toronto Rec Schedule Sync". You can rename the project by selecting its name at the top of your screen.

4. Fill out the config details below where it says `const programs = [`. There are instructions in the script and samples below for additional help. I also **strongly** recommend [creating a separate calendar](https://support.google.com/calendar/answer/37095?hl=en) for the script so that you avoid creating any problems with the main calendar in your account.

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

For all of these:

- The number for **locationID** can be found at the very end of the webpage URL
- The value for **calendarID** can be found in the "Integrate calendar" section of your Google Calendar settings
- **userAge** is optional and helps to select programs within a relevant age range
- **color** is also optional

One schedule, e.g. the regular lane swim at [North Toronto Memorial Community Centre](https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=189):

```js
const programs = [
    {
      locationID: 189,
      courseTitle: "Lane Swim",
      calendarID: "LONG_STRING_OF_LETTERS_AND_NUMBERS@group.calendar.google.com",
      userAge: 40,
    },
  ];
```

Multiple schedules (can be in the same calendar), e.g. Bridge and Gentle AquaFit at North Toronto Memorial, with AquaFit events [coloured "Peacock"](#guide-to-updated-google-calendar-colors):

```js
const programs = [
    {
      locationID: 189,
      courseTitle: "Cards: Bridge",
      calendarID: "LONG_STRING_OF_LETTERS_AND_NUMBERS@group.calendar.google.com",
      userAge: 40,
    },
    {
      locationID: 189,
      courseTitle: "Aquafit: Gentle",
      calendarID: "LONG_STRING_OF_LETTERS_AND_NUMBERS@group.calendar.google.com",
      userAge: 40,
      color: "Peacock", // other values to get this color: "1", "Pale Blue"
    },
  ];
```

Pilates at North Toronto Memorial, including the programs for ages 60 and older:

```js
const programs = [
    {
      locationID: 189,
      courseTitle: "Pilates",
      calendarID: "LONG_STRING_OF_LETTERS_AND_NUMBERS@group.calendar.google.com",
      userAge: 65,
    },
  ];
```

## Google Apps Script Permissions (Why does Google say this script is unsafe?)
Google Apps use the same security system for scripts that you write (or copy in) yourself and add-ons created by third parties. The permissions system is therefore designed to be very cautious so that users do not give third parties unintended permissions for their Google Account.

The permissions used by the script are required for the following reasons:

**See, edit, share, and permanently delete all the calendars you can access using Google Calendar**

This permission is required for the script to add and update events in your calendar. The script will not share your calendar or delete any events other than the ones it keeps updated.

**Connect to an external service**

This permission is required for the script to read the City of Toronto open data API. The script only reads data and does not send any of your data to an external service.


## Troubleshooting

If you have any problems or questions while using the script, please open a new issue in the "Issues" tab of this repository.

If you want to delete all the events in a specific calendar so that you can run the script from scratch, see the instructions for the `clearCalendar` function at the bottom of [schedulesync.gs](https://github.com/tallcoleman/tor-rec-sched-to-cal/blob/main/schedulesync.gs).

## Guide to Updated Google Calendar Colors

The documentation for the [EventColor Enum](https://developers.google.com/apps-script/reference/calendar/event-color) appears to be out of date. The actual colors you will get from the following Enums/Indexes are as follows:

| Property Name | Index | Documentation Description                                           | Actual Color                                                       |
| :------------ | :---- | :------------------------------------------------------------------ | :----------------------------------------------------------------- |
| PALE_BLUE     | "1"   | ![#A4BDFC](https://placehold.co/10x10/A4BDFC/A4BDFC.png) Pale Blue  | ![#4599DF](https://placehold.co/10x10/4599DF/4599DF.png) Peacock   |
| PALE_GREEN    | "2"   | ![#7AE7BF](https://placehold.co/10x10/7AE7BF/7AE7BF.png) Pale Green | ![#5DB47E](https://placehold.co/10x10/5DB47E/5DB47E.png) Sage      |
| MAUVE         | "3"   | ![#BDADFF](https://placehold.co/10x10/BDADFF/BDADFF.png) Mauve      | ![#832DA4](https://placehold.co/10x10/832DA4/832DA4.png) Grape     |
| PALE_RED      | "4"   | ![#FF887C](https://placehold.co/10x10/FF887C/FF887C.png) Pale Red   | ![#D88177](https://placehold.co/10x10/D88177/D88177.png) Flamingo  |
| YELLOW        | "5"   | ![#FBD75B](https://placehold.co/10x10/FBD75B/FBD75B.png) Yellow     | ![#EDC14B](https://placehold.co/10x10/EDC14B/EDC14B.png) Banana    |
| ORANGE        | "6"   | ![#FFB878](https://placehold.co/10x10/FFB878/FFB878.png) Orange     | ![#E25D33](https://placehold.co/10x10/E25D33/E25D33.png) Tangerine |
| CYAN          | "7"   | ![#46D6DB](https://placehold.co/10x10/46D6DB/46D6DB.png) Cyan       | ![#7B86C6](https://placehold.co/10x10/7B86C6/7B86C6.png) Lavender  |
| GRAY          | "8"   | ![#E1E1E1](https://placehold.co/10x10/E1E1E1/E1E1E1.png) Gray       | ![#616161](https://placehold.co/10x10/616161/616161.png) Graphite  |
| BLUE          | "9"   | ![#5484ED](https://placehold.co/10x10/5484ED/5484ED.png) Blue       | ![#4350AF](https://placehold.co/10x10/4350AF/4350AF.png) Blueberry |
| GREEN         | "10"  | ![#51B749](https://placehold.co/10x10/51B749/51B749.png) Green      | ![#397E49](https://placehold.co/10x10/397E49/397E49.png) Basil     |
| RED           | "11"  | ![#DC2127](https://placehold.co/10x10/DC2127/DC2127.png) Red        | ![#C3291C](https://placehold.co/10x10/C3291C/C3291C.png) Tomato    |

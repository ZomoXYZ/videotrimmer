# videotrimmer

[trello todo list](https://trello.com/b/B28JSPwF/videotrimmer-features)

## known issue

[video playback timing is inaccurate](https://github.com/w3c/media-and-entertainment/issues/4) which may cause the start and end timings to be off by a frame or two.

[dmg-license](https://github.com/argv-minus-one/dmg-license) uses an outdated version of `plist`, resulting in [`xmldom` running a version with a theoretical vulnerability](https://www.npmjs.com/advisories/1769), this is outside of my control, and I have to wait for that package to update

## changelog

### v1.1.0

**changes**

- changed how temp files work
  - temp folders are now per-video rather than in the application folder
- moved source code into the src file
- translated all code to typescript

**fixes**

- issue where variables could be read before defined

### v1.0.2

**changes**

- I'm dumb

### v1.0.1

**changes**

- fixed critical bug in normalize audio function

### v1.0.0

**changes**

- improved editor options framework
  - this improves maintainability and allows for more complex effects
- progress bar shows more detailed information

- changed `AppDataPath()` in `main.js` to use the app name rather than just `Ashley-VideoTrimmer`

**additions**

- auto update
- more detailed compression
  - auto and discord auto
- audio normalization
- settings button on main screen

**fixes**

- update checker would give false positives
- progress bar wouldn't revert from circle
- updated dependencies

**notes**

- while the settings page does exist and is functional, it is not styled well and will be updated whenever I get around to finishing it

### v0.4.2

**fixes**

- critical error preventing user from using left/right arrow keys in editor page
- update checker now works

### v0.4.1

**additions**

- window will start up immediately and say Loading while downloading ffmpeg
- error screen has been updated to catch all errors on its own and to display the error

### v0.4.0

**fixes**

- page will (finally) no longer flicker when file is hovering over page

**additions**

- version number is now displayed on primary screen
- editor screen will scale down if it isn't all visible
- added a cancel/finish button to final page

#### versions lower than this were numbered incorrectly, and have been fixed above

### v0.0.3

**fixes**

- reorganized `index.js` code
  - moved the video player functionality into its own file (`modules/editor.js`)
  - now using [`fluent-ffmpeg` from npm](https://www.npmjs.com/package/fluent-ffmpeg) to create the ffmpeg command
- commented `index.js`
- ffmpeg will no longer reencode the audio and video when not needed

### v0.0.2

**fixes**

- hovering video over app no longer flickers
- video in editor will now pause when using arrow keys for frame by frame viewing
- video in editor will now pause and keyboard shortcuts will be disabled when the editor screen is no longer visible
- removed horizontal scrollbar for the progress screen
- fixed autoscroll for the progress screen
- fixed compressing as same file

**additions**

- electron has been updated
- dev tools are now available and a button was added to the error screen to view the console

### v0.0.1

Initial Program
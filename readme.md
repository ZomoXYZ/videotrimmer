# videotrimmer v1.0.0 beta

## current features/issues being worked on

- on cancel, delete temps and final if there
- on finish, delete temps

# videotrimmer

[trello todo list](https://trello.com/b/B28JSPwF/videotrimmer-features)

## known issue

[video playback timing is inaccurate](https://github.com/w3c/media-and-entertainment/issues/4) which may cause the start and end timings to be off by a frame or two.

## changelog

### v1.0.0

**changes**

- improved editor options framework
  - this improves maintainability and allows for more complex effects

**additions**

- ~~auto update~~ soon
- more detailed compression
  - auto and discord auto
- ~~audio normalization~~ soon
- ~~button to display keybinds~~ soon

**fixes**

- update checker would give false positives
- progress bar wouldn't revert from circle

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
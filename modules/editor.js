module.exports = (video, onload, error) => {
    /*
     * video: video html element
     * error: callback function in case of error
     */
    
    //base definitions
    var videoPos = 0,
        trimStartPos = 0,
        trimEndPos = 0,
        videoPositionDragging = false,
        trimStartDragging = false,
        trimEndDragging = false,
        volumeDragging = false,
        savedLeftPosition = 0,
        
        isOpen = false,
        
        videoData = {};
    
    //calculate where the positions of each point should be in each bar
    function calculatePositionBar() {
        if (isOpen && !videoPositionDragging && !trimStartDragging && !trimEndDragging && !volumeDragging) {
            
            console.log(trimStartPos, trimEndPos);
            
            if (video.currentTime >= trimEndPos && !video.paused)
                video.pause();
            
            if (video.currentTime < trimStartPos)
                video.currentTime = trimStartPos;
            else if (video.currentTime > trimEndPos)
                video.currentTime = trimEndPos;
            
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(video.currentTime));
            
            let videoWidth = parseFloat(getComputedStyle(document.getElementById('videoBar')).width) - 2,
                volumeWidth = parseFloat(getComputedStyle(document.getElementById('volumeBar')).width);
            
            document.querySelector('#videoBar .position').style.left = video.currentTime/video.duration*videoWidth;
            document.querySelector('#videoBar .trimstart').style.left = trimStartPos/video.duration*videoWidth;
            document.querySelector('#videoBar .trimend').style.left = trimEndPos/video.duration*videoWidth;
            document.querySelector('#volumeBar .position').style.left = video.volume*volumeWidth;
            
            videoPos = video.currentTime;
        }
    }
    
    //error catching
    video.addEventListener('error', () => {
        console.error(video.error);
        error(video.error)
        document.body.classList.remove('processing');
        document.body.classList.add('error');
    });
    
    //on video load
    video.addEventListener('progress', () => {
        document.getElementById('currentTime').textContent = secondsToTime(Math.floor(video.currentTime));
        document.getElementById('endTime').textContent = secondsToTime(video.duration);
        trimEndPos = video.duration;
        calculatePositionBar();
        document.body.classList.remove('processing');
        document.body.classList.add('editor');
        onload();
    });
    
    //general video listeners
    video.addEventListener('timeupdate', calculatePositionBar);
    video.addEventListener('volumechange', calculatePositionBar);
    video.addEventListener('click', () => {
        if (video.paused)
            video.play();
        else
            video.pause();
    });
    
    //recalculate positions of points in bars on window resize
    addEventListener('resize', calculatePositionBar);
    
    //begin dragging points
    document.querySelector('#videoBar .position').addEventListener('mousedown', () => {
        videoPositionDragging = true;
        savedLeftPosition = document.querySelector('#videoBar .position').style.left;
        video.pause();
    });
    document.querySelector('#videoBar .trimstart').addEventListener('mousedown', () => {
        trimStartDragging = true;
        savedLeftPosition = document.querySelector('#videoBar .position').style.left;
        video.pause();
    });
    document.querySelector('#videoBar .trimend').addEventListener('mousedown', () => {
        trimEndDragging = true;
        savedLeftPosition = document.querySelector('#videoBar .position').style.left;
        video.pause();
    });
    document.querySelector('#volumeBar .position').addEventListener('mousedown', () => {
        volumeDragging = true;
    });
    
    //continue dragging points
    document.addEventListener('mousemove', e => {
        let videoBar = document.getElementById('videoBar').getBoundingClientRect(),
            left = e.clientX - videoBar.left;

        if (left < 0)
            left = 0;
        else if (left > videoBar.width)
            left = videoBar.width;
        
        if (videoPositionDragging) {
            
            if (left < document.querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left)
                left = document.querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left;
            else if (left > document.querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left)
                left = document.querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left;
            
            let percent = left/videoBar.width,
                leftVisible = percent*parseFloat(getComputedStyle(document.getElementById('videoBar')).width);
            
            document.querySelector('#videoBar .position').style.left = leftVisible;
            
            video.currentTime = videoPos = percent*video.duration;
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(percent*video.duration));
            
        } else if (trimStartDragging) {
            
            if (left > document.querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left)
                left = document.querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left;
            
            let percent = left/videoBar.width,
                leftVisible = percent*parseFloat(getComputedStyle(document.getElementById('videoBar')).width);
            
            document.querySelector('#videoBar .trimstart').style.left = leftVisible;
            
            video.currentTime = trimStartPos = percent*video.duration;
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(percent*video.duration));
            
            document.getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            
            if (trimStartPos >= videoPos)
                document.querySelector('#videoBar .position').style.left = leftVisible;
            else
                document.querySelector('#videoBar .position').style.left = savedLeftPosition;
            
        } else if (trimEndDragging) {
            
            if (left < document.querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left)
                left = document.querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left;
            
            let percent = left/videoBar.width,
                leftVisible = percent*parseFloat(getComputedStyle(document.getElementById('videoBar')).width);
            
            document.querySelector('#videoBar .trimend').style.left = leftVisible;
            
            video.currentTime = trimEndPos = percent*video.duration;
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(percent*video.duration));
            
            document.getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            
            if (trimEndPos <= videoPos)
                document.querySelector('#videoBar .position').style.left = leftVisible;
            else
                document.querySelector('#videoBar .position').style.left = savedLeftPosition;
            
        } else if (volumeDragging) {
            
            let volumeBar = document.getElementById('volumeBar').getBoundingClientRect();
            left = e.clientX - volumeBar.left;

            if (left < 0)
                left = 0;
            else if (left > volumeBar.width)
                left = volumeBar.width;
            
            let percent = left/volumeBar.width,
                leftVisible = percent*parseFloat(getComputedStyle(document.getElementById('volumeBar')).width);
            
            document.querySelector('#volumeBar .position').style.left = leftVisible;
            
            video.volume = percent;
            
        }
        
    });
    
    //end dragging points
    document.addEventListener('mouseup', () => {
        videoPositionDragging = false;
        if (trimStartDragging || trimEndDragging) {
            video.currentTime = videoPos;
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(videoPos));
        }
        trimStartDragging = false;
        trimEndDragging = false;
        volumeDragging = false;
    });
    
    //keyboard shortcuts
    const keysHolding = {
        ArrowLeft: () => {
            video.pause();
            video.currentTime = videoPos = Math.max(trimStartPos, video.currentTime - (1/videoData.streams.primary.video.framerate));
        },
        ArrowRight: () => {
            video.pause();
            video.currentTime = videoPos = Math.min(trimEndPos, video.currentTime + (1/videoData.streams.primary.video.framerate));
        },
        ArrowUp: () => {
            video.volume = Math.min(1, video.volume + .05);
            console.log(video.volume);
            calculatePositionBar();
        },
        ArrowDown: () => {
            video.volume = Math.max(0, video.volume - .05);
            console.log(video.volume);
            calculatePositionBar();
        },
        ' ': () => {
            if (video.paused && videoPos < trimEndPos)
                video.play();
            else
                video.pause();
        },
        '[': () => {
            trimStartPos = video.currentTime;
            document.getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            calculatePositionBar();
        },
        ']': () => {
            trimEndPos = video.currentTime;
            document.getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            calculatePositionBar();
            video.pause();
        }
    };
    document.addEventListener('keydown', e => {
        if (isOpen && e.key in keysHolding) {
            e.preventDefault();
            keysHolding[e.key]();
        }
    });
    
    //interact with index.js
    return {
        open: () => {
            
            videoPos = 0;
            trimStartPos = 0;
            trimEndPos = 0;
            videoPositionDragging = false;
            trimStartDragging = false;
            trimEndDragging = false;
            volumeDragging = false;
            savedLeftPosition = 0;
            
            isOpen = true;
            
        },
        src: (src, data) => {
            video.setAttribute('src', src);
            videoData = data;
        },
        close: () => {
            video.pause();
            isOpen = false;
        },
        data: () => {
            return { trimStartPos, trimEndPos, duration: trimEndPos-trimStartPos };
        },
        onload: func => {onload = func;}
    };
    
};
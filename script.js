// DOM Elements
const audio = document.getElementById('audioPlayer');
const playerPopup = document.getElementById('playerPopup');
const overlay = document.getElementById('overlay');
const closePlayer = document.getElementById('closePlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const lofiBtn = document.getElementById('lofiBtn');
const downloadBtn = document.getElementById('downloadBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playerImage = document.getElementById('playerImage');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const songResults = document.getElementById('songResults');
const notification = document.getElementById('notification');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadSpinner = document.getElementById('loadSpinner');
const miniPlayer = document.getElementById('miniPlayer');
const miniPlayBtn = document.getElementById('miniPlayBtn');
const miniPlayIcon = document.getElementById('miniPlayIcon');
const openPlayerBtn = document.getElementById('openPlayerBtn');
const miniPlayerTitle = document.getElementById('miniPlayerTitle');
const miniPlayerArtist = document.getElementById('miniPlayerArtist');
const miniPlayerImage = document.getElementById('miniPlayerImage');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.getElementById('themeIcon');

// Player State
let songs = [];
let currentSongIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isLofi = false;
let audioContext;
let sourceNode;
let reverbNode;
let originalOrder = [];
let currentPage = 1;
let currentQuery = 'Hindi';
let isLoading = false;
let hasMoreSongs = true;

// Initialize with Hindi songs
window.onload = () => {
    searchSongs(currentQuery);
    checkDarkModePreference();
};

// Event Listeners
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim() || 'Hindi';
    currentQuery = query;
    currentPage = 1;
    hasMoreSongs = true;
    searchSongs(query);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim() || 'Hindi';
        currentQuery = query;
        currentPage = 1;
        hasMoreSongs = true;
        searchSongs(query);
    }
});

loadMoreBtn.addEventListener('click', loadMoreSongs);

closePlayer.addEventListener('click', () => {
    playerPopup.classList.remove('active');
    overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
    playerPopup.classList.remove('active');
    overlay.classList.remove('active');
});

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', playPrevious);
nextBtn.addEventListener('click', playNext);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', toggleRepeat);
lofiBtn.addEventListener('click', toggleLofi);
downloadBtn.addEventListener('click', downloadCurrent);
progressBar.addEventListener('click', seek);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateDuration);
audio.addEventListener('ended', handleSongEnd);
miniPlayBtn.addEventListener('click', togglePlay);
openPlayerBtn.addEventListener('click', openPlayer);
themeToggle.addEventListener('click', toggleTheme);

// Functions
async function searchSongs(query, append = false) {
    if (isLoading) return;
    
    isLoading = true;
    loadMoreBtn.disabled = true;
    loadSpinner.style.display = 'inline-block';
    loadMoreBtn.querySelector('span').style.display = 'none';
    
    if (!append) {
        showNotification('Loading songs...');
        songResults.innerHTML = '';
    }

    try {
        const response = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(query)}&limit=40&page=${currentPage}`);
        const data = await response.json();
        const newSongs = data.data.results.filter(song => song.downloadUrl);
        
        if (newSongs.length === 0) {
            hasMoreSongs = false;
            if (!append) {
                showNotification('No songs found');
            } else {
                showNotification('No more songs to load');
            }
        } else {
            if (append) {
                songs = [...songs, ...newSongs];
            } else {
                songs = newSongs;
                originalOrder = [...newSongs];
            }
            
            displaySongs();
            showNotification(`Loaded ${newSongs.length} songs`);
            
            // Enable load more button if there might be more songs
            if (newSongs.length === 40) {
                hasMoreSongs = true;
                loadMoreBtn.disabled = false;
            } else {
                hasMoreSongs = false;
                loadMoreBtn.disabled = true;
            }
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
        showNotification('Failed to load songs');
    } finally {
        isLoading = false;
        loadSpinner.style.display = 'none';
        loadMoreBtn.querySelector('span').style.display = 'inline';
    }
}

function loadMoreSongs() {
    if (isLoading || !hasMoreSongs) return;
    
    currentPage++;
    searchSongs(currentQuery, true);
}

function displaySongs() {
    // Clear only if not appending
    if (currentPage === 1) {
        songResults.innerHTML = '';
    }
    
    songs.forEach((song, index) => {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        if (index === currentSongIndex) {
            songCard.classList.add('active');
        }
        
        songCard.innerHTML = `
            <img src="${song.image[2].link}" alt="${song.name}">
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
            <div class="song-info">
                <h3>${decodeHTMLEntities(song.name)}</h3>
                <p>${decodeHTMLEntities(song.primaryArtists)}</p>
            </div>
        `;
        
        songCard.addEventListener('click', () => {
            currentSongIndex = index;
            playSong(song);
            playerPopup.classList.add('active');
            overlay.classList.add('active');
        });
        
        songResults.appendChild(songCard);
    });
}

function playSong(song) {
    const downloadUrl = song.downloadUrl[3].link; // 160kbps
    
    audio.src = downloadUrl;
    audio.play()
        .then(() => {
            isPlaying = true;
            updatePlayButton();
            updatePlayerInfo(song);
            updateMiniPlayer(song);
            highlightCurrentSong();
            showNotification(`Now playing: ${decodeHTMLEntities(song.name)}`);
        })
        .catch(error => {
            console.error('Error playing song:', error);
            showNotification('Error playing song');
        });
}

function updatePlayerInfo(song) {
    playerTitle.textContent = decodeHTMLEntities(song.name);
    playerArtist.textContent = decodeHTMLEntities(song.primaryArtists);
    playerImage.src = song.image[2].link;
    document.title = `${decodeHTMLEntities(song.name)} - ${decodeHTMLEntities(song.primaryArtists)} | Nexus Music`;
}

function updateMiniPlayer(song) {
    miniPlayerTitle.textContent = decodeHTMLEntities(song.name);
    miniPlayerArtist.textContent = decodeHTMLEntities(song.primaryArtists);
    miniPlayerImage.src = song.image[2].link;
    miniPlayer.classList.add('active');
    
    // Update play/pause icon
    if (isPlaying) {
        miniPlayIcon.className = 'fas fa-pause';
    } else {
        miniPlayIcon.className = 'fas fa-play';
    }
}

function highlightCurrentSong() {
    document.querySelectorAll('.song-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelectorAll('.song-card')[currentSongIndex]?.classList.add('active');
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
    isPlaying = !isPlaying;
    updatePlayButton();
    
    // Update mini player icon
    if (isPlaying) {
        miniPlayIcon.className = 'fas fa-pause';
    } else {
        miniPlayIcon.className = 'fas fa-play';
    }
}

function updatePlayButton() {
    if (isPlaying) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        miniPlayIcon.className = 'fas fa-pause';
    } else {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        miniPlayIcon.className = 'fas fa-play';
    }
}

function playPrevious() {
    if (songs.length === 0) return;
    
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(songs[currentSongIndex]);
}

function playNext() {
    if (songs.length === 0) return;
    
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(songs[currentSongIndex]);
}

function handleSongEnd() {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
    } else {
        playNext();
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active');
    
    if (isShuffle) {
        // Shuffle the array
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }
        showNotification('Shuffle enabled');
    } else {
        // Restore original order
        songs = [...originalOrder];
        showNotification('Shuffle disabled');
    }
    
    // Update current song index
    if (currentSongIndex !== -1) {
        const currentSong = songs.find(song => 
            song.name === playerTitle.textContent && 
            song.primaryArtists === playerArtist.textContent
        );
        currentSongIndex = songs.indexOf(currentSong);
    }
    
    displaySongs();
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active');
    showNotification(isRepeat ? 'Repeat enabled' : 'Repeat disabled');
}

function toggleLofi() {
    isLofi = !isLofi;
    lofiBtn.classList.toggle('active');
    
    if (isLofi) {
        applyLofiEffect();
        showNotification('Lo-fi mode enabled');
    } else {
        removeLofiEffect();
        showNotification('Lo-fi mode disabled');
    }
}

function applyLofiEffect() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        sourceNode = audioContext.createMediaElementSource(audio);
    }
    
    if (!reverbNode) {
        reverbNode = audioContext.createConvolver();
        const impulseLength = 1 * audioContext.sampleRate;
        const impulse = audioContext.createBuffer(2, impulseLength, audioContext.sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        
        for (let i = 0; i < impulseLength; i++) {
            left[i] = right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
        }
        
        reverbNode.buffer = impulse;
    }
    
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
    
    audio.playbackRate = 0.85;
    
    sourceNode.disconnect();
    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    sourceNode.connect(reverbNode);
    reverbNode.connect(audioContext.destination);
}

function removeLofiEffect() {
    audio.playbackRate = 1;
    
    if (sourceNode) {
        sourceNode.disconnect();
        if (reverbNode) {
            reverbNode.disconnect();
        }
        sourceNode.connect(audioContext.destination);
    }
}

function updateProgress() {
    if (!isNaN(audio.duration)) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${progress}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
}

function updateDuration() {
    if (!isNaN(audio.duration)) {
        durationEl.textContent = formatTime(audio.duration);
    }
}

function seek(e) {
    const progressWidth = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / progressWidth) * duration;
}

function downloadCurrent() {
    if (currentSongIndex === -1) {
        showNotification('No song selected');
        return;
    }
    
    const song = songs[currentSongIndex];
    const downloadUrl = song.downloadUrl[3].link;
    
    const link = document.createElement('a');
    link.href = `https://downforce.rf.gd/?url=${encodeURIComponent(downloadUrl)}`;
    link.download = `${song.name} - ${song.primaryArtists}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Download started');
}

function openPlayer() {
    playerPopup.classList.add('active');
    overlay.classList.add('active');
}

function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

// Theme Functions
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('darkMode', isDarkMode);
}

function checkDarkModePreference() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-sun';
    }
}

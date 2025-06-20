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
let loadedSongIds = new Set();

// Initialize Player
function initPlayer() {
    setupAudioListeners();
    checkDarkModePreference();
    searchSongs(currentQuery);
}

// Audio Event Listeners
function setupAudioListeners() {
    audio.addEventListener('play', () => {
        isPlaying = true;
        updatePlayButton();
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayButton();
    });

    audio.addEventListener('ended', handleSongEnd);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('error', handleAudioError);
}

function handleAudioError() {
    isPlaying = false;
    updatePlayButton();
    showNotification('Playback error occurred');
    console.error('Audio error:', audio.error);
}

// Player Controls
function togglePlay() {
    if (audio.readyState === 0 && songs.length > 0) {
        currentSongIndex = currentSongIndex === -1 ? 0 : currentSongIndex;
        playSong(songs[currentSongIndex]);
        return;
    }

    if (audio.paused) {
        audio.play().catch(handlePlayError);
    } else {
        audio.pause();
    }
}

function handlePlayError(error) {
    console.error('Play error:', error);
    showNotification('Error playing song');
    isPlaying = false;
    updatePlayButton();
}

function playSong(song) {
    if (!song?.downloadUrl?.[3]?.link) {
        showNotification('Invalid song data');
        return;
    }

    const downloadUrl = song.downloadUrl[3].link;
    
    try {
        if (audio.src !== downloadUrl) {
            audio.src = downloadUrl;
            audio.load();
        }

        audio.play()
            .then(() => {
                updatePlayerInfo(song);
                updateMiniPlayer(song);
                highlightCurrentSong();
                showNotification(`Now playing: ${decodeHTMLEntities(song.name)}`);
            })
            .catch(handlePlayError);
    } catch (error) {
        console.error('Song setup error:', error);
        showNotification('Error loading song');
    }
}

function updatePlayButton() {
    const isActuallyPlaying = !audio.paused && audio.readyState > 2;
    
    if (isActuallyPlaying) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        miniPlayIcon.className = 'fas fa-pause';
    } else {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        miniPlayIcon.className = 'fas fa-play';
    }
}

function playPrevious() {
    if (songs.length === 0) {
        showNotification('No songs available');
        return;
    }
    
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(songs[currentSongIndex]);
}

function playNext() {
    if (songs.length === 0) {
        showNotification('No songs available');
        return;
    }
    
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(songs[currentSongIndex]);
}

function handleSongEnd() {
    isPlaying = false;
    updatePlayButton();
    
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
    } else {
        playNext();
    }
}

// Progress Controls
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
    if (isNaN(audio.duration)) return;
    
    const progressWidth = progressBar.clientWidth;
    const clickX = e.offsetX;
    audio.currentTime = (clickX / progressWidth) * audio.duration;
}

// Shuffle/Repeat
function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active');
    
    if (isShuffle) {
        const currentSong = currentSongIndex >= 0 ? songs[currentSongIndex] : null;
        const shuffled = [...songs];
        
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        if (currentSong) {
            const currentPos = shuffled.indexOf(currentSong);
            if (currentPos > 0) {
                [shuffled[0], shuffled[currentPos]] = [shuffled[currentPos], shuffled[0]];
            }
        }
        
        songs = shuffled;
        showNotification('Shuffle enabled');
    } else {
        songs = [...originalOrder];
        currentSongIndex = songs.findIndex(song => song.id === (songs[currentSongIndex]?.id || ''));
        showNotification('Shuffle disabled');
    }
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active');
    showNotification(isRepeat ? 'Repeat enabled' : 'Repeat disabled');
}

// Song Loading and Display
async function searchSongs(query, append = false) {
    if (isLoading) return;
    
    isLoading = true;
    loadMoreBtn.disabled = true;
    loadSpinner.style.display = 'inline-block';
    if (loadMoreBtn.querySelector('span')) {
        loadMoreBtn.querySelector('span').style.display = 'none';
    }

    try {
        const response = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(query)}&limit=40&page=${currentPage}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.data || !data.data.results) {
            throw new Error('Invalid API response format');
        }

        const newSongs = data.data.results.filter(song => song.downloadUrl);
        
        if (newSongs.length === 0) {
            hasMoreSongs = false;
            if (!append) {
                showNotification('No songs found');
                songResults.innerHTML = '<p>No songs found. Try a different search.</p>';
            } else {
                showNotification('No more songs available');
            }
            loadMoreBtn.style.display = 'none';
            return;
        }

        // Filter out duplicates
        const uniqueNewSongs = newSongs.filter(song => !loadedSongIds.has(song.id));
        
        if (uniqueNewSongs.length === 0 && append) {
            showNotification('No new songs in this batch');
            currentPage++;
            return searchSongs(query, true);
        }

        // Add to loaded songs
        uniqueNewSongs.forEach(song => loadedSongIds.add(song.id));

        if (append) {
            songs = [...songs, ...uniqueNewSongs];
        } else {
            songs = uniqueNewSongs;
            originalOrder = [...uniqueNewSongs];
            loadedSongIds = new Set(uniqueNewSongs.map(song => song.id));
            currentPage = 1;
        }

        displaySongs();
        showNotification(`Loaded ${uniqueNewSongs.length} songs`);
        
        hasMoreSongs = newSongs.length >= 40;
        loadMoreBtn.disabled = false;
        loadMoreBtn.style.display = hasMoreSongs ? 'flex' : 'none';

    } catch (error) {
        console.error('Error fetching songs:', error);
        showNotification('Failed to load songs. Please try again.');
        hasMoreSongs = false;
        loadMoreBtn.style.display = 'none';
    } finally {
        isLoading = false;
        loadSpinner.style.display = 'none';
        if (loadMoreBtn.querySelector('span')) {
            loadMoreBtn.querySelector('span').style.display = 'inline';
        }
    }
}

function loadMoreSongs() {
    if (isLoading || !hasMoreSongs) return;
    currentPage++;
    searchSongs(currentQuery, true);
}

function displaySongs() {
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

// Mini Player
function updateMiniPlayer(song) {
    if (!song) return;
    
    miniPlayerTitle.textContent = decodeHTMLEntities(song.name);
    miniPlayerArtist.textContent = decodeHTMLEntities(song.primaryArtists);
    miniPlayerImage.src = song.image[2].link;
    miniPlayer.classList.add('active');
    updatePlayButton();
}

function openPlayer() {
    playerPopup.classList.add('active');
    overlay.classList.add('active');
}

function closePlayerPopup() {
    playerPopup.classList.remove('active');
    overlay.classList.remove('active');
}

// Helper Functions
function highlightCurrentSong() {
    document.querySelectorAll('.song-card').forEach((card, index) => {
        card.classList.toggle('active', index === currentSongIndex);
    });
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

// Theme Toggle
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

// Event Listeners
function setupEventListeners() {
    closePlayer.addEventListener('click', closePlayerPopup);
    overlay.addEventListener('click', closePlayerPopup);
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    lofiBtn.addEventListener('click', toggleLofi);
    downloadBtn.addEventListener('click', downloadCurrent);
    progressBar.addEventListener('click', seek);
    miniPlayBtn.addEventListener('click', togglePlay);
    openPlayerBtn.addEventListener('click', openPlayer);
    themeToggle.addEventListener('click', toggleTheme);
    
    loadMoreBtn.addEventListener('click', loadMoreSongs);
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim() || 'Hindi';
        currentQuery = query;
        currentPage = 1;
        searchSongs(query);
    });
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim() || 'Hindi';
            currentQuery = query;
            currentPage = 1;
            searchSongs(query);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initPlayer();
});

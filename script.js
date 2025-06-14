// Global variables
let currentAudio = null;
let currentSongIndex = 0;
let currentPlaylist = [];
let isPlaying = false;

// DOM Elements
const searchInput = document.getElementById('search-input');
const featuredSongsContainer = document.getElementById('featured-songs');
const topAlbumsContainer = document.getElementById('top-albums');
const popularArtistsContainer = document.getElementById('popular-artists');
const searchResultsContainer = document.getElementById('search-results');
const allAlbumsContainer = document.getElementById('all-albums');
const allArtistsContainer = document.getElementById('all-artists');
const albumDetailsContainer = document.getElementById('album-details-section');
const albumHeader = document.getElementById('album-header');
const albumSongsContainer = document.getElementById('album-songs');
const artistDetailsContainer = document.getElementById('artist-details-section');
const artistHeader = document.getElementById('artist-header');
const artistSongsContainer = document.getElementById('artist-songs');
const artistAlbumsContainer = document.getElementById('artist-albums');

// Player elements
const playerAlbumArt = document.getElementById('player-album-art');
const playerSongTitle = document.getElementById('player-song-title');
const playerSongArtist = document.getElementById('player-song-artist');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeBar = document.getElementById('volume-bar');

// Sections
const sections = {
    home: document.getElementById('home-section'),
    search: document.getElementById('search-section'),
    albums: document.getElementById('albums-section'),
    artists: document.getElementById('artists-section'),
    albumDetails: document.getElementById('album-details-section'),
    artistDetails: document.getElementById('artist-details-section')
};

// Navigation menu items
const navItems = document.querySelectorAll('.nav-menu li');

// API Base URL
const API_BASE_URL = 'https://saavn.dev';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    fetchFeaturedSongs();
    fetchTopAlbums();
    fetchPopularArtists();
    fetchAllAlbums();
    fetchAllArtists();

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchSongs(query);
                showSection('search');
            }
        }
    });

    // Navigation menu
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const text = item.textContent.trim();
            if (text === 'Home') showSection('home');
            else if (text === 'Search') {
                searchInput.focus();
                showSection('home');
            }
            else if (text === 'Albums') showSection('albums');
            else if (text === 'Artists') showSection('artists');
            else if (text === 'Playlists') showSection('home'); // Placeholder
        });
    });

    // Player controls
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPreviousSong);
    nextBtn.addEventListener('click', playNextSong);
    progressBar.addEventListener('input', seekSong);
    volumeBar.addEventListener('input', setVolume);
}

function showSection(sectionName) {
    // Hide all sections first
    Object.values(sections).forEach(section => {
        section.classList.remove('active-section');
    });
    
    // Show the requested section
    if (sections[sectionName]) {
        sections[sectionName].classList.add('active-section');
    }
}

// API Fetch Functions
async function fetchFeaturedSongs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/search/songs?query=popular`);
        const data = await response.json();
        
        if (data.success) {
            const songs = data.data.results.slice(0, 6); // Get first 6 songs
            renderFeaturedSongs(songs);
            currentPlaylist = songs; // Set as current playlist
        }
    } catch (error) {
        console.error('Error fetching featured songs:', error);
    }
}

async function fetchTopAlbums() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/search/albums?query=popular`);
        const data = await response.json();
        
        if (data.success) {
            const albums = data.data.results.slice(0, 6); // Get first 6 albums
            renderTopAlbums(albums);
        }
    } catch (error) {
        console.error('Error fetching top albums:', error);
    }
}

async function fetchPopularArtists() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/search/artists?query=popular`);
        const data = await response.json();
        
        if (data.success) {
            const artists = data.data.results.slice(0, 6); // Get first 6 artists
            renderPopularArtists(artists);
        }
    } catch (error) {
        console.error('Error fetching popular artists:', error);
    }
}

async function fetchAllAlbums() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/search/albums?query=latest`);
        const data = await response.json();
        
        if (data.success) {
            renderAllAlbums(data.data.results);
        }
    } catch (error) {
        console.error('Error fetching all albums:', error);
    }
}

async function fetchAllArtists() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/search/artists?query=popular`);
        const data = await response.json();
        
        if (data.success) {
            renderAllArtists(data.data.results);
        }
    } catch (error) {
        console.error('Error fetching all artists:', error);
    }
}

async function searchSongs(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            renderSearchResults(data.data);
        }
    } catch (error) {
        console.error('Error searching songs:', error);
    }
}

async function fetchAlbumDetails(albumId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/albums?id=${albumId}`);
        const data = await response.json();
        
        if (data.success) {
            renderAlbumDetails(data.data);
            showSection('albumDetails');
        }
    } catch (error) {
        console.error('Error fetching album details:', error);
    }
}

async function fetchArtistDetails(artistId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/artists/${artistId}`);
        const data = await response.json();
        
        if (data.success) {
            renderArtistDetails(data.data);
            showSection('artistDetails');
        }
    } catch (error) {
        console.error('Error fetching artist details:', error);
    }
}

// Rendering Functions
function renderFeaturedSongs(songs) {
    featuredSongsContainer.innerHTML = '';
    
    songs.forEach((song, index) => {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        songCard.innerHTML = `
            <img src="${song.image[1].url}" alt="${song.name}" class="song-image">
            <div class="song-info">
                <h3>${song.name}</h3>
                <p>${song.primaryArtists || 'Various Artists'}</p>
            </div>
        `;
        
        songCard.addEventListener('click', () => {
            playSong(song, index, songs);
        });
        
        featuredSongsContainer.appendChild(songCard);
    });
}

function renderTopAlbums(albums) {
    topAlbumsContainer.innerHTML = '';
    
    albums.forEach(album => {
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.innerHTML = `
            <img src="${album.image[1].url}" alt="${album.name}" class="album-image">
            <div class="album-info">
                <h3>${album.name}</h3>
                <p>${album.artists.primary[0]?.name || 'Various Artists'}</p>
            </div>
        `;
        
        albumCard.addEventListener('click', () => {
            fetchAlbumDetails(album.id);
        });
        
        topAlbumsContainer.appendChild(albumCard);
    });
}

function renderPopularArtists(artists) {
    popularArtistsContainer.innerHTML = '';
    
    artists.forEach(artist => {
        const artistCard = document.createElement('div');
        artistCard.className = 'artist-card';
        artistCard.innerHTML = `
            <img src="${artist.image[1].url}" alt="${artist.name}" class="artist-image">
            <div class="artist-info">
                <h3>${artist.name}</h3>
                <p>Artist</p>
            </div>
        `;
        
        artistCard.addEventListener('click', () => {
            fetchArtistDetails(artist.id);
        });
        
        popularArtistsContainer.appendChild(artistCard);
    });
}

function renderAllAlbums(albums) {
    allAlbumsContainer.innerHTML = '';
    
    albums.forEach(album => {
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.innerHTML = `
            <img src="${album.image[1].url}" alt="${album.name}" class="album-image">
            <div class="album-info">
                <h3>${album.name}</h3>
                <p>${album.artists.primary[0]?.name || 'Various Artists'}</p>
            </div>
        `;
        
        albumCard.addEventListener('click', () => {
            fetchAlbumDetails(album.id);
        });
        
        allAlbumsContainer.appendChild(albumCard);
    });
}

function renderAllArtists(artists) {
    allArtistsContainer.innerHTML = '';
    
    artists.forEach(artist => {
        const artistCard = document.createElement('div');
        artistCard.className = 'artist-card';
        artistCard.innerHTML = `
            <img src="${artist.image[1].url}" alt="${artist.name}" class="artist-image">
            <div class="artist-info">
                <h3>${artist.name}</h3>
                <p>Artist</p>
            </div>
        `;
        
        artistCard.addEventListener('click', () => {
            fetchArtistDetails(artist.id);
        });
        
        allArtistsContainer.appendChild(artistCard);
    });
}

function renderSearchResults(data) {
    searchResultsContainer.innerHTML = '<h3>Search Results</h3>';
    
    // Render songs
    if (data.songs.results.length > 0) {
        const songsSection = document.createElement('div');
        songsSection.innerHTML = '<h4>Songs</h4>';
        const songsList = document.createElement('div');
        songsList.className = 'song-list';
        
        data.songs.results.forEach((song, index) => {
            const songRow = document.createElement('div');
            songRow.className = 'song-row';
            songRow.innerHTML = `
                <div class="song-number">${index + 1}</div>
                <div class="song-title">
                    <h3>${song.name}</h3>
                    <p>${song.primaryArtists || 'Various Artists'}</p>
                </div>
                <div class="song-duration">${formatTime(song.duration)}</div>
            `;
            
            songRow.addEventListener('click', () => {
                playSong(song, index, data.songs.results);
            });
            
            songsList.appendChild(songRow);
        });
        
        songsSection.appendChild(songsList);
        searchResultsContainer.appendChild(songsSection);
    }
    
    // Render albums
    if (data.albums.results.length > 0) {
        const albumsSection = document.createElement('div');
        albumsSection.innerHTML = '<h4>Albums</h4>';
        const albumsGrid = document.createElement('div');
        albumsGrid.className = 'albums-grid';
        
        data.albums.results.slice(0, 6).forEach(album => {
            const albumCard = document.createElement('div');
            albumCard.className = 'album-card';
            albumCard.innerHTML = `
                <img src="${album.image[1].url}" alt="${album.name}" class="album-image">
                <div class="album-info">
                    <h3>${album.name}</h3>
                    <p>${album.artists.primary[0]?.name || 'Various Artists'}</p>
                </div>
            `;
            
            albumCard.addEventListener('click', () => {
                fetchAlbumDetails(album.id);
            });
            
            albumsGrid.appendChild(albumCard);
        });
        
        albumsSection.appendChild(albumsGrid);
        searchResultsContainer.appendChild(albumsSection);
    }
    
    // Render artists
    if (data.artists.results.length > 0) {
        const artistsSection = document.createElement('div');
        artistsSection.innerHTML = '<h4>Artists</h4>';
        const artistsGrid = document.createElement('div');
        artistsGrid.className = 'artists-grid';
        
        data.artists.results.slice(0, 6).forEach(artist => {
            const artistCard = document.createElement('div');
            artistCard.className = 'artist-card';
            artistCard.innerHTML = `
                <img src="${artist.image[1].url}" alt="${artist.name}" class="artist-image">
                <div class="artist-info">
                    <h3>${artist.name}</h3>
                    <p>Artist</p>
                </div>
            `;
            
            artistCard.addEventListener('click', () => {
                fetchArtistDetails(artist.id);
            });
            
            artistsGrid.appendChild(artistCard);
        });
        
        artistsSection.appendChild(artistsGrid);
        searchResultsContainer.appendChild(artistsSection);
    }
}

function renderAlbumDetails(album) {
    // Render album header
    albumHeader.innerHTML = `
        <img src="${album.image[1].url}" alt="${album.name}" class="album-cover">
        <div class="album-details">
            <h1>${album.name}</h1>
            <p>${album.artists.primary.map(a => a.name).join(', ')}</p>
            <p>${album.year || 'Unknown year'} • ${album.songCount || 'Unknown'} songs</p>
            <p>${album.language || 'Unknown language'}</p>
        </div>
    `;
    
    // Render album songs
    albumSongsContainer.innerHTML = '<h3>Songs</h3>';
    const songList = document.createElement('div');
    songList.className = 'song-list';
    
    if (album.songs && album.songs.length > 0) {
        album.songs.forEach((song, index) => {
            const songRow = document.createElement('div');
            songRow.className = 'song-row';
            songRow.innerHTML = `
                <div class="song-number">${index + 1}</div>
                <div class="song-title">
                    <h3>${song.name}</h3>
                    <p>${song.primaryArtists || song.artists?.primary[0]?.name || 'Various Artists'}</p>
                </div>
                <div class="song-duration">${formatTime(song.duration)}</div>
            `;
            
            songRow.addEventListener('click', () => {
                playSong(song, index, album.songs);
            });
            
            songList.appendChild(songRow);
        });
    } else {
        songList.innerHTML = '<p>No songs available for this album.</p>';
    }
    
    albumSongsContainer.appendChild(songList);
}

function renderArtistDetails(artist) {
    // Render artist header
    artistHeader.innerHTML = `
        <img src="${artist.image[1].url}" alt="${artist.name}" class="artist-photo">
        <div class="artist-details">
            <h1>${artist.name}</h1>
            <p>${artist.bio?.[0]?.text || 'No biography available'}</p>
            <p>${artist.followerCount ? `${artist.followerCount.toLocaleString()} followers` : ''}</p>
        </div>
    `;
    
    // Render artist top songs
    artistSongsContainer.innerHTML = '<h3>Popular Songs</h3>';
    const songList = document.createElement('div');
    songList.className = 'song-list';
    
    if (artist.topSongs && artist.topSongs.length > 0) {
        artist.topSongs.slice(0, 10).forEach((song, index) => {
            const songRow = document.createElement('div');
            songRow.className = 'song-row';
            songRow.innerHTML = `
                <div class="song-number">${index + 1}</div>
                <div class="song-title">
                    <h3>${song.name}</h3>
                    <p>${song.primaryArtists || song.artists?.primary[0]?.name || 'Various Artists'}</p>
                </div>
                <div class="song-duration">${formatTime(song.duration)}</div>
            `;
            
            songRow.addEventListener('click', () => {
                playSong(song, index, artist.topSongs);
            });
            
            songList.appendChild(songRow);
        });
    } else {
        songList.innerHTML = '<p>No songs available for this artist.</p>';
    }
    
    artistSongsContainer.appendChild(songList);
    
    // Render artist albums
    artistAlbumsContainer.innerHTML = '<h3>Albums</h3>';
    const albumsGrid = document.createElement('div');
    albumsGrid.className = 'albums-grid';
    
    if (artist.topAlbums && artist.topAlbums.length > 0) {
        artist.topAlbums.slice(0, 6).forEach(album => {
            const albumCard = document.createElement('div');
            albumCard.className = 'album-card';
            albumCard.innerHTML = `
                <img src="${album.image[1].url}" alt="${album.name}" class="album-image">
                <div class="album-info">
                    <h3>${album.name}</h3>
                    <p>${album.year || ''}</p>
                </div>
            `;
            
            albumCard.addEventListener('click', () => {
                fetchAlbumDetails(album.id);
            });
            
            albumsGrid.appendChild(albumCard);
        });
    } else {
        albumsGrid.innerHTML = '<p>No albums available for this artist.</p>';
    }
    
    artistAlbumsContainer.appendChild(albumsGrid);
}

// Player Functions
function playSong(song, index, playlist) {
    // Stop current audio if playing
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    // Set current song and playlist
    currentSongIndex = index;
    currentPlaylist = playlist;
    
    // Update player UI
    playerAlbumArt.src = song.image[1].url;
    playerSongTitle.textContent = song.name;
    playerSongArtist.textContent = song.primaryArtists || song.artists?.primary[0]?.name || 'Various Artists';
    
    // Create new audio element
    currentAudio = new Audio(song.downloadUrl[0].url);
    
    // Set up event listeners for the audio element
    currentAudio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(currentAudio.duration);
        progressBar.max = currentAudio.duration;
    });
    
    currentAudio.addEventListener('timeupdate', updateProgress);
    currentAudio.addEventListener('ended', playNextSong);
    
    // Play the song
    currentAudio.play();
    isPlaying = true;
    updatePlayButton();
}

function togglePlay() {
    if (!currentAudio) return;
    
    if (isPlaying) {
        currentAudio.pause();
    } else {
        currentAudio.play();
    }
    
    isPlaying = !isPlaying;
    updatePlayButton();
}

function updatePlayButton() {
    if (isPlaying) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

function playPreviousSong() {
    if (currentPlaylist.length === 0) return;
    
    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = currentPlaylist.length - 1;
    }
    
    playSong(currentPlaylist[currentSongIndex], currentSongIndex, currentPlaylist);
}

function playNextSong() {
    if (currentPlaylist.length === 0) return;
    
    currentSongIndex++;
    if (currentSongIndex >= currentPlaylist.length) {
        currentSongIndex = 0;
    }
    
    playSong(currentPlaylist[currentSongIndex], currentSongIndex, currentPlaylist);
}

function updateProgress() {
    if (!currentAudio) return;
    
    const { currentTime, duration } = currentAudio;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.value = currentTime;
    currentTimeEl.textContent = formatTime(currentTime);
}

function seekSong() {
    if (!currentAudio) return;
    
    currentAudio.currentTime = progressBar.value;
    currentTimeEl.textContent = formatTime(currentAudio.currentTime);
}

function setVolume() {
    if (!currentAudio) return;
    
    currentAudio.volume = volumeBar.value / 100;
}

// Helper Functions
function formatTime(seconds) {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}
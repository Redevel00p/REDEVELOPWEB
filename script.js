// Global variables
let songs = [];
let trash = [];
let currentSong = null;
let isPlaying = false;
let currentFilter = 'terbaru';
let currentPage = 'songs';
let currentEditSong = null;
let currentView = 'grid';

// Audio player variables
let audioPlayer = null;
let isShuffled = false;
let repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
let currentVolume = 0.7;
let isMuted = false;
let progressInterval = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initializing...');
    initializePlayer();
    loadData();
    // Use setTimeout to ensure DOM is fully loaded
    setTimeout(() => {
        setupEventListeners();
    }, 100);
});

// Initialize music player
function initializePlayer() {
    console.log('Initializing player...');
    
    // Create audio element
    audioPlayer = new Audio();
    audioPlayer.volume = currentVolume;
    
    // Audio event listeners
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('error', function(e) {
        console.error('Audio error:', e);
        showNotification('Error loading audio');
    });
    
    // Show player after a short delay
    setTimeout(() => {
        const player = document.getElementById('musicPlayer');
        if (player) player.classList.add('active');
        console.log('Player initialized');
    }, 1000);
}

// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                navigateTo(page);
            }
        });
    });

    // Filter dropdown
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            document.getElementById('filterMenu').classList.toggle('active');
        });
    }

    // Filter options
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', function() {
            const filter = this.dataset.filter;
            setFilter(filter);
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            searchSongs(query);
        });
    }

    // Add song form
    const addSongForm = document.getElementById('addSongForm');
    if (addSongForm) {
        addSongForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewSong();
        });
    }

    // Edit song form
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEditedSong();
        });
    }

    // Player controls - setup with direct event attachment
    setupPlayerControls();

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.filter-dropdown')) {
            const filterMenu = document.getElementById('filterMenu');
            if (filterMenu) filterMenu.classList.remove('active');
        }
        if (!e.target.closest('.song-card-menu')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            togglePlayPause();
        } else if (e.code === 'ArrowRight') {
            nextTrack();
        } else if (e.code === 'ArrowLeft') {
            previousTrack();
        } else if (e.key === 'Escape') {
            if (currentPage !== 'songs') {
                navigateTo('songs');
            }
        }
    });

    console.log('Event listeners setup complete');
}

// Setup player controls specifically
function setupPlayerControls() {
    console.log('Setting up player controls...');
    
    // Play/Pause button - try multiple selectors
    const playPauseSelectors = [
        '.play-pause-btn',
        '[onclick*="togglePlayPause"]',
        '.player-controls .control-btn:nth-child(3)'
    ];
    
    let playPauseBtn = null;
    for (const selector of playPauseSelectors) {
        playPauseBtn = document.querySelector(selector);
        if (playPauseBtn) {
            // Remove any existing onclick
            playPauseBtn.removeAttribute('onclick');
            // Add fresh event listener
            playPauseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Play/Pause button clicked');
                togglePlayPause();
            });
            console.log('Play/Pause button attached with selector:', selector);
            break;
        }
    }
    
    // Previous button
    const prevBtn = document.querySelector('.player-controls .control-btn:nth-child(2)');
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Previous button clicked');
            previousTrack();
        });
        console.log('Previous button attached');
    }
    
    // Next button
    const nextBtn = document.querySelector('.player-controls .control-btn:nth-child(4)');
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Next button clicked');
            nextTrack();
        });
        console.log('Next button attached');
    }
    
    // Shuffle button
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Shuffle button clicked');
            toggleShuffle();
        });
        console.log('Shuffle button attached');
    }
    
    // Repeat button
    const repeatBtn = document.getElementById('repeatBtn');
    if (repeatBtn) {
        repeatBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Repeat button clicked');
            toggleRepeat();
        });
        console.log('Repeat button attached');
    }
    
    // Mute button
    const muteBtn = document.querySelector('.player-extras .control-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mute button clicked');
            toggleMute();
        });
        console.log('Mute button attached');
    }
    
    // Volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function(e) {
            console.log('Volume changed:', e.target.value);
            setVolume(e);
        });
        console.log('Volume slider attached');
    }
    
    // Progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.addEventListener('click', function(e) {
            console.log('Progress bar clicked');
            seekTo(e);
        });
        console.log('Progress bar attached');
    }
    
    console.log('All player controls attached');
}

// Play song with proper audio management
// Update the playSong function
function playSong(songId, fromTrash = false) {
    console.log('Playing song:', songId);
    
    const song = fromTrash ? trash.find(s => s.id === songId) : songs.find(s => s.id === songId);
    if (!song) {
        console.error('Song not found');
        return;
    }
    
    // Check if it's the same song
    if (currentSong && currentSong.id === song.id) {
        // Same song, just toggle play/pause
        togglePlayPause();
        return;
    }
    
    // Different song, stop current and play new one
    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
    }
    
    // Clear any existing progress interval
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    // Update current song
    currentSong = song;
    isPlaying = true;
    
    // Update player UI
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const playerCover = document.getElementById('playerCover');
    const playPauseIcon = document.getElementById('playPauseIcon');
    
    if (playerTitle) playerTitle.textContent = song.title;
    if (playerArtist) playerArtist.textContent = song.creator;
    if (playerCover) playerCover.src = song.artwork;
    if (playPauseIcon) playPauseIcon.className = 'fas fa-pause';
    
    // Update all play buttons to show pause icon for this song
    updatePlayButtons(song.id, true);
    
    // Load and play the new song
    audioPlayer.src = song.cdnLink;
    audioPlayer.load();
    
    const playPromise = audioPlayer.play();
    
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Start progress tracking
            progressInterval = setInterval(updateProgress, 100);
            console.log('Successfully playing:', song.title);
        })
        .catch(error => {
            console.error('Error playing song:', error);
            isPlaying = false;
            if (playPauseIcon) playPauseIcon.className = 'fas fa-play';
            updatePlayButtons(song.id, false);
            showNotification('Gagal memutar lagu');
        });
    }
}

// Update the togglePlayPause function
function togglePlayPause() {
    console.log('Toggle play/pause, current state:', isPlaying);
    
    if (!currentSong) {
        if (songs.length > 0) {
            playSong(songs[0].id);
        }
        return;
    }
    
    const playPauseIcon = document.getElementById('playPauseIcon');
    
    if (isPlaying) {
        audioPlayer.pause();
        if (playPauseIcon) playPauseIcon.className = 'fas fa-play';
        
        // Clear progress interval
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        
        // Update all play buttons to show play icon
        updatePlayButtons(currentSong.id, false);
    } else {
        audioPlayer.play();
        if (playPauseIcon) playPauseIcon.className = 'fas fa-pause';
        
        // Start progress tracking
        if (!progressInterval) {
            progressInterval = setInterval(updateProgress, 100);
        }
        
        // Update all play buttons to show pause icon
        updatePlayButtons(currentSong.id, true);
    }
    
    isPlaying = !isPlaying;
    console.log('New playing state:', isPlaying);
}

// Add this new function to update all play buttons
function updatePlayButtons(songId, isPlaying) {
    // Update all play buttons for this song
    document.querySelectorAll(`.song-card`).forEach(card => {
        const cardSongId = parseInt(card.getAttribute('onclick')?.match(/playSong\((\d+)\)/)?.[1]);
        if (cardSongId === songId) {
            const playBtn = card.querySelector('.play-btn i');
            if (playBtn) {
                playBtn.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
        } else {
            // Reset other play buttons to play icon
            const playBtn = card.querySelector('.play-btn i');
            if (playBtn) {
                playBtn.className = 'fas fa-play';
            }
        }
    });
}


// Previous track
function previousTrack() {
    console.log('Previous track');
    if (!currentSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    let prevIndex;
    
    if (isShuffled) {
        do {
            prevIndex = Math.floor(Math.random() * songs.length);
        } while (prevIndex === currentIndex && songs.length > 1);
    } else {
        prevIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    }
    
    playSong(songs[prevIndex].id);
}

// Next track
function nextTrack() {
    console.log('Next track');
    if (!currentSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    let nextIndex;
    
    if (isShuffled) {
        do {
            nextIndex = Math.floor(Math.random() * songs.length);
        } while (nextIndex === currentIndex && songs.length > 1);
    } else {
        nextIndex = (currentIndex + 1) % songs.length;
    }
    
    playSong(songs[nextIndex].id);
}

// Handle song end based on repeat mode
function handleSongEnd() {
    console.log('Song ended, repeat mode:', repeatMode);
    
    if (repeatMode === 2) {
        // Repeat current song
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else if (repeatMode === 1 || isShuffled) {
        // Repeat all or shuffle
        nextTrack();
    } else {
        // No repeat, stop playing
        isPlaying = false;
        const playPauseIcon = document.getElementById('playPauseIcon');
        if (playPauseIcon) playPauseIcon.className = 'fas fa-play';
        
        // Clear progress interval
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }
}

// Update progress bar
function updateProgress() {
    if (!audioPlayer.duration) return;
    
    const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) progressFill.style.width = progressPercent + '%';
    
    // Update current time
    const currentTimeEl = document.getElementById('currentTime');
    if (currentTimeEl) {
        const currentMinutes = Math.floor(audioPlayer.currentTime / 60);
        const currentSeconds = Math.floor(audioPlayer.currentTime % 60);
        currentTimeEl.textContent = 
            `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
    }
}

// Update duration display
function updateDuration() {
    const totalTimeEl = document.getElementById('totalTime');
    if (totalTimeEl) {
        const durationMinutes = Math.floor(audioPlayer.duration / 60);
        const durationSeconds = Math.floor(audioPlayer.duration % 60);
        totalTimeEl.textContent = 
            `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
    }
}

// Seek to position
function seekTo(event) {
    if (!audioPlayer.duration) return;
    
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;
    
    const clickPosition = event.offsetX / progressBar.offsetWidth;
    audioPlayer.currentTime = clickPosition * audioPlayer.duration;
}

// Toggle shuffle
function toggleShuffle() {
    isShuffled = !isShuffled;
    const shuffleIcon = document.getElementById('shuffleIcon');
    if (shuffleIcon) {
        const parent = shuffleIcon.parentElement;
        parent.classList.toggle('active', isShuffled);
    }
    console.log('Shuffle:', isShuffled);
    showNotification(isShuffled ? 'Shuffle ON' : 'Shuffle OFF');
}

// Toggle repeat
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const repeatIcon = document.getElementById('repeatIcon');
    
    if (repeatIcon) {
        const parent = repeatIcon.parentElement;
        parent.classList.remove('active');
        
        if (repeatMode === 1) {
            parent.classList.add('active');
            repeatIcon.className = 'fas fa-redo';
            showNotification('Repeat ALL');
        } else if (repeatMode === 2) {
            parent.classList.add('active');
            repeatIcon.className = 'fas fa-redo-alt';
            showNotification('Repeat ONE');
        } else {
            repeatIcon.className = 'fas fa-redo';
            showNotification('Repeat OFF');
        }
    }
    console.log('Repeat mode:', repeatMode);
}

// Toggle mute
function toggleMute() {
    isMuted = !isMuted;
    const volumeIcon = document.getElementById('volumeIcon');
    const volumeSlider = document.getElementById('volumeSlider');
    
    if (isMuted) {
        audioPlayer.volume = 0;
        if (volumeIcon) volumeIcon.className = 'fas fa-volume-mute';
        if (volumeSlider) volumeSlider.disabled = true;
    } else {
        audioPlayer.volume = currentVolume;
        if (volumeIcon) volumeIcon.className = 'fas fa-volume-up';
        if (volumeSlider) volumeSlider.disabled = false;
    }
    console.log('Muted:', isMuted);
}

// Volume control
function setVolume(event) {
    const volume = event.target.value / 100;
    currentVolume = volume;
    
    if (!isMuted) {
        audioPlayer.volume = volume;
    }
    
    // Update volume icon
    const volumeIcon = document.getElementById('volumeIcon');
    if (volumeIcon) {
        if (volume == 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }
}

// Load data from JSON
async function loadData() {
    try {
        const response = await fetch('datatot.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        songs = data.songs || [];
        trash = data.trash || [];
        updateCounts();
        renderSongs();
        console.log('Data loaded successfully, songs count:', songs.length);
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Gagal memuat data, menggunakan data dummy');
        
        // Use dummy data with real links
        songs = [
            {
                id: 1,
                title: "Electric Dreams",
                creator: "AI Composer",
                aiVersion: "Suno AI v3.5",
                duration: "2:35",
                type: "upload",
                prompt: "Electronic music with futuristic synths and driving beat",
                dateCreated: "2024-03-15",
                description: "A futuristic electronic track with pulsating synths and energetic beats.",
                lyrics: "Electric dreams are calling\nThrough the digital night\nNeon lights are falling\nEverything feels right",
                sunoLink: "https://suno.ai/song/5b0e75b9-ad00-41cb-8202-240e50466009",
                cdnLink: "https://cdn1.suno.ai/5b0e75b9-ad00-41cb-8202-240e50466009.mp3",
                originalLink: "https://github.com/example/electric-dreams.mp3",
                artwork: "https://picsum.photos/seed/electric/400/400"
            },
            {
                id: 2,
                title: "Midnight City",
                creator: "Night Producer",
                aiVersion: "Suno AI v3.5",
                duration: "3:12",
                type: "cover",
                prompt: "Chill electronic music with city vibes and smooth transitions",
                dateCreated: "2024-03-14",
                description: "Smooth electronic track perfect for late night city drives.",
                lyrics: "Midnight city lights\nReflecting in my eyes\nUrban paradise\nUnder neon skies",
                sunoLink: "https://suno.ai/song/45025dc5-610c-4a24-80c0-c66fb127790a",
                cdnLink: "https://cdn1.suno.ai/45025dc5-610c-4a24-80c0-c66fb127790a.mp3",
                originalLink: "https://github.com/example/midnight-city.mp3",
                artwork: "https://picsum.photos/seed/midnight/400/400"
            },
            {
                id: 3,
                title: "Cosmic Journey",
                creator: "Space Artist",
                aiVersion: "Suno AI v3.5",
                duration: "4:28",
                type: "extended",
                prompt: "Ambient space music with ethereal pads and cosmic soundscapes",
                dateCreated: "2024-03-13",
                description: "An ethereal journey through space with ambient textures and cosmic sounds.",
                lyrics: "Floating through the stars\nNebula painting the sky\nCosmic dust and solar winds\nTake me high",
                sunoLink: "https://suno.ai/song/1ae0eb1b-99e7-4e57-a05d-043c3dc2d0ea",
                cdnLink: "https://cdn1.suno.ai/1ae0eb1b-99e7-4e57-a05d-043c3dc2d0ea.mp3",
                originalLink: "https://github.com/example/cosmic-journey.mp3",
                artwork: "https://picsum.photos/seed/cosmic/400/400"
            },
            {
                id: 4,
                title: "Summer Breeze",
                creator: "Beach Vibes",
                aiVersion: "Suno AI v3.5",
                duration: "2:56",
                type: "upload",
                prompt: "Upbeat summer pop with tropical vibes and catchy melody",
                dateCreated: "2024-03-12",
                description: "Feel-good summer track with tropical elements and catchy hooks.",
                lyrics: "Summer breeze is blowing\nThrough the palm trees\nOcean waves are flowing\nPut your mind at ease",
                sunoLink: "https://suno.ai/song/ed922062-5a4b-4da4-a032-ace364be74f6",
                cdnLink: "https://cdn1.suno.ai/ed922062-5a4b-4da4-a032-ace364be74f6.mp3",
                originalLink: "https://github.com/example/summer-breeze.mp3",
                artwork: "https://picsum.photos/seed/summer/400/400"
            },
            {
                id: 5,
                title: "Digital Love",
                creator: "Cyber Heart",
                aiVersion: "Suno AI v3.5",
                duration: "3:33",
                type: "cover",
                prompt: "Synthwave love song with 80s vibes and modern production",
                dateCreated: "2024-03-11",
                description: "A modern synthwave track with retro 80s aesthetics and romantic themes.",
                lyrics: "Digital love in binary code\nHeart beats in overload\nNeon dreams we're waiting for\nTogether we'll explore",
                sunoLink: "https://suno.ai/song/82b6be9c-8e69-4e0c-bdd8-79cf8c3bb3ab",
                cdnLink: "https://cdn1.suno.ai/82b6be9c-8e69-4e0c-bdd8-79cf8c3bb3ab.mp3",
                originalLink: "https://github.com/example/digital-love.mp3",
                artwork: "https://picsum.photos/seed/digital/400/400"
            },
            {
                id: 6,
                title: "Quantum Pulse",
                creator: "Future Sound",
                aiVersion: "Suno AI v3.5",
                duration: "3:18",
                type: "upload",
                prompt: "High-tech electronic music with quantum themes and futuristic sounds",
                dateCreated: "2024-03-10",
                description: "Cutting-edge electronic track inspired by quantum physics and future technology.",
                lyrics: "Quantum pulse is rising\nThrough the dimensions\nTime is compromising\nFuture inventions",
                sunoLink: "https://suno.ai/song/0e50a5b1-70e5-4511-b2cb-f833d7894217",
                cdnLink: "https://cdn1.suno.ai/0e50a5b1-70e5-4511-b2cb-f833d7894217.mp3",
                originalLink: "https://github.com/example/quantum-pulse.mp3",
                artwork: "https://picsum.photos/seed/quantum/400/400"
            },
            {
                id: 7,
                title: "Neon Nights",
                creator: "City Lights",
                aiVersion: "Suno AI v3.5",
                duration: "4:02",
                type: "extended",
                prompt: "Night city atmosphere with neon aesthetics and smooth electronic beats",
                dateCreated: "2024-03-09",
                description: "Atmospheric electronic track capturing the essence of neon-lit city nights.",
                lyrics: "Neon nights are calling\nIn the urban sprawl\nCity lights are falling\nStanding up so tall",
                sunoLink: "https://suno.ai/song/374d070e-5089-4051-b260-7426c3062c08",
                cdnLink: "https://cdn1.suno.ai/374d070e-5089-4051-b260-7426c3062c08.mp3",
                originalLink: "https://github.com/example/neon-nights.mp3",
                artwork: "https://picsum.photos/seed/neon/400/400"
            },
            {
                id: 8,
                title: "Crystal Waves",
                creator: "Ocean Dreams",
                aiVersion: "Suno AI v3.5",
                duration: "3:27",
                type: "upload",
                prompt: "Relaxing electronic music with ocean sounds and crystal clear production",
                dateCreated: "2024-03-08",
                description: "Serene electronic track combining ocean elements with crystal-clear synths.",
                lyrics: "Crystal waves are breaking\nOn the shore of time\nOcean music making\nEverything's sublime",
                sunoLink: "https://suno.ai/song/5b9b29d8-c3ed-4a6e-9938-1091d148b2e8",
                cdnLink: "https://cdn1.suno.ai/5b9b29d8-c3ed-4a6e-9938-1091d148b2e8.mp3",
                originalLink: "https://github.com/example/crystal-waves.mp3",
                artwork: "https://picsum.photos/seed/crystal/400/400"
            },
            {
                id: 9,
                title: "Arctic Aurora",
                creator: "Northern Lights",
                aiVersion: "Suno AI v3.5",
                duration: "3:45",
                type: "cover",
                prompt: "Ambient music inspired by northern lights with cold atmospheric textures",
                dateCreated: "2024-03-07",
                description: "Mysterious ambient track capturing the beauty of arctic aurora borealis.",
                lyrics: "Arctic aurora dancing\nIn the polar sky\nGreen lights are prancing\nAs the time goes by",
                sunoLink: "https://suno.ai/song/b20dfb5b-94c1-4d8f-a8e6-6bc4e3237094",
                cdnLink: "https://cdn1.suno.ai/b20dfb5b-94c1-4d8f-a8e6-6bc4e3237094.mp3",
                originalLink: "https://github.com/example/arctic-aurora.mp3",
                artwork: "https://picsum.photos/seed/arctic/400/400"
            },
            {
                id: 10,
                title: "Desert Mirage",
                creator: "Sand Dunes",
                aiVersion: "Suno AI v3.5",
                duration: "3:15",
                type: "upload",
                prompt: "Mysterious desert atmosphere with mirage-like electronic textures",
                dateCreated: "2024-03-06",
                description: "Enigmatic electronic track evoking desert mirages and mysterious landscapes.",
                lyrics: "Desert mirage is shining\nIn the endless sand\nMysteries aligning\nAcross the barren land",
                sunoLink: "https://suno.ai/song/733055c4-f9ec-436a-8a51-a707f41834e6",
                cdnLink: "https://cdn1.suno.ai/733055c4-f9ec-436a-8a51-a707f41834e6.mp3",
                originalLink: "https://github.com/example/desert-mirage.mp3",
                artwork: "https://picsum.photos/seed/desert/400/400"
            }
        ];
        updateCounts();
        renderSongs();
    }
}

// Save data to JSON (simulated)
function saveData() {
    localStorage.setItem('ctf-studio-songs', JSON.stringify(songs));
    localStorage.setItem('ctf-studio-trash', JSON.stringify(trash));
    console.log('Data saved');
}

// View toggle
function setView(view) {
    currentView = view;
    
    // Update button states
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    
    if (gridViewBtn) gridViewBtn.classList.toggle('active', view === 'grid');
    if (listViewBtn) listViewBtn.classList.toggle('active', view === 'list');
    
    // Re-render songs with new view
    if (currentPage === 'songs') {
        renderSongs();
    } else if (currentPage === 'trash') {
        renderTrash();
    }
}

// Navigation
function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page-view').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) pageElement.classList.add('active');
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const navLink = document.querySelector(`[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');
    
    currentPage = page;
    
    // Render content based on page
    if (page === 'songs') {
        renderSongs();
    } else if (page === 'trash') {
        renderTrash();
    }
}

// Update counts
function updateCounts() {
    const songCount = document.getElementById('songCount');
    const trashCount = document.getElementById('trashCount');
    
    if (songCount) songCount.textContent = songs.length;
    if (trashCount) trashCount.textContent = trash.length;
}

// Render songs
function renderSongs() {
    const grid = document.getElementById('songsGrid');
    if (!grid) return;
    
    let sortedSongs = [...songs];
    
    // Apply filter
    switch(currentFilter) {
        case 'terbaru':
            sortedSongs.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
            break;
        case 'terlama':
            sortedSongs.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
            break;
        case 'az':
            sortedSongs.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'za':
            sortedSongs.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
    
    // Set view class
    grid.className = currentView === 'list' ? 'songs-grid list-view' : 'songs-grid';
    
    grid.innerHTML = sortedSongs.map(song => {
        if (currentView === 'list') {
            return `
                <div class="song-card list-card" onclick="playSong(${song.id})">
                    <div class="song-card-image">
                        <img src="${song.artwork}" alt="${song.title}">
                        <div class="play-overlay">
                            <div class="play-btn">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                    </div>
                    <div class="song-card-info">
                        <div class="song-card-header">
                            <a href="#" class="song-card-title" onclick="event.stopPropagation(); viewSongDetail(${song.id})">${song.title}</a>
                            <div class="song-card-meta">
                                <span class="song-card-creator">${song.creator}</span>
                                <div class="song-card-details">
                                    <span>${song.duration}</span>
                                    <span>${song.aiVersion}</span>
                                </div>
                            </div>
                            <div class="song-type-badge badge-${song.type}">${song.type.toUpperCase()}</div>
                        </div>
                        <div class="song-card-menu">
                            <button class="menu-dots" onclick="event.stopPropagation(); toggleMenu(${song.id}, 'songs')">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu" id="menu-${song.id}">
                                <div class="dropdown-item" onclick="event.stopPropagation(); editSong(${song.id})">
                                    <i class="fas fa-edit"></i> Edit Metadata
                                </div>
                                <div class="dropdown-item" onclick="event.stopPropagation(); deleteSong(${song.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </div>
                                <div class="dropdown-item" onclick="event.stopPropagation(); downloadSong(${song.id})">
                                    <i class="fas fa-download"></i> Download
                                </div>
                                <div class="dropdown-item" onclick="event.stopPropagation(); openSunoLink(${song.id})">
                                    <i class="fas fa-external-link-alt"></i> Suno Link
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="song-card" onclick="playSong(${song.id})">
                    <div class="song-card-image">
                        <img src="${song.artwork}" alt="${song.title}">
                        <div class="play-overlay">
                            <div class="play-btn">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                    </div>
                    <div class="song-card-info">
                        <div class="song-card-header">
                            <a href="#" class="song-card-title" onclick="event.stopPropagation(); viewSongDetail(${song.id})">${song.title}</a>
                            <div class="song-card-menu">
                                <button class="menu-dots" onclick="event.stopPropagation(); toggleMenu(${song.id}, 'songs')">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="dropdown-menu" id="menu-${song.id}">
                                    <div class="dropdown-item" onclick="event.stopPropagation(); editSong(${song.id})">
                                        <i class="fas fa-edit"></i> Edit Metadata
                                    </div>
                                    <div class="dropdown-item" onclick="event.stopPropagation(); deleteSong(${song.id})">
                                        <i class="fas fa-trash"></i> Delete
                                    </div>
                                    <div class="dropdown-item" onclick="event.stopPropagation(); downloadSong(${song.id})">
                                        <i class="fas fa-download"></i> Download
                                    </div>
                                    <div class="dropdown-item" onclick="event.stopPropagation(); openSunoLink(${song.id})">
                                        <i class="fas fa-external-link-alt"></i> Suno Link
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="song-card-meta">
                            <span class="song-card-creator">${song.creator}</span>
                            <div class="song-card-details">
                                <span>${song.duration}</span>
                                <span>${song.aiVersion}</span>
                            </div>
                        </div>
                        <div class="song-type-badge badge-${song.type}">${song.type.toUpperCase()}</div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// Search songs
function searchSongs(query) {
    if (!query) {
        renderSongs();
        return;
    }
    
    const filtered = songs.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.creator.toLowerCase().includes(query) ||
        song.type.toLowerCase().includes(query)
    );
    
    const grid = document.getElementById('songsGrid');
    if (!grid) return;
    
    grid.className = currentView === 'list' ? 'songs-grid list-view' : 'songs-grid';
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">Tidak ada lagu ditemukan</div>';
    } else {
        // Render filtered songs (similar to renderSongs but with filtered data)
        grid.innerHTML = filtered.map(song => {
            if (currentView === 'list') {
                return `
                    <div class="song-card list-card" onclick="playSong(${song.id})">
                        <div class="song-card-image">
                            <img src="${song.artwork}" alt="${song.title}">
                            <div class="play-overlay">
                                <div class="play-btn">
                                    <i class="fas fa-play"></i>
                                </div>
                            </div>
                        </div>
                        <div class="song-card-info">
                            <div class="song-card-header">
                                <a href="#" class="song-card-title" onclick="event.stopPropagation(); viewSongDetail(${song.id})">${song.title}</a>
                                <div class="song-card-meta">
                                    <span class="song-card-creator">${song.creator}</span>
                                    <div class="song-card-details">
                                        <span>${song.duration}</span>
                                        <span>${song.aiVersion}</span>
                                    </div>
                                </div>
                                <div class="song-type-badge badge-${song.type}">${song.type.toUpperCase()}</div>
                            </div>
                            <div class="song-card-menu">
                                <button class="menu-dots" onclick="event.stopPropagation(); toggleMenu(${song.id}, 'songs')">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="dropdown-menu" id="menu-${song.id}">
                                    <div class="dropdown-item" onclick="event.stopPropagation(); editSong(${song.id})">
                                        <i class="fas fa-edit"></i> Edit Metadata
                                    </div>
                                    <div class="dropdown-item" onclick="event.stopPropagation(); deleteSong(${song.id})">
                                        <i class="fas fa-trash"></i> Delete
                                    </div>
                                    <div class="dropdown-item" onclick="event.stopPropagation(); downloadSong(${song.id})">
                                        <i class="fas fa-download"></i> Download
                                    </div>
                                    <div class="dropdown-item" onclick="event.stopPropagation(); openSunoLink(${song.id})">
                                        <i class="fas fa-external-link-alt"></i> Suno Link
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="song-card" onclick="playSong(${song.id})">
                        <div class="song-card-image">
                            <img src="${song.artwork}" alt="${song.title}">
                            <div class="play-overlay">
                                <div class="play-btn">
                                    <i class="fas fa-play"></i>
                                </div>
                            </div>
                        </div>
                        <div class="song-card-info">
                            <div class="song-card-header">
                                <a href="#" class="song-card-title" onclick="event.stopPropagation(); viewSongDetail(${song.id})">${song.title}</a>
                                <div class="song-card-menu">
                                    <button class="menu-dots" onclick="event.stopPropagation(); toggleMenu(${song.id}, 'songs')">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <div class="dropdown-menu" id="menu-${song.id}">
                                        <div class="dropdown-item" onclick="event.stopPropagation(); editSong(${song.id})">
                                            <i class="fas fa-edit"></i> Edit Metadata
                                        </div>
                                        <div class="dropdown-item" onclick="event.stopPropagation(); deleteSong(${song.id})">
                                            <i class="fas fa-trash"></i> Delete
                                        </div>
                                        <div class="dropdown-item" onclick="event.stopPropagation(); downloadSong(${song.id})">
                                            <i class="fas fa-download"></i> Download
                                        </div>
                                        <div class="dropdown-item" onclick="event.stopPropagation(); openSunoLink(${song.id})">
                                            <i class="fas fa-external-link-alt"></i> Suno Link
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="song-card-meta">
                                <span class="song-card-creator">${song.creator}</span>
                                <div class="song-card-details">
                                    <span>${song.duration}</span>
                                    <span>${song.aiVersion}</span>
                                </div>
                            </div>
                            <div class="song-type-badge badge-${song.type}">${song.type.toUpperCase()}</div>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }
}

// Toggle dropdown menu
function toggleMenu(songId, context) {
    const menu = document.getElementById(`menu-${songId}`);
    if (!menu) return;
    
    // Close all other menus
    document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m !== menu) {
            m.classList.remove('active');
        }
    });
    
    menu.classList.toggle('active');
}

// Filter functions
function setFilter(filter) {
    currentFilter = filter;
    const labels = {
        'terbaru': 'Terbaru',
        'terlama': 'Terlama',
        'az': 'A-Z',
        'za': 'Z-A'
    };
    const filterLabel = document.getElementById('filterLabel');
    if (filterLabel) filterLabel.textContent = labels[filter];
    
    const filterMenu = document.getElementById('filterMenu');
    if (filterMenu) filterMenu.classList.remove('active');
    
    renderSongs();
}

// Add new song
function addNewSong() {
    const newSong = {
        id: Date.now(),
        title: document.getElementById('songTitle').value,
        creator: document.getElementById('songCreator').value,
        prompt: document.getElementById('songPrompt').value,
        aiVersion: document.getElementById('songAIVersion').value,
        duration: document.getElementById('songDuration').value,
        type: document.getElementById('songType').value,
        artwork: document.getElementById('songArtwork').value,
        sunoLink: document.getElementById('songSunoLink').value,
        cdnLink: document.getElementById('songCDNLink').value,
        originalLink: document.getElementById('songOriginalLink').value,
        description: document.getElementById('songDescription').value,
        lyrics: document.getElementById('songLyrics').value,
        dateCreated: new Date().toISOString().split('T')[0]
    };
    
    songs.unshift(newSong);
    saveData();
    updateCounts();
    
    // Reset form
    document.getElementById('addSongForm').reset();
    
    showNotification('Lagu berhasil ditambahkan');
    navigateTo('songs');
}

// View song detail
function viewSongDetail(songId) {
    const song = songs.find(s => s.id === songId);
    if (!song) return;
    
    const detailContainer = document.getElementById('songDetail');
    detailContainer.innerHTML = `
        <div class="detail-artwork">
            <img src="${song.artwork}" alt="${song.title}">
        </div>
        <div class="detail-content">
            <h1 class="detail-title">${song.title}</h1>
            
            <div class="detail-prompt">
                <div class="detail-prompt-label">Prompt Lagu</div>
                <div class="detail-prompt-text">${song.prompt}</div>
            </div>
            
            <div class="detail-meta">
                <div class="meta-item">
                    <div class="meta-label">Dibuat oleh</div>
                    <div class="meta-value">${song.creator}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Tanggal Dibuat</div>
                    <div class="meta-value">${song.dateCreated}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">AI Version</div>
                    <div class="meta-value">${song.aiVersion}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Durasi</div>
                    <div class="meta-value">${song.duration}</div>
                </div>
            </div>
            
            <div class="detail-type-card badge-${song.type}">
                ${song.type.toUpperCase()}
            </div>
            
            <div class="detail-section">
                <h3>Links</h3>
                <div class="meta-item">
                    <div class="meta-label">Suno AI</div>
                    <div class="meta-value">
                        ${song.sunoLink ? `<a href="${song.sunoLink}" target="_blank" style="color: var(--accent-primary);">Buka di Suno AI</a>` : 'Tidak ada link'}
                    </div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">CDN Link</div>
                    <div class="meta-value">
                        <a href="${song.cdnLink}" target="_blank" style="color: var(--accent-primary);">Putar/Download</a>
                    </div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Original File</div>
                    <div class="meta-value">
                        ${song.originalLink ? `<a href="${song.originalLink}" target="_blank" style="color: var(--accent-primary);">Buka File</a>` : 'Tidak ada link'}
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Deskripsi</h3>
                <div class="detail-description">${song.description || 'Tidak ada deskripsi'}</div>
            </div>
            
            <div class="detail-section">
                <h3>Lirik</h3>
                <div class="detail-lyrics">
                    ${song.lyrics ? song.lyrics.split('\n').map(line => `<div class="lyrics-line">${line}</div>`).join('') : 'Tidak ada lirik'}
                </div>
            </div>
        </div>
    `;
    
    navigateTo('detail');
}

// Edit song
function editSong(songId) {
    const song = songs.find(s => s.id === songId);
    if (!song) return;
    
    currentEditSong = song;
    
    // Populate form
    document.getElementById('editTitle').value = song.title;
    document.getElementById('editPrompt').value = song.prompt;
    document.getElementById('editCreator').value = song.creator;
    document.getElementById('editAIVersion').value = song.aiVersion;
    document.getElementById('editType').value = song.type;
    document.getElementById('editSunoLink').value = song.sunoLink || '';
    document.getElementById('editCDNLink').value = song.cdnLink;
    document.getElementById('editOriginalLink').value = song.originalLink || '';
    document.getElementById('editDescription').value = song.description || '';
    document.getElementById('editLyrics').value = song.lyrics || '';
    document.getElementById('editArtwork').src = song.artwork;
    
    navigateTo('edit');
}

// Save edited song
function saveEditedSong() {
    if (!currentEditSong) return;
    
    // Update song data
    currentEditSong.title = document.getElementById('editTitle').value;
    currentEditSong.prompt = document.getElementById('editPrompt').value;
    currentEditSong.creator = document.getElementById('editCreator').value;
    currentEditSong.aiVersion = document.getElementById('editAIVersion').value;
    currentEditSong.type = document.getElementById('editType').value;
    currentEditSong.sunoLink = document.getElementById('editSunoLink').value;
    currentEditSong.cdnLink = document.getElementById('editCDNLink').value;
    currentEditSong.originalLink = document.getElementById('editOriginalLink').value;
    currentEditSong.description = document.getElementById('editDescription').value;
    currentEditSong.lyrics = document.getElementById('editLyrics').value;
    
    saveData();
    showNotification('Metadata berhasil disimpan');
    navigateTo('songs');
}

// Delete song
function deleteSong(songId) {
    if (confirm('Apakah kamu yakin ingin menghapus lagu ini?')) {
        const songIndex = songs.findIndex(s => s.id === songId);
        if (songIndex !== -1) {
            const song = songs[songIndex];
            trash.push(song);
            songs.splice(songIndex, 1);
            saveData();
            updateCounts();
            renderSongs();
            showNotification('Lagu dipindahkan ke trash');
        }
    }
}

// Download song
function downloadSong(songId) {
    const song = songs.find(s => s.id === songId);
    if (song) {
        const a = document.createElement('a');
        a.href = song.cdnLink;
        a.download = `${song.title}.mp3`;
        a.click();
        showNotification('Mengunduh lagu...');
    }
}

// Open Suno link
function openSunoLink(songId) {
    const song = songs.find(s => s.id === songId);
    if (song) {
        window.open(song.sunoLink || song.cdnLink, '_blank');
    }
}

function renderTrash() {
    const trashEmpty = document.getElementById('trashEmpty');
    const trashGrid = document.getElementById('trashGrid');
    
    if (!trashEmpty || !trashGrid) return;
    
    if (trash.length === 0) {
        trashEmpty.style.display = 'block';
        trashGrid.style.display = 'none';
    } else {
        trashEmpty.style.display = 'none';
        trashGrid.style.display = 'grid';
        trashGrid.className = currentView === 'list' ? 'songs-grid list-view' : 'songs-grid';
        
        trashGrid.innerHTML = trash.map(song => {
            if (currentView === 'list') {
                return `
                    <div class="song-card list-card" onclick="playSong(${song.id}, true)">
                        <div class="song-card-image">
                            <img src="${song.artwork}" alt="${song.title}">
                            <div class="play-overlay">
                                <div class="play-btn" onclick="event.stopPropagation(); togglePlayPause();">
                                    <i class="fas ${currentSong && currentSong.id === song.id && isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                                </div>
                            </div>
                        </div>
                        <div class="song-card-info">
                            <div class="song-card-header">
                                <a href="#" class="song-card-title" onclick="event.stopPropagation(); viewSongDetail(${song.id}, true)">${song.title}</a>
                                <div class="song-card-meta">
                                    <span class="song-card-creator">${song.creator}</span>
                                    <div class="song-card-details">
                                        <span>${song.duration}</span>
                                        <span>${song.aiVersion}</span>
                                    </div>
                                </div>
                                <div class="song-type-badge badge-${song.type}">${song.type.toUpperCase()}</div>
                            </div>
                            <div class="song-card-menu">
                                <button class="menu-dots" onclick="event.stopPropagation(); toggleMenu(${song.id}, 'trash')">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="dropdown-menu" id="menu-${song.id}">
                                    <div class="dropdown-item" onclick="event.stopPropagation(); restoreSong(${song.id})">
                                        <i class="fas fa-undo"></i> Restore
                                    </div>
                                    <div class="dropdown-item" onclick="event.stopPropagation(); deletePermanently(${song.id})">
                                        <i class="fas fa-trash-alt"></i> Delete Permanently
                                    </div>
                                    <div class="dropdown-item" onclick="event.stopPropagation(); openSunoLink(${song.id}, true)">
                                        <i class="fas fa-external-link-alt"></i> Suno Link
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="song-card" onclick="playSong(${song.id}, true)">
                        <div class="song-card-image">
                            <img src="${song.artwork}" alt="${song.title}">
                            <div class="play-overlay">
                                <div class="play-btn" onclick="event.stopPropagation(); togglePlayPause();">
                                    <i class="fas ${currentSong && currentSong.id === song.id && isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                                </div>
                            </div>
                        </div>
                        <div class="song-card-info">
                            <div class="song-card-header">
                                <a href="#" class="song-card-title" onclick="event.stopPropagation(); viewSongDetail(${song.id}, true)">${song.title}</a>
                                <div class="song-card-menu">
                                    <button class="menu-dots" onclick="event.stopPropagation(); toggleMenu(${song.id}, 'trash')">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <div class="dropdown-menu" id="menu-${song.id}">
                                        <div class="dropdown-item" onclick="event.stopPropagation(); restoreSong(${song.id})">
                                            <i class="fas fa-undo"></i> Restore
                                        </div>
                                        <div class="dropdown-item" onclick="event.stopPropagation(); deletePermanently(${song.id})">
                                            <i class="fas fa-trash-alt"></i> Delete Permanently
                                        </div>
                                        <div class="dropdown-item" onclick="event.stopPropagation(); openSunoLink(${song.id}, true)">
                                            <i class="fas fa-external-link-alt"></i> Suno Link
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="song-card-meta">
                            <span class="song-card-creator">${song.creator}</span>
                            <div class="song-card-details">
                                <span>${song.duration}</span>
                                <span>${song.aiVersion}</span>
                            </div>
                        </div>
                        <div class="song-type-badge badge-${song.type}">${song.type.toUpperCase()}</div>
                    </div>
                `;
            }
        }).join('');
    }
}
// Restore song from trash
function restoreSong(songId) {
    const songIndex = trash.findIndex(s => s.id === songId);
    if (songIndex !== -1) {
        const song = trash[songIndex];
        songs.push(song);
        trash.splice(songIndex, 1);
        saveData();
        updateCounts();
        renderTrash();
        showNotification('Lagu dipulihkan');
    }
}

// Delete permanently
function deletePermanently(songId) {
    if (confirm('Apakah kamu yakin ingin menghapus lagu ini secara permanen? Tindakan ini tidak bisa dibatalkan.')) {
        const songIndex = trash.findIndex(s => s.id === songId);
        if (songIndex !== -1) {
            trash.splice(songIndex, 1);
            saveData();
            updateCounts();
            renderTrash();
            showNotification('Lagu dihapus permanen');
        }
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (window.innerWidth <= 768 && 
        sidebar && !sidebar.contains(e.target) && 
        menuToggle && !menuToggle.contains(e.target) &&
        sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
});
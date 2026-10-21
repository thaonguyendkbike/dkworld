// ============================================================================
// DK BIKE WORLD - YOUTUBE AUDIO & STREAM ENGINE
// Embedded YouTube IFrame API: Playlist 6 bản nhạc tuyển chọn & Tự động phát
// ============================================================================

export const DEFAULT_YOUTUBE_PLAYLIST = [
  { id: 'kbdOQF3XjKI', startSeconds: 5808, label: 'Bản 1 🎶', name: 'Acoustic Chill Tuyển Chọn 01', url: 'https://www.youtube.com/watch?v=kbdOQF3XjKI&t=5808s' },
  { id: '1D9hx7gcKjo', startSeconds: 946,  label: 'Bản 2 ☕', name: 'Lofi Chill Cafe 02', url: 'https://www.youtube.com/watch?v=1D9hx7gcKjo&t=946s' },
  { id: 'Px1HC9ExXOk', startSeconds: 0,    label: 'Bản 3 🍃', name: 'Nhạc Không Lời Tĩnh Tâm 03', url: 'https://www.youtube.com/watch?v=Px1HC9ExXOk' },
  { id: '0nO6OwUUF2k', startSeconds: 0,    label: 'Bản 4 🌅', name: 'Giai Điệu Bình Yên 04', url: 'https://www.youtube.com/watch?v=0nO6OwUUF2k' },
  { id: 'l-vSSYEuO88', startSeconds: 2051, label: 'Bản 5 🎹', name: 'Piano & Ballad Thư Giãn 05', url: 'https://www.youtube.com/watch?v=l-vSSYEuO88&t=2051s' },
  { id: 's-sRvyFMlSY', startSeconds: 3098, label: 'Bản 6 🪷', name: 'Tuyển Tập Nhạc Ngọt Ngào 06', url: 'https://www.youtube.com/watch?v=s-sRvyFMlSY&t=3098s' },
];

class YouTubeAudioManager {
  constructor() {
    this.player = null;
    this.isApiReady = false;
    this.isPlayerReady = false;
    this.isPlaying = false;
    this.currentTrackIndex = 0;
    this.currentVideoId = DEFAULT_YOUTUBE_PLAYLIST[0].id;
    this.currentTitle = DEFAULT_YOUTUBE_PLAYLIST[0].name;
    this.volume = 65;
    this.autoStart = true;

    // Callbacks
    this.onStateChange = null;
    this.onError = null;
    this.onTrackChange = null;
  }

  init(containerId = 'yt-player-target', autoStart = true) {
    this.containerId = containerId;
    this.autoStart = autoStart;

    if (window.YT && window.YT.Player) {
      this.isApiReady = true;
      this.createPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        this.isApiReady = true;
        this.createPlayer();
      };

      if (!document.getElementById('yt-iframe-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }
    }

    // Thiết lập tương tác lần đầu để kích hoạt Autoplay (vượt rào cản Autoplay Policy trình duyệt)
    if (autoStart) {
      this.setupAutoplayListener();
    }
  }

  setupAutoplayListener() {
    const triggerAutoplayOnGesture = () => {
      if (!this.isPlaying && this.isPlayerReady && this.player) {
        this.playCurrent();
      }
    };
    ['click', 'pointerdown', 'keydown', 'touchstart'].forEach((eventType) => {
      window.addEventListener(eventType, triggerAutoplayOnGesture, { once: true, passive: true });
    });
  }

  createPlayer() {
    if (this.player || !document.getElementById(this.containerId)) return;

    const initialTrack = DEFAULT_YOUTUBE_PLAYLIST[this.currentTrackIndex];

    try {
      this.player = new window.YT.Player(this.containerId, {
        height: '140',
        width: '100%',
        videoId: initialTrack.id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: initialTrack.startSeconds || 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.isPlayerReady = true;
            try {
              this.player.setVolume(this.volume);
            } catch (e) {}

            if (this.autoStart) {
              this.playCurrent();
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
            this.isPlaying = event.data === 1;
            const title = this.getVideoTitle();

            // Tự động chuyển bài khi bài hiện tại phát hết
            if (event.data === 0) {
              this.nextTrack();
              return;
            }

            if (this.onStateChange) this.onStateChange(this.isPlaying, title, this.currentTrackIndex);
          },
          onError: (event) => {
            let msg = 'Không thể phát video này';
            if (event.data === 101 || event.data === 150) {
              msg = 'Video này bị tác giả hạn chế nhúng. Đang tự chuyển sang bài tiếp theo...';
              setTimeout(() => this.nextTrack(), 1500);
            } else if (event.data === 100) {
              msg = 'Không tìm thấy video này trên YouTube!';
              setTimeout(() => this.nextTrack(), 1500);
            } else if (event.data === 2) {
              msg = 'Link hoặc ID video không hợp lệ!';
            }
            if (this.onError) this.onError(msg, event.data);
          },
        },
      });
    } catch (err) {
      console.warn('Lỗi khởi tạo YouTube Player:', err);
    }
  }

  playCurrent() {
    const track = DEFAULT_YOUTUBE_PLAYLIST[this.currentTrackIndex];
    if (!track) return;
    this.playTrack(track.id, track.startSeconds || 0, track.name);
  }

  playTrackByIndex(index) {
    if (index < 0 || index >= DEFAULT_YOUTUBE_PLAYLIST.length) return;
    this.currentTrackIndex = index;
    const track = DEFAULT_YOUTUBE_PLAYLIST[index];
    this.playTrack(track.id, track.startSeconds || 0, track.name);
  }

  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % DEFAULT_YOUTUBE_PLAYLIST.length;
    this.playCurrent();
    if (this.onTrackChange) this.onTrackChange(this.currentTrackIndex);
  }

  prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + DEFAULT_YOUTUBE_PLAYLIST.length) % DEFAULT_YOUTUBE_PLAYLIST.length;
    this.playCurrent();
    if (this.onTrackChange) this.onTrackChange(this.currentTrackIndex);
  }

  playTrack(videoId, startSeconds = 0, fallbackTitle = '') {
    if (!videoId) return;
    this.currentVideoId = videoId;
    if (fallbackTitle) this.currentTitle = fallbackTitle;

    if (!this.isPlayerReady || !this.player) {
      return;
    }

    try {
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: startSeconds,
      });
      this.player.playVideo();
      this.player.setVolume(this.volume);
      this.isPlaying = true;
      if (this.onTrackChange) this.onTrackChange(this.currentTrackIndex);
    } catch (e) {
      console.warn('Lỗi khi phát video YouTube:', e);
    }
  }

  togglePlay() {
    if (!this.player || !this.isPlayerReady) return;
    try {
      if (this.isPlaying) {
        this.player.pauseVideo();
        this.isPlaying = false;
      } else {
        this.player.playVideo();
        this.isPlaying = true;
      }
    } catch (e) {}
  }

  pause() {
    if (!this.player || !this.isPlayerReady) return;
    try {
      this.player.pauseVideo();
      this.isPlaying = false;
    } catch (e) {}
  }

  stop() {
    if (!this.player || !this.isPlayerReady) return;
    try {
      this.player.stopVideo();
      this.isPlaying = false;
    } catch (e) {}
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, Math.round(vol)));
    if (this.player && this.isPlayerReady) {
      try {
        this.player.setVolume(this.volume);
      } catch (e) {}
    }
  }

  getVideoTitle() {
    if (!this.player || !this.isPlayerReady) return this.currentTitle || '';
    try {
      const data = this.player.getVideoData();
      return data && data.title ? data.title : (this.currentTitle || '');
    } catch (e) {
      return this.currentTitle || '';
    }
  }
}

export function extractYouTubeId(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

export function extractYouTubeIdAndStart(url) {
  if (!url) return { id: null, startSeconds: 0 };
  const trimmed = url.trim();
  const id = extractYouTubeId(trimmed);
  let startSeconds = 0;
  const timeMatch = trimmed.match(/[?&]t=(\d+)s?/);
  if (timeMatch) {
    startSeconds = parseInt(timeMatch[1], 10) || 0;
  }
  return { id, startSeconds };
}

export const youtubeAudioManager = new YouTubeAudioManager();

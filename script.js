// 상수 정의
const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = '327393c67dcccedba9ce5189614eda99';
const API_ENDPOINT = `${API_BASE_URL}/movie/now_playing`;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
const POSTER_PLACEHOLDER = 'https://via.placeholder.com/500x750?text=No+Poster';
const YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/';

// DOM 요소 참조
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const moviesGridElement = document.getElementById('moviesGrid');
const featuredMovieElement = document.getElementById('featuredMovie');
const moviesSectionElement = document.getElementById('moviesSection');
const mainContentWrapperElement = document.getElementById('mainContentWrapper');
const videoContainerElement = document.getElementById('videoContainer');
const videoPlaceholderElement = document.getElementById('videoPlaceholder');
const videoModalElement = document.getElementById('videoModal');
const featuredMovieTitleElement = document.getElementById('featuredMovieTitle');
const featuredRatingElement = document.getElementById('featuredRating');
const heroYearElement = document.getElementById('heroYear');
const featuredMovieOverviewElement = document.getElementById('featuredMovieOverview');
const heroBackdropElement = document.getElementById('heroBackdrop');
const heroVideoContainerElement = document.getElementById('heroVideoContainer');
const heroVideoPlaceholderElement = document.getElementById('heroVideoPlaceholder');
const headerElement = document.querySelector('.header');
const bookingModalElement = document.getElementById('bookingModal');

// 현재 선택된 메인 영화 정보
let currentFeaturedMovie = null;
let currentVideoKey = null;
let allMovies = []; // 모든 영화 데이터 저장
let currentTab = 'nowPlaying'; // 현재 탭 상태
let allGenres = []; // 모든 장르 데이터 저장
let currentGenreId = 'all'; // 현재 선택된 장르 ID

/**
 * API에서 장르 목록을 가져옵니다.
 * @returns {Promise<Array>} 장르 데이터 배열
 */
async function fetchGenres() {
    try {
        const response = await fetch(`${API_BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=ko-KR`);
        
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        
        const data = await response.json();
        return data.genres || [];
    } catch (error) {
        console.error('장르 데이터 가져오기 실패:', error);
        return [];
    }
}

/**
 * API에서 현재 상영 중인 영화 데이터를 가져옵니다.
 * @returns {Promise<Array>} 영화 데이터 배열
 */
async function fetchNowPlayingMovies() {
    try {
        const response = await fetch(`${API_ENDPOINT}?api_key=${API_KEY}&language=ko-KR`);
        
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('영화 데이터 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 영화 데이터를 인기순으로 정렬합니다.
 * @param {Array} movies - 영화 데이터 배열
 * @returns {Array} 정렬된 영화 데이터 배열
 */
function sortMoviesByPopularity(movies) {
    return [...movies].sort((a, b) => b.popularity - a.popularity);
}

/**
 * 영화 데이터를 예매율순으로 정렬합니다.
 * @param {Array} movies - 영화 데이터 배열
 * @returns {Array} 정렬된 영화 데이터 배열
 */
function sortMoviesByBooking(movies) {
    // vote_count를 예매율로 사용 (투표 수가 많을수록 예매율이 높다고 가정)
    return [...movies].sort((a, b) => b.vote_count - a.vote_count);
}

/**
 * 영화 포스터 이미지 URL을 생성합니다.
 * @param {string|null} posterPath - 포스터 경로
 * @returns {string} 포스터 이미지 URL
 */
function getPosterImageUrl(posterPath) {
    if (!posterPath) {
        return POSTER_PLACEHOLDER;
    }
    return `${IMAGE_BASE_URL}${posterPath}`;
}

/**
 * 장르 이름을 가져옵니다.
 * @param {Array} genreIds - 장르 ID 배열
 * @returns {string} 장르 이름 문자열
 */
function getGenreNames(genreIds) {
    if (!genreIds || genreIds.length === 0) return '';
    
    const genreNames = genreIds
        .slice(0, 2) // 최대 2개만 표시
        .map(id => {
            const genre = allGenres.find(g => g.id === id);
            return genre ? genre.name : '';
        })
        .filter(name => name !== '');
    
    return genreNames.join(', ');
}

/**
 * 영화 카드 HTML을 생성합니다.
 * @param {Object} movie - 영화 데이터 객체
 * @returns {string} 영화 카드 HTML 문자열
 */
/**
 * 개봉일을 포맷팅합니다.
 * @param {string} releaseDate - YYYY-MM-DD 형식의 날짜 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
function formatReleaseDate(releaseDate) {
    if (!releaseDate) return '';
    
    try {
        const date = new Date(releaseDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    } catch (error) {
        return releaseDate;
    }
}

/**
 * 영화 카드 HTML을 생성합니다.
 * @param {Object} movie - 영화 데이터 객체
 * @returns {string} 영화 카드 HTML 문자열
 */
function createMovieCard(movie) {
    const posterUrl = getPosterImageUrl(movie.poster_path);
    const title = movie.title || '제목 없음';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '0.0';
    const movieId = movie.id;
    const genreNames = getGenreNames(movie.genre_ids);
    const releaseDate = formatReleaseDate(movie.release_date);

    return `
        <div class="movie-card" data-movie-id="${movieId}" onclick="handleMovieClick(${movieId})">
            <div class="movie-poster-container">
                ${movie.poster_path 
                    ? `<img src="${posterUrl}" alt="${title}" class="movie-poster" loading="lazy">`
                    : `<div class="movie-poster-placeholder">포스터 없음</div>`
                }
            </div>
            <div class="movie-info">
                <div class="movie-title-wrapper">
                    <h3 class="movie-title">${title}</h3>
                    ${releaseDate ? `<span class="movie-release-date">${releaseDate}</span>` : ''}
                </div>
                ${genreNames ? `<div class="movie-genres">${genreNames}</div>` : ''}
                <div class="movie-rating">
                    <span class="rating-icon">⭐</span>
                    <span class="rating-value">${rating}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * 영화 목록을 화면에 렌더링합니다.
 * @param {Array} movies - 영화 데이터 배열
 */
function renderMovies(movies) {
    if (movies.length === 0) {
        showError('표시할 영화가 없습니다.');
        return;
    }

    // 원본 데이터 저장
    allMovies = movies;
    
    // 필터 적용
    applyFilters();
    
    if (mainContentWrapperElement) {
        mainContentWrapperElement.style.display = 'grid';
    }
}

/**
 * 영화 목록을 업데이트합니다.
 * @param {Array} movies - 표시할 영화 배열
 */
function updateMoviesList(movies) {
    const cardsHtml = movies.map(createMovieCard).join('');
    moviesGridElement.innerHTML = cardsHtml;
}

/**
 * 탭을 전환합니다.
 * @param {string} tab - 'nowPlaying', 'popular', 또는 'booking'
 */
function switchTab(tab) {
    currentTab = tab;
    
    // 탭 버튼 활성화 상태 변경
    const tabNowPlaying = document.getElementById('tabNowPlaying');
    const tabPopular = document.getElementById('tabPopular');
    const tabBooking = document.getElementById('tabBooking');
    const sectionTitle = document.getElementById('sectionTitle');
    
    // 모든 탭 비활성화
    tabNowPlaying.classList.remove('active');
    tabPopular.classList.remove('active');
    tabBooking.classList.remove('active');
    
    // 선택된 탭 활성화 및 제목 변경
    if (tab === 'nowPlaying') {
        tabNowPlaying.classList.add('active');
        if (sectionTitle) {
            sectionTitle.textContent = '현재 상영작';
        }
    } else if (tab === 'popular') {
        tabPopular.classList.add('active');
        if (sectionTitle) {
            sectionTitle.textContent = '인기순';
        }
    } else if (tab === 'booking') {
        tabBooking.classList.add('active');
        if (sectionTitle) {
            sectionTitle.textContent = '예매율순';
        }
    }
    
    // 영화 목록 재정렬 및 표시
    applyFilters();
}

/**
 * 장르별로 영화를 필터링합니다.
 * @param {string} genreId - 장르 ID ('all'이면 전체)
 */
function filterByGenre(genreId) {
    currentGenreId = genreId;
    applyFilters();
}

/**
 * 현재 선택된 탭과 장르에 따라 영화를 필터링하고 정렬합니다.
 */
function applyFilters() {
    if (allMovies.length === 0) return;
    
    // 장르 필터 적용
    let filteredMovies = allMovies;
    if (currentGenreId !== 'all') {
        const genreIdNum = parseInt(currentGenreId);
        filteredMovies = allMovies.filter(movie => 
            movie.genre_ids && movie.genre_ids.includes(genreIdNum)
        );
    }
    
    // 탭에 따라 정렬
    let sortedMovies = filteredMovies;
    if (currentTab === 'popular') {
        sortedMovies = sortMoviesByPopularity(filteredMovies);
    } else if (currentTab === 'booking') {
        sortedMovies = sortMoviesByBooking(filteredMovies);
    }
    
    // 영화 목록 업데이트
    updateMoviesList(sortedMovies);
    
    // 필터링된 영화가 있으면 첫 번째 영화를 메인으로 표시
    if (sortedMovies.length > 0) {
        displayFeaturedMovie(sortedMovies[0]);
    }
}

/**
 * 로딩 상태를 표시합니다.
 */
function showLoading() {
    loadingElement.style.display = 'flex';
    errorElement.style.display = 'none';
    if (mainContentWrapperElement) {
        mainContentWrapperElement.style.display = 'none';
    }
}

/**
 * 에러 메시지를 표시합니다.
 * @param {string} message - 에러 메시지
 */
function showError(message) {
    loadingElement.style.display = 'none';
    errorElement.style.display = 'block';
    errorElement.querySelector('p').textContent = message;
    if (mainContentWrapperElement) {
        mainContentWrapperElement.style.display = 'none';
    }
}

/**
 * 영화 상세 정보를 가져옵니다.
 * @param {number} movieId - 영화 ID
 * @returns {Promise<Object>} 영화 상세 정보
 */
async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(`${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=ko-KR`);
        
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('영화 상세 정보 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 영화 비디오(트레일러)를 가져옵니다.
 * @param {number} movieId - 영화 ID
 * @returns {Promise<string|null>} YouTube 비디오 키 또는 null
 */
async function fetchMovieVideos(movieId) {
    try {
        const response = await fetch(`${API_BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=ko-KR`);
        
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        
        const data = await response.json();
        const videos = data.results || [];
        
        // 트레일러 또는 티저 비디오 찾기
        const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
        const teaser = videos.find(video => video.type === 'Teaser' && video.site === 'YouTube');
        
        return (trailer || teaser || videos[0])?.key || null;
    } catch (error) {
        console.error('영화 비디오 가져오기 실패:', error);
        return null;
    }
}

/**
 * 메인 영화를 표시합니다.
 * @param {Object} movie - 영화 데이터 객체
 */
async function displayFeaturedMovie(movie) {
    currentFeaturedMovie = movie;
    
    // 기본 정보 표시
    featuredMovieTitleElement.textContent = movie.title || '제목 없음';
    featuredRatingElement.textContent = `⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : '0.0'}`;
    
    // 상세 정보와 비디오 가져오기
    try {
        const [movieDetails, videoKey] = await Promise.all([
            fetchMovieDetails(movie.id),
            fetchMovieVideos(movie.id)
        ]);
        
        currentVideoKey = videoKey;
        
        // 개봉일 표시
        const releaseDate = formatReleaseDate(movieDetails.release_date);
        heroYearElement.textContent = releaseDate || '';
        
        // 상세 설명 표시
        featuredMovieOverviewElement.textContent = movieDetails.overview || '설명이 없습니다.';
        
        // 배경 이미지 설정
        if (movieDetails.backdrop_path) {
            heroBackdropElement.style.backgroundImage = `url(${BACKDROP_BASE_URL}${movieDetails.backdrop_path})`;
        } else if (movieDetails.poster_path) {
            heroBackdropElement.style.backgroundImage = `url(${IMAGE_BASE_URL}${movieDetails.poster_path})`;
        }
        
        // 비디오가 있으면 자동 재생, 없으면 플레이스홀더
        if (videoKey) {
            // 비디오 자동 재생
            const iframe = document.createElement('iframe');
            iframe.src = `${YOUTUBE_EMBED_URL}${videoKey}?autoplay=1&mute=0&loop=1&playlist=${videoKey}&controls=1&fs=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            
            heroVideoContainerElement.innerHTML = '';
            heroVideoContainerElement.appendChild(iframe);
        } else {
            heroVideoContainerElement.innerHTML = `
                <div class="video-placeholder">
                    <div class="play-icon">🎬</div>
                    <p>트레일러가 없습니다</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('메인 영화 정보 로드 실패:', error);
        featuredMovieOverviewElement.textContent = movie.overview || '설명을 불러올 수 없습니다.';
        const releaseDate = formatReleaseDate(movie.release_date);
        heroYearElement.textContent = releaseDate || '';
        
        // 배경 이미지 설정
        if (movie.backdrop_path) {
            heroBackdropElement.style.backgroundImage = `url(${BACKDROP_BASE_URL}${movie.backdrop_path})`;
        } else if (movie.poster_path) {
            heroBackdropElement.style.backgroundImage = `url(${IMAGE_BASE_URL}${movie.poster_path})`;
        }
        
        // 비디오 없음 표시
        heroVideoContainerElement.innerHTML = `
            <div class="video-placeholder">
                <div class="play-icon">🎬</div>
                <p>트레일러가 없습니다</p>
            </div>
        `;
    }
    
    // 메인 영화 섹션은 mainContentWrapper가 표시되면 자동으로 표시됨
}

/**
 * 영화 카드 클릭 시 메인 영화를 변경합니다.
 * @param {number} movieId - 영화 ID
 */
async function handleMovieClick(movieId) {
    // 같은 영화를 클릭한 경우 무시
    if (currentFeaturedMovie && currentFeaturedMovie.id === movieId) {
        scrollToFeatured();
        return;
    }
    
    // 클릭한 영화 찾기 (allMovies에서 찾기)
    const selectedMovie = allMovies.find(movie => movie.id === movieId);
    
    if (selectedMovie) {
        // 메인 영화 업데이트
        await displayFeaturedMovie(selectedMovie);
        
        // 스크롤을 메인 영화 섹션으로 이동
        scrollToFeatured();
    }
}

/**
 * 히어로 섹션의 비디오 재생
 */
function playHeroVideo() {
    if (currentVideoKey) {
        const iframe = document.createElement('iframe');
        iframe.src = `${YOUTUBE_EMBED_URL}${currentVideoKey}?autoplay=1&controls=1&fs=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        
        heroVideoContainerElement.innerHTML = '';
        heroVideoContainerElement.appendChild(iframe);
    }
}

/**
 * 트레일러 재생 (모달)
 */
function playTrailer() {
    if (currentVideoKey) {
        const iframe = document.createElement('iframe');
        iframe.src = `${YOUTUBE_EMBED_URL}${currentVideoKey}?autoplay=1&controls=1&fs=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.setAttribute('allowfullscreen', 'true');
        
        videoContainerElement.innerHTML = '';
        videoContainerElement.appendChild(iframe);
        videoModalElement.style.display = 'flex';
    } else {
        alert('트레일러가 없습니다.');
    }
}

/**
 * 트레일러 모달 닫기
 */
function closeTrailer() {
    videoModalElement.style.display = 'none';
    videoContainerElement.innerHTML = '';
    videoContainerElement.appendChild(videoPlaceholderElement);
}

/**
 * 메인 영화 섹션으로 스크롤
 */
function scrollToFeatured() {
    featuredMovieElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 예매하기 모달을 표시합니다.
 */
function showBookingModal() {
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
        bookingModal.style.display = 'flex';
    }
}

/**
 * 예매하기 모달을 닫습니다.
 */
function closeBookingModal() {
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
        bookingModal.style.display = 'none';
    }
}

/**
 * 선택한 극장 사이트로 이동합니다.
 * @param {string} theater - 극장 이름 ('cgv', 'lotte', 또는 'megabox')
 */
function openBookingSite(theater) {
    let bookingUrl = '';
    
    if (theater === 'cgv') {
        bookingUrl = 'https://cgv.co.kr/';
    } else if (theater === 'lotte') {
        bookingUrl = 'https://www.lottecinema.co.kr/NLCHS';
    } else if (theater === 'megabox') {
        bookingUrl = 'https://www.megabox.co.kr/';
    }
    
    if (bookingUrl) {
        window.open(bookingUrl, '_blank');
        closeBookingModal();
    }
}

// 모달 외부 클릭 시 닫기
videoModalElement.addEventListener('click', (e) => {
    if (e.target === videoModalElement) {
        closeTrailer();
    }
});

// 예매하기 모달 외부 클릭 시 닫기
if (bookingModalElement) {
    bookingModalElement.addEventListener('click', (e) => {
        if (e.target === bookingModalElement) {
            closeBookingModal();
        }
    });
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (videoModalElement.style.display === 'flex') {
            closeTrailer();
        }
        if (bookingModalElement && bookingModalElement.style.display === 'flex') {
            closeBookingModal();
        }
    }
});

// 헤더 스크롤 효과
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        headerElement.classList.add('scrolled');
    } else {
        headerElement.classList.remove('scrolled');
    }
});

/**
 * 장르 필터 UI를 초기화합니다.
 */
async function initializeGenreFilter() {
    try {
        allGenres = await fetchGenres();
        const genreSelect = document.getElementById('genreSelect');
        
        // 제외할 장르 목록
        const excludedGenres = ['역사', '음악', '전쟁', '서부', 'TV 영화'];
        
        if (genreSelect && allGenres.length > 0) {
            // 기존 옵션 제거 (전체 장르 제외)
            const allOption = genreSelect.querySelector('option[value="all"]');
            genreSelect.innerHTML = '';
            if (allOption) {
                genreSelect.appendChild(allOption);
            }
            
            // 장르 옵션 추가 (제외 목록에 없는 장르만)
            allGenres.forEach(genre => {
                if (!excludedGenres.includes(genre.name)) {
                    const option = document.createElement('option');
                    option.value = genre.id;
                    option.textContent = genre.name;
                    genreSelect.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error('장르 필터 초기화 실패:', error);
    }
}

/**
 * 초기화 함수 - 영화 데이터를 로드하고 화면에 표시합니다.
 */
async function initialize() {
    showLoading();
    
    try {
        // 장르 목록과 영화 데이터를 동시에 가져오기
        const [movies] = await Promise.all([
            fetchNowPlayingMovies(),
            initializeGenreFilter()
        ]);
        
        renderMovies(movies);
        loadingElement.style.display = 'none';
    } catch (error) {
        showError('영화 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize);

/**
 * 마우스 호버 시 자동 스크롤 기능
 */
function setupAutoScroll() {
    const moviesSection = document.getElementById('moviesSection');
    if (!moviesSection) return;
    
    let scrollInterval = null;
    const baseScrollSpeed = 3; // 기본 스크롤 속도 (더 느리게)
    const topScrollZone = 200; // 상단 자동 스크롤 영역 (더 넓게)
    const bottomScrollZone = 100; // 하단 자동 스크롤 영역
    
    moviesSection.addEventListener('mousemove', (e) => {
        // 기존 스크롤 중지
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
        
        const rect = moviesSection.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const sectionHeight = rect.height;
        
        // 상단 영역에 마우스가 있으면 위로 스크롤 (영역 확대, 속도 하단과 동일)
        if (mouseY < topScrollZone && mouseY >= 0) {
            const distanceFromTop = mouseY;
            const normalizedDistance = Math.max(0, Math.min(1, distanceFromTop / topScrollZone)); // 0~1 사이 값
            const speedMultiplier = 1 - normalizedDistance; // 상단에 가까울수록 1에 가까움 (0에 가까울수록 빠름)
            const currentSpeed = Math.max(0.5, baseScrollSpeed * (1 + speedMultiplier * 0.5)); // 최소 0.5, 최대 약 4.5 속도 (더 느리게)
            
            scrollInterval = setInterval(() => {
                const currentScroll = moviesSection.scrollTop;
                if (currentScroll > 0) {
                    const newScroll = Math.max(0, currentScroll - currentSpeed);
                    moviesSection.scrollTop = newScroll;
                    
                    if (newScroll <= 0) {
                        clearInterval(scrollInterval);
                        scrollInterval = null;
                    }
                } else {
                    clearInterval(scrollInterval);
                    scrollInterval = null;
                }
            }, 16); // 약 60fps (하단과 동일)
        }
        // 하단 영역에 마우스가 있으면 아래로 스크롤
        else if (mouseY > sectionHeight - bottomScrollZone) {
            const distanceFromBottom = sectionHeight - mouseY;
            const normalizedDistance = Math.max(0, Math.min(1, distanceFromBottom / bottomScrollZone)); // 0~1 사이 값
            const speedMultiplier = 1 - normalizedDistance; // 하단에 가까울수록 1에 가까움
            const currentSpeed = Math.max(1, baseScrollSpeed * (1 + speedMultiplier * 0.8)); // 최소 1, 최대 약 9 속도
            
            scrollInterval = setInterval(() => {
                const maxScroll = moviesSection.scrollHeight - moviesSection.clientHeight;
                const currentScroll = moviesSection.scrollTop;
                if (currentScroll < maxScroll) {
                    const newScroll = Math.min(maxScroll, currentScroll + currentSpeed);
                    moviesSection.scrollTop = newScroll;
                    
                    if (newScroll >= maxScroll) {
                        clearInterval(scrollInterval);
                        scrollInterval = null;
                    }
                } else {
                    clearInterval(scrollInterval);
                    scrollInterval = null;
                }
            }, 16); // 약 60fps
        }
    });
    
    moviesSection.addEventListener('mouseleave', () => {
        // 마우스가 영역을 벗어나면 스크롤 중지
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    });
}

// 자동 스크롤 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 약간의 지연 후 초기화 (DOM이 완전히 로드된 후)
    setTimeout(setupAutoScroll, 500);
});


// Scroll progress bar
let _scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!_scrollTicking) {
        requestAnimationFrame(() => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            document.getElementById('scroll-progress').style.width = scrolled + '%';
            _scrollTicking = false;
        });
        _scrollTicking = true;
    }
});

// Mobile Menu & ARIA
// Locale-specific labels are read from data-label-close on the button element
const menuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
function toggleMenu(forceClose = false) {
    const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    const willExpand = forceClose ? false : !isExpanded;
    mobileMenu.classList.toggle('open', willExpand);
    menuBtn.setAttribute('aria-expanded', String(willExpand));
    const labelOpen = menuBtn.dataset.labelOpen;
    const labelClose = menuBtn.dataset.labelClose;
    menuBtn.setAttribute('aria-label', willExpand ? labelClose : labelOpen);
}
menuBtn.addEventListener('click', () => toggleMenu());
document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => toggleMenu(true)));

// FAQ Accordion
document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        const icon = trigger.querySelector('.faq-icon');
        trigger.setAttribute('aria-expanded', String(!expanded));
        panel.setAttribute('aria-hidden', String(expanded));
        panel.classList.toggle('hidden');
        icon?.classList.toggle('open', !expanded);
    });
});

// Intersection Observer (reveal animations)
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Gallery Slider
const sliderTrack = document.getElementById('slider-track');
let currentSlide = 0;
function updateSlider() {
    sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}
function nextSlide() { currentSlide = (currentSlide === 2) ? 0 : currentSlide + 1; updateSlider(); }
function prevSlide() { currentSlide = (currentSlide === 0) ? 2 : currentSlide - 1; updateSlider(); }
function goToSlide(i) { currentSlide = i; updateSlider(); }

// Subscription Tabs (SumUp pricing)
(function () {
    var P = {
        argent: {
            m1: ['80',     '89 CHF',  '−10%', 'https://pay.sumup.com/b2c/QS43FNTF'],
            m2: ['142.40', '178 CHF', '−20%', 'https://pay.sumup.com/b2c/Q26M5L13'],
            a1: ['75.60',  '89 CHF',  '−15%', 'https://pay.sumup.com/b2c/QEDK3H0B'],
            a2: ['133',    '178 CHF', '−25%', 'https://pay.sumup.com/b2c/QWO3BLJI']
        },
        or: {
            m1: ['134.10', '149 CHF', '−10%', 'https://pay.sumup.com/b2c/QL8XVAA5'],
            m2: ['238.40', '298 CHF', '−20%', 'https://pay.sumup.com/b2c/QLTZKJ1I'],
            a1: ['126.65', '149 CHF', '−15%', 'https://pay.sumup.com/b2c/QII2I63J'],
            a2: ['223',    '298 CHF', '−25%', 'https://pay.sumup.com/b2c/QI5YE2M7']
        },
        diamant: {
            m1: ['251', '289 CHF', '−13%', 'https://pay.sumup.com/b2c/Q7T56VYC'],
            m2: ['445', '578 CHF', '−23%', 'https://pay.sumup.com/b2c/QSYCNRJ6'],
            a1: ['239', '289 CHF', '−17%', 'https://pay.sumup.com/b2c/QOW0LRXL'],
            a2: ['421', '578 CHF', '−27%', 'https://pay.sumup.com/b2c/QC3KLGQ2']
        }
    };
    var eng = 'm', freq = 1;
    var ON  = 'px-5 py-3.5 rounded-full text-xs font-display font-bold uppercase tracking-widest transition-all bg-gold-400 text-charcoal-900';
    var OFF = 'px-5 py-3.5 rounded-full text-xs font-display uppercase tracking-widest transition-all text-gray-400';
    function render() {
        var k = eng + freq;
        ['argent', 'or', 'diamant'].forEach(function (p) {
            var d = P[p][k];
            document.getElementById('price-'    + p).textContent = d[0];
            document.getElementById('base-'     + p).textContent = d[1];
            document.getElementById('discount-' + p).textContent = d[2];
            document.getElementById('link-'     + p).href        = d[3];
        });
        document.getElementById('btn-mensuel').className = eng === 'm' ? ON : OFF;
        document.getElementById('btn-annuel').className  = eng === 'a' ? ON : OFF;
        document.getElementById('btn-freq1').className   = freq === 1  ? ON : OFF;
        document.getElementById('btn-freq2').className   = freq === 2  ? ON : OFF;
    }
    window.setAboEng  = function (e) { eng  = e === 'mensuel' ? 'm' : 'a'; render(); };
    window.setAboFreq = function (f) { freq = +f; render(); };
    render();
})();

// Date picker — set min to today
(function () {
    const d = document.getElementById('date_rdv');
    if (d) {
        const t = new Date();
        d.min = t.getFullYear() + '-' +
            String(t.getMonth() + 1).padStart(2, '0') + '-' +
            String(t.getDate()).padStart(2, '0');
    }
})();

// Contact Modal
function ccwModalOpen() {
    var m = document.getElementById('ccw-contact-modal');
    m.classList.remove('hidden');
    m.classList.add('flex');
    document.body.style.overflow = 'hidden';
}
function ccwModalClose() {
    var m = document.getElementById('ccw-contact-modal');
    m.classList.add('hidden');
    m.classList.remove('flex');
    document.body.style.overflow = '';
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ccwModalClose(); });

// Carousel dots — Subscriptions & Reviews
(function () {
    function initCarouselDots(trackId, dotsId) {
        var track = document.getElementById(trackId);
        var dotsContainer = document.getElementById(dotsId);
        if (!track || !dotsContainer) return;
        var dots = Array.from(dotsContainer.querySelectorAll('.ccw-dot'));
        var cards = Array.from(track.children);
        if (!dots.length || !cards.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var idx = cards.indexOf(entry.target);
                    if (idx !== -1) dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
                }
            });
        }, { root: track, threshold: 0.55 });

        cards.forEach(function (card) { observer.observe(card); });

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                if (cards[i]) cards[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            });
        });
    }

    initCarouselDots('abo-track', 'abo-dots');
    initCarouselDots('avis-track', 'avis-dots');
})();

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    });
}

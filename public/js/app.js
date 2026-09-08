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
function slideCount() { return sliderTrack ? sliderTrack.children.length : 0; }
function nextSlide() { const n = slideCount(); currentSlide = (currentSlide >= n - 1) ? 0 : currentSlide + 1; updateSlider(); }
function prevSlide() { const n = slideCount(); currentSlide = (currentSlide <= 0) ? n - 1 : currentSlide - 1; updateSlider(); }
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

// ==========================================================================
// Promotions datées — garde-fou anti-promo périmée
// --------------------------------------------------------------------------
// Tout élément portant data-promo-until="AAAA-MM-JJ" disparaît au lendemain
// de cette date. Le contenu est présent et visible dans le HTML servi : si le
// JS ne s'exécute pas pendant la promo, elle s'affiche normalement. Le script
// ne fait que RETIRER une offre expirée, jamais afficher une offre absente.
// ==========================================================================
(function () {
    var elements = document.querySelectorAll('[data-promo-until]');
    if (!elements.length) return;
    var maintenant = new Date();
    Array.prototype.forEach.call(elements, function (el) {
        var fin = new Date(el.getAttribute('data-promo-until') + 'T23:59:59');
        if (isNaN(fin.getTime())) return;
        if (maintenant > fin) el.remove();
    });
})();

// ==========================================================================
// Réservation SumUp Bookings — lien direct par prestation
// --------------------------------------------------------------------------
// Chaque offre existe en deux variantes dans SumUp (domicile / garage).
// Au clic on crée un panier via l'API publique Bookings, puis on redirige
// vers le checkout de CE panier : le client choisit son créneau AVANT de
// payer, et ses coordonnées sont collectées à l'étape 2.
//
// Si l'appel échoue (API modifiée, réseau, CSP), on retombe sur la page de
// réservation générique — jamais de bouton mort, jamais de paiement sans
// créneau.
// ==========================================================================
var CCW_BOOKINGS_SHOP = 'clean-car-wash-geneva';
var CCW_BOOKINGS_URL = 'https://www.sumupbookings.com/' + CCW_BOOKINGS_SHOP + '#services';
var CCW_BOOKINGS_API = 'https://api.sumup.com/public/bookings/' + CCW_BOOKINGS_SHOP;
var CCW_BOOKINGS_CHECKOUT = 'https://www.sumupbookings.com/' + CCW_BOOKINGS_SHOP + '/checkout';

// Identifiants relevés dans l'API SumUp le 25/08/2026.
// Si une prestation est recréée dans SumUp, son serviceId change : il faut
// alors mettre à jour la ligne correspondante ici.
var CCW_OFFERS = {
    argent: {
        home:   { label: '[1] Pack Argent - Au Domicile/Travail (Acompte 30%)', service: '054f5bac-7131-438c-866f-ed4126781f66', variant: '6486c6b0-adea-4e75-8917-d5e1173eddce' },
        garage: { label: '[1] Pack Argent - Au Garage (Acompte 30%)',           service: 'ea902077-46dd-4abe-b3c5-958010e9ab84', variant: 'db6f5f91-3c1e-4917-aff1-8b3be324efd5' }
    },
    or: {
        home:   { label: '[2] Pack Or - Au Domicile/Travail (Acompte 30%)',     service: '43834e2e-33f3-4640-b149-81c178ade6c9', variant: '55938d59-b0a2-45d8-bef2-bb8be1c752ff' },
        garage: { label: '[2] Pack Or - Au Garage (Acompte 30%)',               service: '7c78ee37-4dab-4bd7-aef8-6d20fc3b6b77', variant: '5b55126e-a9c3-4f25-ac39-d15de8d1370c' }
    },
    diamant: {
        home:   { label: '[3] Pack Diamant - Au Domicile/Travail (Acompte 30%)', service: '7270085a-93a3-481b-b860-3415e910c632', variant: '1bd8cdbf-2d55-425f-95e0-b5aaa803c56a' },
        garage: { label: '[3] Pack Diamant - Au Garage (Acompte 30%)',           service: 'a60b8bcb-4a74-4869-9f47-e7427db2507a', variant: '4921ee33-9267-40e9-8cbe-f5f7d7c05411' }
    },
    excellence: {
        home:   { label: 'Combo Excellence - Au Domicile/Travail (Acompte 30%) - 1er rdv', service: '63e72870-0cc7-4110-9573-f55f999a4530', variant: '3338d0c4-60a1-4bfd-b059-814b3629ba79' },
        garage: { label: 'Combo Excellence - Au Garage (Acompte 30%) - 1er rdv',           service: '5c61248f-5fdc-4e12-8651-db94704cd654', variant: '17fdc0d6-e253-4f85-af78-d514f6ba6675' }
    },
    prestige: {
        home:   { label: 'Combo Prestige - Au Domicile/Travail (Acompte 30%) - 1er rdv',   service: '826ed5ef-5e77-4bab-9a0c-0bd3c30a8696', variant: '46cfba06-23c3-40b3-bc0f-e5373a4d2c4d' },
        garage: { label: 'Combo Prestige - Au Garage (Acompte 30%) - 1er rdv',             service: 'd455c5ec-b8d3-4d00-aa5d-d9076c9fbb95', variant: '84cafaab-4aa1-4816-83ba-f437cb92d57a' }
    }
};

var ccwCurrentOffer = null;
var ccwBookingBusy = false;

function ccwFormatDate(d) {
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + mm + '-' + dd;
}

// Relâche le verrou anti-double-clic et remet les boutons dans leur état normal.
// Indispensable au retour arrière : le navigateur restaure la page depuis son
// cache avec l'état JS intact, donc sans ce reset le verrou resterait enclenché
// et plus aucun clic ne fonctionnerait.
function ccwBookingReset() {
    ccwBookingBusy = false;
    ['home', 'garage'].forEach(function (place) {
        var btn = document.getElementById('ccw-location-' + place);
        if (btn) {
            btn.removeAttribute('aria-busy');
            btn.classList.remove('opacity-60');
        }
    });
}

// pageshow se déclenche aussi lors d'une restauration depuis le cache du
// navigateur (event.persisted), là où load ne se déclenche pas.
window.addEventListener('pageshow', ccwBookingReset);

function ccwLocationModalOpen(offerKey) {
    ccwBookingReset();
    ccwCurrentOffer = CCW_OFFERS[offerKey] || null;
    var homeTxt = document.getElementById('ccw-location-home-label');
    var garageTxt = document.getElementById('ccw-location-garage-label');
    if (homeTxt) homeTxt.textContent = ccwCurrentOffer ? ccwCurrentOffer.home.label : '';
    if (garageTxt) garageTxt.textContent = ccwCurrentOffer ? ccwCurrentOffer.garage.label : '';
    var m = document.getElementById('ccw-location-modal');
    m.classList.remove('hidden');
    m.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function ccwLocationModalClose() {
    var m = document.getElementById('ccw-location-modal');
    m.classList.add('hidden');
    m.classList.remove('flex');
    document.body.style.overflow = '';
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ccwLocationModalClose(); });

function ccwBookingGo(place) {
    if (ccwBookingBusy) return;
    var offer = ccwCurrentOffer && ccwCurrentOffer[place];
    if (!offer) { window.location.href = CCW_BOOKINGS_URL; return; }

    ccwBookingBusy = true;
    var btn = document.getElementById('ccw-location-' + place);
    if (btn) {
        btn.setAttribute('aria-busy', 'true');
        btn.classList.add('opacity-60');
    }

    var settled = false;
    var fallback = function () {
        if (settled) return;
        settled = true;
        window.location.href = CCW_BOOKINGS_URL;
    };
    // Filet de sécurité : si l'API ne répond pas en 8s, on n'immobilise pas le client.
    var timer = setTimeout(fallback, 8000);

    fetch(CCW_BOOKINGS_API + '/carts', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({ items: [{ serviceId: offer.service, variantId: offer.variant, position: 0 }] })
    }).then(function (r) {
        return r.ok ? r.json() : null;
    }).then(function (data) {
        clearTimeout(timer);
        var cartId = data && data.cart && data.cart.cartId;
        if (!cartId) { fallback(); return; }
        if (settled) return;
        settled = true;
        var today = new Date();
        var end = new Date(today.getTime() + 6 * 86400000);
        window.location.href = CCW_BOOKINGS_CHECKOUT +
            '?selectedDate=' + ccwFormatDate(today) +
            '&startDate=' + ccwFormatDate(today) +
            '&endDate=' + ccwFormatDate(end) +
            '&cartId=' + encodeURIComponent(cartId);
    }).catch(function () {
        clearTimeout(timer);
        fallback();
    });
}

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

// Scroll-snap carousels — dynamic pagination dots (mobile)
document.addEventListener('DOMContentLoaded', () => {
    const scrollContainers = document.querySelectorAll('.scroll-container');

    scrollContainers.forEach(container => {
        // Trouver le conteneur de points juste en dessous
        const dotsWrapper = container.nextElementSibling;
        if (!dotsWrapper || !dotsWrapper.classList.contains('scroll-dots')) return;

        // Cibler les éléments enfants qui snappent
        const items = container.querySelectorAll('.snap-center');
        if (items.length < 2) return; // Pas de pagination si moins de 2 éléments

        // 1. Générer les points dynamiquement
        items.forEach((_, index) => {
            const dot = document.createElement('div');
            // Le premier point est actif (gold), les autres inactifs (charcoal)
            dot.className = `w-2 h-2 rounded-full transition-colors duration-300 ${index === 0 ? 'bg-gold-400' : 'bg-charcoal-700'}`;
            dotsWrapper.appendChild(dot);
        });

        const dots = dotsWrapper.querySelectorAll('div');

        // 2. Observer le défilement pour synchroniser les points
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Array.from(items).indexOf(entry.target);
                    dots.forEach((dot, i) => {
                        dot.classList.toggle('bg-gold-400', i === index);
                        dot.classList.toggle('bg-charcoal-700', i !== index);
                    });
                }
            });
        }, {
            root: container,
            threshold: 0.6 // S'active quand 60% de la carte est visible
        });

        items.forEach(item => observer.observe(item));
    });
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    });
}

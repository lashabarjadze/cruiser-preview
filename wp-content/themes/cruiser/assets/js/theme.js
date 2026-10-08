/* Cruiser.ge: menu, dropdowns, year tabs, photo viewer, forms in the static preview,
   and on-demand loading of the mcruise search widget. */
(function () {
	'use strict';

	var body = document.body;

	/* Menu: slide-in panel on small screens, dropdowns open by tap. */
	var toggle = document.querySelector('.menu-toggle');
	var nav = document.getElementById('primary-nav');
	function setNav(open) {
		nav.classList.toggle('open', open);
		body.classList.toggle('nav-open', open);
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
	}
	if (toggle && nav) {
		toggle.addEventListener('click', function () {
			setNav(!nav.classList.contains('open'));
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && nav.classList.contains('open')) {
				setNav(false);
				toggle.focus();
			}
		});
		document.addEventListener('click', function (e) {
			if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
				setNav(false);
			}
		});
		nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
			a.addEventListener('click', function () { setNav(false); });
		});
		nav.querySelectorAll('.menu-item-has-children').forEach(function (li) {
			var b = document.createElement('button');
			b.type = 'button';
			b.className = 'sub-toggle';
			b.setAttribute('aria-expanded', 'false');
			b.setAttribute('aria-label', 'ქვემენიუ');
			b.innerHTML = '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
			b.addEventListener('click', function () {
				var open = li.classList.toggle('is-open');
				b.setAttribute('aria-expanded', open ? 'true' : 'false');
			});
			li.insertBefore(b, li.querySelector('.sub-menu'));
		});
	}

	/* Year tabs on destination pages: without JS every year shows in turn. */
	document.querySelectorAll('[data-tabs]').forEach(function (box) {
		var list = box.querySelector('[role="tablist"]');
		var tabs = box.querySelectorAll('[role="tab"]');
		var panels = box.querySelectorAll('[role="tabpanel"]');
		if (!list || tabs.length < 2) {
			return;
		}
		list.hidden = false;
		box.classList.add('is-ready');
		function show(tab) {
			tabs.forEach(function (t) {
				var on = t === tab;
				t.setAttribute('aria-selected', on ? 'true' : 'false');
				t.tabIndex = on ? 0 : -1;
			});
			panels.forEach(function (p) {
				p.hidden = p.id !== tab.getAttribute('aria-controls');
				var h = p.querySelector('.yeartabs-h');
				if (h) {
					h.hidden = true;
				}
			});
		}
		var first = box.querySelector('[role="tab"][aria-selected="true"]') || tabs[0];
		show(first);
		tabs.forEach(function (t, i) {
			t.addEventListener('click', function () { show(t); });
			t.addEventListener('keydown', function (e) {
				var next = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
				if (next) {
					next.focus();
					show(next);
				}
			});
		});
	});

	/* Photo viewer for ship galleries. */
	var links = document.querySelectorAll('[data-lightbox]');
	if (links.length && typeof HTMLDialogElement === 'function') {
		var dlg = document.createElement('dialog');
		dlg.className = 'lightbox';
		dlg.innerHTML = '<button type="button" aria-label="დახურვა"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><img alt=""><p></p>';
		body.appendChild(dlg);
		var img = dlg.querySelector('img');
		var cap = dlg.querySelector('p');
		dlg.querySelector('button').addEventListener('click', function () { dlg.close(); });
		dlg.addEventListener('click', function (e) {
			if (e.target === dlg) {
				dlg.close();
			}
		});
		links.forEach(function (a) {
			a.addEventListener('click', function (e) {
				e.preventDefault();
				var small = a.querySelector('img');
				img.src = a.href;
				img.alt = small ? small.alt : '';
				img.referrerPolicy = 'no-referrer';
				var fig = a.closest('figure');
				var credit = fig ? fig.querySelector('figcaption') : null;
				cap.innerHTML = credit ? credit.innerHTML : '';
				dlg.showModal();
			});
		});
	}

	/* Static preview (no server): forms open WhatsApp with what the visitor typed. */
	if (document.documentElement.hasAttribute('data-static')) {
		document.querySelectorAll('form.form').forEach(function (form) {
			form.addEventListener('submit', function (e) {
				e.preventDefault();
				var wa = form.getAttribute('data-wa');
				var get = function (n) {
					var el = form.querySelector('[name="' + n + '"]');
					return el ? el.value.trim() : '';
				};
				var lines = ['გამარჯობა! დამირეკეთ, გთხოვთ.'];
				[['სახელი', 'name'], ['ტელეფონი', 'phone'], ['პერიოდი', 'month'], ['შენიშვნა', 'note'], ['თემა', 'subject']].forEach(function (f) {
					var v = get(f[1]);
					if (v) {
						lines.push(f[0] + ': ' + v);
					}
				});
				if (wa) {
					window.open(wa + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
				}
			});
		});
	}

	/* mcruise search widget. */
	var box = document.querySelector('.mcruise');
	if (!box) {
		return;
	}
	var status = box.querySelector('.mcruise-status');
	var target = document.getElementById('search_mcruise_all');
	var started = false;

	function drawn() {
		return target && target.innerHTML.length > 10;
	}

	function loaded() {
		box.classList.add('is-loaded');
		if (status) {
			status.textContent = '';
		}
	}

	// The partner script draws itself on DOMContentLoaded. When it arrives later
	// (it is loaded on demand), ask it to draw now.
	function kick() {
		if (drawn()) {
			loaded();
			return;
		}
		if (typeof window.addheaderelement === 'function') {
			try {
				window.addheaderelement();
			} catch (err) {
				if (window.console) {
					console.warn('mcruise:', err);
				}
			}
		}
	}

	function watch() {
		if (!target) {
			return;
		}
		if (drawn()) {
			loaded();
			return;
		}
		if ('MutationObserver' in window) {
			var mo = new MutationObserver(function () {
				if (drawn()) {
					loaded();
					mo.disconnect();
				}
			});
			mo.observe(target, { childList: true, subtree: true });
		}
	}

	function load() {
		if (started) {
			return;
		}
		started = true;
		if (status) {
			status.textContent = 'საძიებო იტვირთება…';
		}
		watch();
		var s = document.createElement('script');
		s.src = box.getAttribute('data-src');
		s.async = true;
		s.onload = function () {
			// Called once only: each call makes the widget fetch its libraries again.
			kick();
			setTimeout(function () {
				if (!drawn() && status) {
					status.textContent = 'საძიებო ჯერ არ ჩაიტვირთა. სცადეთ გვერდის განახლება ან დაგვიკავშირდით.';
				}
			}, 9000);
		};
		s.onerror = function () {
			if (status) {
				status.textContent = 'საძიებო ვერ ჩაიტვირთა. სცადეთ თავიდან ან დაგვიკავშირდით.';
			}
			started = false;
		};
		document.body.appendChild(s);
	}

	var button = box.querySelector('.mcruise-load');
	if (button) {
		button.addEventListener('click', load);
	}
	box.addEventListener('focusin', load, { once: true });

	if (box.getAttribute('data-mcruise') === 'full') {
		load();
		return;
	}

	// Lazy mode: load on the visitor's first interaction with the page.
	var events = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
	var onFirst = function () {
		events.forEach(function (e) {
			window.removeEventListener(e, onFirst, { passive: true });
		});
		load();
	};
	events.forEach(function (e) {
		window.addEventListener(e, onFirst, { passive: true });
	});
})();

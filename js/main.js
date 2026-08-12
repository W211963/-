/* ============================================
   向前 FORWARD - 主交互脚本
   ============================================ */

(function () {
    'use strict';

    // ---------- DOM 就绪 ----------
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        initNavbarScroll();
        initRevealAnimations();
        initHeroTitleAnimation();
        initCountUpAnimation();
        initLoginModal();
        initVideoModal();
        initFilterTabs();
        initRankingTabs();
        initNavLinkActive();
        initMobileMenu();
        initSmoothForms();
    }

    // ---------- 导航栏滚动效果 ----------
    function initNavbarScroll() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        const onScroll = () => {
            if (window.scrollY > 60) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', throttle(onScroll, 16), { passive: true });
        onScroll();
    }

    // ---------- 滚动揭示动画 ----------
    function initRevealAnimations() {
        const reveals = document.querySelectorAll('.reveal');
        if (!reveals.length || !('IntersectionObserver' in window)) {
            reveals.forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        // 为同级元素添加轻微的 stagger 延迟
                        const parent = entry.target.parentElement;
                        const siblings = parent
                            ? Array.from(parent.querySelectorAll('.reveal'))
                            : [entry.target];
                        const delay = Math.min(siblings.indexOf(entry.target) * 80, 400);

                        setTimeout(() => {
                            entry.target.classList.add('visible');
                        }, delay);

                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: '0px 0px -60px 0px'
            }
        );

        reveals.forEach(el => observer.observe(el));
    }

    // ---------- Hero 标题逐行入场 ----------
    function initHeroTitleAnimation() {
        const titleLines = document.querySelectorAll('.title-line');
        if (!titleLines.length) return;

        // 确保初始 CSS transform 已应用后，逐行显示
        titleLines.forEach((line, i) => {
            setTimeout(() => {
                line.style.transition =
                    'opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)';
                line.style.opacity = '1';
                line.style.transform = 'translateY(0)';
            }, 300 + i * 180);
        });
    }

    // ---------- 数字滚动计数 ----------
    function initCountUpAnimation() {
        const nums = document.querySelectorAll('.stat-num[data-target]');
        if (!nums.length || !('IntersectionObserver' in window)) {
            nums.forEach(el => {
                el.textContent = el.getAttribute('data-target');
            });
            return;
        }

        const animate = (el) => {
            const target = parseInt(el.getAttribute('data-target'), 10);
            const duration = 1800;
            const startTime = performance.now();
            const startVal = 0;

            const step = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                // easeOutExpo
                const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const current = Math.floor(startVal + (target - startVal) * eased);

                // 显示 52K 这样的单位
                const rawText = el.textContent || '';
                const hasK = /K$/.test(rawText);
                el.textContent = current + (hasK ? 'K' : '');

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = target + (rawText.includes('K') ? 'K' : '');
                }
            };

            requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animate(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.4 }
        );

        nums.forEach(el => observer.observe(el));
    }

    // ---------- 登录模态框 ----------
    function initLoginModal() {
        const modal = document.getElementById('loginModal');
        if (!modal) return;

        // ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeLogin();
            }
        });

        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLogin();
            }
        });
    }

    function openLogin() {
        const modal = document.getElementById('loginModal');
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // 自动聚焦第一个输入框
        setTimeout(() => {
            const firstInput = modal.querySelector('.form-input');
            if (firstInput) firstInput.focus();
        }, 300);
    }

    function closeLogin() {
        const modal = document.getElementById('loginModal');
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 暴露到全局供内联 onclick 使用
    window.openLogin = openLogin;
    window.closeLogin = closeLogin;

    // ---------- 视频播放模态框 ----------
    function initVideoModal() {
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('videoPlayer');
        if (!modal || !player) return;

        // ESC 关闭视频
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeVideo();
            }
        });

        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVideo();
            }
        });

        // 视频播放失败时提示
        player.addEventListener('error', () => {
            showToast('视频加载失败，请检查网络后重试', 'error');
        });
    }

    // 通用打开视频播放器
    function openVideo(videoUrl, title, posterUrl) {
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('videoPlayer');
        const titleEl = document.getElementById('videoModalTitle');
        const metaEl = document.getElementById('videoModalMeta');
        if (!modal || !player) return;

        if (!videoUrl) {
            showToast('暂未找到视频资源', 'error');
            return;
        }

        // 更新标题
        if (titleEl && title) titleEl.textContent = title;
        if (metaEl) {
            metaEl.innerHTML =
                '<span>· 数码博主测评视频</span>' +
                '<span>· HD 高清画质</span>' +
                '<span>· 向前 FORWARD 原创内容</span>';
        }

        // 设置源
        player.src = videoUrl;
        if (posterUrl) player.poster = posterUrl;
        player.load();

        // 打开模态框
        modal.classList.add('active');
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // 尝试自动播放（有些浏览器需要静音才能自动播放）
        const tryAutoplay = () => {
            const p = player.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {
                    // 自动播放被阻止，尝试静音播放
                    player.muted = true;
                    const p2 = player.play();
                    if (p2 && typeof p2.catch === 'function') {
                        p2.catch(() => {
                            // 彻底失败则等待用户点击
                        });
                    }
                });
            }
        };

        // 等 DOM 更新后再启动播放
        setTimeout(tryAutoplay, 220);

        // 保存原 overflow，关闭时还原（避免影响登录弹窗）
        modal._prevOverflow = prevOverflow;
    }

    // 关闭视频播放器
    function closeVideo() {
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('videoPlayer');
        if (!modal || !player) return;

        try {
            player.pause();
        } catch (e) {}

        setTimeout(() => {
            try {
                // 释放视频资源
                player.removeAttribute('src');
                player.load();
            } catch (e) {}
        }, 320);

        modal.classList.remove('active');

        // 若登录弹窗也开着就不要恢复滚动，否则恢复
        const loginModal = document.getElementById('loginModal');
        const loginActive = loginModal && loginModal.classList.contains('active');
        if (!loginActive) {
            document.body.style.overflow = modal._prevOverflow || '';
        }
    }

    // 从作品卡片播放
    function playWorkVideo(btnEl) {
        const card = btnEl && btnEl.closest ? btnEl.closest('.work-card') : null;
        if (!card) {
            showToast('无法定位视频卡片', 'error');
            return;
        }
        const url = card.getAttribute('data-video');
        const title = card.getAttribute('data-title');
        const posterImg = card.querySelector('.work-img');
        const poster = posterImg ? posterImg.src : '';
        openVideo(url, title, poster);
    }

    // 从精选视频卡片播放
    function playFeaturedVideo(btnEl) {
        const wrap = btnEl && btnEl.closest ? btnEl.closest('.video-featured') : null;
        if (!wrap) {
            showToast('无法定位视频卡片', 'error');
            return;
        }
        const url = wrap.getAttribute('data-video');
        const title = wrap.getAttribute('data-title');
        const posterImg = wrap.querySelector('.featured-img');
        const poster = posterImg ? posterImg.src : '';
        openVideo(url, title, poster);
    }

    // 暴露到全局供内联 onclick 使用
    window.openVideo = openVideo;
    window.closeVideo = closeVideo;
    window.playWorkVideo = playWorkVideo;
    window.playFeaturedVideo = playFeaturedVideo;

    // ---------- 作品筛选 ----------
    function initFilterTabs() {
        const tabs = document.querySelectorAll('.filter-tab');
        const cards = document.querySelectorAll('.work-card');

        if (!tabs.length) return;

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const filter = tab.getAttribute('data-filter');

                // 更新按钮状态
                tabs.forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');

                // 动画筛选卡片
                cards.forEach((card, i) => {
                    const cat = card.getAttribute('data-category');
                    const match = filter === 'all' || cat === filter;

                    card.style.transition =
                        'opacity 0.35s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
                    card.style.transitionDelay = match ? i * 40 + 'ms' : '0ms';

                    if (match) {
                        card.style.display = '';
                        // 强制 reflow 让动画触发
                        card.getBoundingClientRect();
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1) translateY(0)';
                        card.style.pointerEvents = '';
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.92) translateY(12px)';
                        card.style.pointerEvents = 'none';
                        setTimeout(() => {
                            if (!card.style.opacity || card.style.opacity === '0') {
                                card.style.display = 'none';
                            }
                        }, 450);
                    }
                });
            });
        });
    }

    // ---------- 排行榜 Tab 切换 ----------
    function initRankingTabs() {
        const tabs = document.querySelectorAll('.ranking-tab');
        const panels = document.querySelectorAll('.ranking-panel');
        if (!tabs.length || !panels.length) return;

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-rank');

                tabs.forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');

                panels.forEach((panel) => {
                    panel.classList.remove('active');
                    if (panel.id === 'rank-' + target) {
                        panel.classList.add('active');
                        // 重新触发进度条动画
                        const bars = panel.querySelectorAll('.bar-fill');
                        bars.forEach((bar) => {
                            const w = bar.style.width;
                            bar.style.width = '0';
                            requestAnimationFrame(() => {
                                bar.style.width = w;
                            });
                        });
                    }
                });
            });
        });
    }

    // ---------- 导航链接高亮 ----------
    function initNavLinkActive() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        if (!sections.length || !navLinks.length) return;

        const sectionMap = new Map();
        sections.forEach((sec) => sectionMap.set(sec.id, sec));

        const onScroll = () => {
            const scrollY = window.scrollY + 140;
            let currentId = sections[0]?.id;

            sections.forEach((sec) => {
                if (sec.offsetTop <= scrollY) {
                    currentId = sec.id;
                }
            });

            navLinks.forEach((link) => {
                const href = link.getAttribute('href') || '';
                const id = href.replace('#', '');
                if (id === currentId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };

        window.addEventListener('scroll', throttle(onScroll, 50), { passive: true });
        onScroll();
    }

    // ---------- 移动端菜单 ----------
    function initMobileMenu() {
        const toggle = document.getElementById('navToggle');
        const links = document.querySelector('.nav-links');
        if (!toggle || !links) return;

        let open = false;

        toggle.addEventListener('click', () => {
            open = !open;
            if (open) {
                links.style.display = 'flex';
                links.style.position = 'absolute';
                links.style.top = '100%';
                links.style.left = '0';
                links.style.right = '0';
                links.style.flexDirection = 'column';
                links.style.padding = '20px';
                links.style.gap = '4px';
                links.style.background = 'rgba(7, 7, 10, 0.98)';
                links.style.backdropFilter = 'blur(20px)';
                links.style.borderBottom = '1px solid rgba(212, 168, 83, 0.15)';

                // 汉堡 -> X
                toggle.children[0].style.transform = 'translateY(7px) rotate(45deg)';
                toggle.children[1].style.opacity = '0';
                toggle.children[2].style.transform = 'translateY(-7px) rotate(-45deg)';

                document.body.style.overflow = 'hidden';
            } else {
                links.style.display = '';
                links.style.position = '';
                links.style.top = '';
                links.style.left = '';
                links.style.right = '';
                links.style.flexDirection = '';
                links.style.padding = '';
                links.style.gap = '';
                links.style.background = '';
                links.style.backdropFilter = '';
                links.style.borderBottom = '';

                toggle.children[0].style.transform = '';
                toggle.children[1].style.opacity = '';
                toggle.children[2].style.transform = '';

                document.body.style.overflow = '';
            }
        });

        // 点击链接后关闭
        links.querySelectorAll('.nav-link').forEach((a) => {
            a.addEventListener('click', () => {
                if (open) {
                    toggle.click();
                }
            });
        });
    }

    // ---------- 表单处理 ----------
    function initSmoothForms() {
        // 登录表单
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleLoginSubmit(loginForm);
            });
        }

        // 订阅表单
        const subForm = document.querySelector('.subscribe-form');
        if (subForm) {
            subForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleSubscribeSubmit(subForm);
            });
        }
    }

    // 全局登录提交处理（供内联 onsubmit 也可用）
    function handleLogin(e) {
        if (e) e.preventDefault();
        const form = e?.target || document.querySelector('.login-form');
        handleLoginSubmit(form);
    }
    window.handleLogin = handleLogin;

    function handleLoginSubmit(form) {
        if (!form) return;
        const btn = form.querySelector('.btn-login');
        if (!btn) return;

        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `
            <span>登录中...</span>
            <svg class="loading-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                <path d="M22 12a10 10 0 0 0-10-10"/>
            </svg>
        `;
        addSpinnerStyle();

        // 模拟请求：实际项目中替换为真实 API
        setTimeout(() => {
            btn.innerHTML = `
                <span>登录成功 ✓</span>
            `;
            btn.style.background = 'linear-gradient(135deg, #48CFAD 0%, #37BC9B 100%)';

            setTimeout(() => {
                closeLogin();
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.disabled = false;
                form.reset();

                showToast('欢迎回来！已成功登录「向前」', 'success');
            }, 900);
        }, 1400);
    }

    // 全局订阅处理
    function handleSubscribe(e) {
        if (e) e.preventDefault();
        const form = e?.target || document.querySelector('.subscribe-form');
        handleSubscribeSubmit(form);
    }
    window.handleSubscribe = handleSubscribe;

    function handleSubscribeSubmit(form) {
        if (!form) return;
        const input = form.querySelector('.subscribe-input');
        const btn = form.querySelector('.btn');
        if (!input || !btn) return;

        const email = input.value.trim();
        if (!email) return;

        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span>订阅中...</span>`;

        setTimeout(() => {
            btn.innerHTML = `<span>订阅成功 ✓</span>`;
            btn.style.background = 'linear-gradient(135deg, #48CFAD 0%, #37BC9B 100%)';

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.disabled = false;
                input.value = '';

                showToast('订阅成功！将第一时间收到「向前」的最新内容', 'success');
            }, 1500);
        }, 1200);
    }

    // ---------- Toast 提示 ----------
    function showToast(message, type = 'info') {
        // 移除已有 toast
        const old = document.querySelector('.app-toast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.className = 'app-toast';

        const colors = {
            success: 'linear-gradient(135deg, #48CFAD 0%, #37BC9B 100%)',
            error: 'linear-gradient(135deg, #E63946 0%, #C9184A 100%)',
            info: 'linear-gradient(135deg, #D4A853 0%, #B8860B 100%)'
        };

        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%) translateY(40px)',
            padding: '14px 26px',
            background: colors[type] || colors.info,
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(212, 168, 83, 0.2)',
            zIndex: '99999',
            opacity: '0',
            transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
            maxWidth: '90vw',
            whiteSpace: 'nowrap'
        });

        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(40px)';
            setTimeout(() => toast.remove(), 500);
        }, 3600);
    }

    // ---------- 工具函数 ----------
    function throttle(fn, wait) {
        let last = 0;
        let timer = null;
        return function (...args) {
            const now = Date.now();
            const remaining = wait - (now - last);
            if (remaining <= 0) {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                last = now;
                fn.apply(this, args);
            } else if (!timer) {
                timer = setTimeout(() => {
                    last = Date.now();
                    timer = null;
                    fn.apply(this, args);
                }, remaining);
            }
        };
    }

    // 动态添加 loading spinner 动画样式（只添加一次）
    let spinnerStyleAdded = false;
    function addSpinnerStyle() {
        if (spinnerStyleAdded) return;
        spinnerStyleAdded = true;
        const style = document.createElement('style');
        style.textContent = `
            .loading-spin { animation: toastSpin 0.8s linear infinite; }
            @keyframes toastSpin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }
})();

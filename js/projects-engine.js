/**
 * BARCLAYNES — Projects Engine
 * Handles dynamic rendering of projects from JSON.
 */

const ProjectsEngine = {
    data: [],
    
    // Fetch data with cache busting
    async init() {
        try {
            const v = new Date().getTime(); // Simple cache buster
            const res = await fetch(`data/projects.json?v=${v}`);
            const json = await res.json();
            // Filter out drafts and sort by priority
            this.data = json.projects
                .filter(p => !p.draft)
                .sort((a, b) => (b.priority || 0) - (a.priority || 0));
            return this.data;
        } catch (err) {
            console.error("Failed to load projects:", err);
            return [];
        }
    },

    // ─── PORTFOLIO RENDERING (Main Page) ───
    renderPortfolio(mainGridId, bottomRowId) {
        const mainGrid = document.getElementById(mainGridId);
        const bottomRow = document.getElementById(bottomRowId);
        if (!mainGrid || !bottomRow) return;

        // Clear containers
        mainGrid.innerHTML = '';
        bottomRow.innerHTML = '';

        // Separate by type
        const featured = this.data.find(p => p.type === 'featured');
        const smalls = this.data.filter(p => p.type === 'small');
        const xss = this.data.filter(p => p.type === 'xs');

        // 1. Featured Card
        if (featured) {
            mainGrid.innerHTML += this.createCardHTML(featured, 'card-feat');
        }

        // 2. Small Cards Column
        const smColumn = document.createElement('div');
        smColumn.style.display = 'flex';
        smColumn.style.flexDirection = 'column';
        smColumn.style.gap = '.7rem';
        smalls.forEach(p => {
            smColumn.innerHTML += this.createCardHTML(p, 'card-sm');
        });
        mainGrid.appendChild(smColumn);

        // 3. XS Cards Row
        xss.forEach(p => {
            bottomRow.innerHTML += this.createCardHTML(p, 'card-xs');
        });

        // 4. Add "More Soon" placeholder if needed
        bottomRow.innerHTML += `
            <div class="card card-xs card-empty">
                <div class="card-empty-plus">+</div>
                <div class="card-empty-txt">More Soon</div>
            </div>
        `;

        this.initOverlays();
    },

    createCardHTML(p, cardClass) {
        const badge = p.status ? `
            <div class="card-badge ${p.status}">
                <div class="badge-dot"></div>${p.statusTxt}
            </div>` : '';

        return `
            <div class="card ${cardClass}" data-id="${p.id}">
                <img class="card-img" src="${p.image}" alt="${p.title}" />
                <div class="card-overlay"></div>
                <div class="card-arrow">
                    <svg viewBox="0 0 11 11" fill="none">
                        <path d="M1.5 9.5L9.5 1.5M9.5 1.5H3.5M9.5 1.5V7.5" stroke="currentColor" stroke-width="1.2" />
                    </svg>
                </div>
                <div class="card-body">
                    ${badge}
                    <p class="card-cat">${p.stackLine || p.tags.slice(0, 3).join(' · ')}</p>
                    <h3 class="card-title">${p.title.replace('<br>', ' ')}</h3>
                </div>
            </div>
        `;
    },

    // ─── ALL PROJECTS RENDERING ───
    renderAllProjects(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Group by category
        const groups = this.data.reduce((acc, p) => {
            if (!acc[p.category]) acc[p.category] = [];
            acc[p.category].push(p);
            return acc;
        }, {});

        let html = '';
        const categoryMeta = {
            "Enterprise & Management Systems": "Heavy hitters that manage complex data and real-world business workflows.",
            "Web & Full-Stack Development": "Projects that blend a polished frontend with a functional backend.",
            "Database & Architecture": "SQL-focused work that shows structure, relationships, and secure data design.",
            "UI/UX & Creative Lab": "Frontend-heavy work where the look, feel, and interaction design matter."
        };

        Object.keys(categoryMeta).forEach(cat => {
            const projects = groups[cat] || [];
            html += `
                <section class="cat" id="${cat.toLowerCase().replace(/[^a-z]/g, '')}">
                    <div class="cat-head">
                        <h2 class="cat-title">${cat}</h2>
                        <p class="cat-note">${categoryMeta[cat]}</p>
                    </div>
                    <div class="grid">
                        ${projects.map(p => this.createProjectArticleHTML(p)).join('')}
                        ${projects.length < 3 ? this.createEmptyArticleHTML() : ''}
                    </div>
                </section>
            `;
        });

        container.innerHTML = html;
        this.initSearch();
    },

    createProjectArticleHTML(p) {
        const links = [];
        if (p.github) links.push(`<a class="plink" href="${p.github}" target="_blank" rel="noreferrer">Code ↗</a>`);
        if (p.live) links.push(`<a class="plink" href="${p.live}" target="_blank" rel="noreferrer">Live ↗</a>`);

        return `
            <article class="p" data-tags="${p.tags.join(',')}">
                <div class="p-k">${p.stackLine || p.tags.slice(0, 2).join(' · ')}</div>
                <div class="p-t">${p.title}</div>
                <p class="p-d">${p.description.substring(0, 100)}...</p>
                <div class="p-links">
                    ${links.join('')}
                </div>
            </article>
        `;
    },

    createEmptyArticleHTML() {
        return `
            <article class="p empty">
                <div class="p-k">Placeholder</div>
                <div class="p-t">Next build...</div>
                <p class="p-d">Working on something new to fill this slot. Stay tuned.</p>
            </article>
        `;
    },

    // ─── OVERLAYS ───
    initOverlays() {
        const cards = document.querySelectorAll('.card:not(.card-empty)');
        const projOv = document.getElementById('projOv');
        const projIn = document.getElementById('projIn');
        const projClose = document.getElementById('projClose');
        const projBd = document.getElementById('projBd');

        if (!projOv || !projIn) return;

        cards.forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                const p = this.data.find(proj => proj.id === id);
                if (p) this.showDetail(p);
            });
        });

        const close = () => {
            projOv.classList.remove('on');
            document.body.style.overflow = '';
        };

        projClose?.addEventListener('click', close);
        projBd?.addEventListener('click', close);
    },

    showDetail(p) {
        const projOv = document.getElementById('projOv');
        const projIn = document.getElementById('projIn');
        
        const github = p.github ? `<a href="${p.github}" target="_blank" class="t-send" style="text-decoration:none; margin-top:1rem;">View on GitHub</a>` : '';
        const live = p.live ? `<a href="${p.live}" target="_blank" class="t-send" style="text-decoration:none; margin-top:1rem; background:var(--accent2); color:#fff;">View Live Demo</a>` : '';

        projIn.innerHTML = `
            <div class="rev">
                <p class="sec-label">${p.meta}</p>
                <h2 class="sh" style="margin-bottom:1.5rem;">${p.title}</h2>
                
                <div class="card-badge ${p.status || 'live'}" style="margin-bottom:2rem;">
                    <div class="badge-dot"></div>${p.statusTxt || 'Completed'}
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:3rem; margin-bottom:3rem;">
                    <div>
                        <p class="t-lbl">// the_concept</p>
                        <p class="about-body" style="max-width:none;">${p.description}</p>
                        
                        <p class="t-lbl" style="margin-top:2rem;">// core_stack</p>
                        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.5rem;">
                            ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                        </div>
                    </div>
                    <div>
                        <img src="${p.image}" style="width:100%; border:1px solid var(--border); border-radius:4px;" />
                        ${github}
                        ${live}
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:2rem; border-top:1px solid var(--border-sub); padding-top:2.5rem;">
                    <div>
                        <p class="t-lbl" style="color:var(--accent);">01. The Why</p>
                        <p class="about-body" style="font-size:0.8rem;">${p.why || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="t-lbl" style="color:var(--accent);">02. The Problem</p>
                        <p class="about-body" style="font-size:0.8rem;">${p.problem || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="t-lbl" style="color:var(--accent);">03. The Solution</p>
                        <p class="about-body" style="font-size:0.8rem;">${p.solution || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;

        projOv.classList.add('on');
        document.body.style.overflow = 'hidden';
        
        // GSAP Reveal
        gsap.fromTo('#projIn .rev', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
    },

    // ─── SEARCH ───
    initSearch() {
        const searchInput = document.getElementById('projSearch');
        const clearBtn = document.getElementById('clearSearch');
        const matchCount = document.getElementById('matchCount');
        const cards = Array.from(document.querySelectorAll('article.p:not(.empty)'));

        if (!searchInput) return;

        const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

        const applySearch = () => {
            const q = norm(searchInput.value);
            let shown = 0;

            cards.forEach(card => {
                const title = card.querySelector('.p-t')?.textContent || '';
                const tags = card.getAttribute('data-tags') || '';
                const searchStr = norm(`${title} ${tags}`);
                const hit = !q || searchStr.includes(q);
                card.classList.toggle('hidden', !hit);
                if (hit) shown += 1;
            });

            if (!q) {
                matchCount.textContent = 'Showing all projects';
            } else {
                matchCount.textContent = `Showing ${shown} project${shown === 1 ? '' : 's'} for “${searchInput.value.trim()}”`;
            }
        };

        searchInput.addEventListener('input', applySearch);
        clearBtn?.addEventListener('click', () => {
            searchInput.value = '';
            applySearch();
        });
    }
};

window.ProjectsEngine = ProjectsEngine;

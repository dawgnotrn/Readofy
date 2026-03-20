document.addEventListener('DOMContentLoaded', () => {

    // --- DARK MODE TOGGLE ---
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if(themeToggle) themeToggle.textContent = '☀️';
    }
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            let theme = document.body.getAttribute('data-theme');
            if (theme === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeToggle.textContent = '🌙';
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeToggle.textContent = '☀️';
            }
        });
    }

    // --- OVERDUE CALCULATION ---
    const dueDates = document.querySelectorAll('.due-date-display');
    dueDates.forEach(el => {
        const borrowStr = el.getAttribute('data-date');
        if(borrowStr) {
            const borrowDate = new Date(borrowStr);
            const dueDate = new Date(borrowDate.getTime() + (14 * 24 * 60 * 60 * 1000));
            const now = new Date();
            const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                el.innerHTML = '<span class="badge-overdue">Overdue by ' + Math.abs(diffDays) + ' days</span>';
            } else {
                el.innerHTML = '<span style="color:var(--text-secondary); font-weight:500;">Due in ' + diffDays + ' days</span>';
            }
        }
    });
    
    // --- SEARCH FUNCTIONALITY ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchSpinner = document.getElementById('search-spinner');

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (!query) return;

            searchResults.innerHTML = '';
            searchSpinner.style.display = 'block';

            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                searchSpinner.style.display = 'none';
                
                if (data.books && data.books.length > 0) {
                    renderBooks(data.books);
                } else {
                    searchResults.innerHTML = '<div class="empty-state">No books found. Try a different search.</div>';
                }
            } catch (error) {
                searchSpinner.style.display = 'none';
                searchResults.innerHTML = `<div class="empty-state" style="color:#ef4444">Error searching books. Please try again.</div>`;
            }
        });
    }

    // --- GENRE FILTERS ---
    const genrePills = document.querySelectorAll('.genre-pill');
    if (genrePills) {
        genrePills.forEach(pill => {
            pill.addEventListener('click', () => {
                // remove active class from all
                genrePills.forEach(p => p.classList.remove('active'));
                // add to clicked
                pill.classList.add('active');
                
                // perform search
                const genre = pill.getAttribute('data-genre');
                searchInput.value = ''; // clear input
                performSearch(`subject:${genre}`);
            });
        });
    }

    async function performSearch(query) {
        if (!query) return;

        searchResults.innerHTML = '';
        searchSpinner.style.display = 'block';

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            searchSpinner.style.display = 'none';
            
            if (data.books && data.books.length > 0) {
                renderBooks(data.books);
            } else {
                searchResults.innerHTML = '<div class="empty-state">No books found. Try a different search.</div>';
            }
        } catch (error) {
            searchSpinner.style.display = 'none';
            searchResults.innerHTML = `<div class="empty-state" style="color:#ef4444">Error searching books. Please try again.</div>`;
        }
    }

    function renderBooks(books) {
        searchResults.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'books-grid';

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            
            const escapedTitle = book.title.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const escapedAuthor = book.author.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const escapedId = book.id.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const escapedLink = book.preview_link ? book.preview_link.replace(/'/g, "&#39;").replace(/"/g, "&quot;") : '#';

            card.innerHTML = `
                <img src="${book.thumbnail}" alt="Cover" class="book-cover">
                <div class="book-info">
                    <h3 class="book-title">${escapedTitle}</h3>
                    <p class="book-author">${escapedAuthor}</p>
                    <div style="margin-top: auto; display: flex; flex-direction: column; gap: 0.5rem;">
                        <a href="/read/${escapedId}" class="btn btn-secondary" style="justify-content:center; padding: 0.4rem;">📖 Read Preview</a>
                        <button class="btn btn-primary" onclick="borrowBook('${escapedId}', '${escapedTitle}', '${escapedAuthor}')">Borrow (+10 pts)</button>
                        <button class="btn btn-secondary" onclick="addWishlist('${escapedId}', '${escapedTitle}', '${escapedAuthor}', '${escapedLink}')">Add to Wishlist</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        searchResults.appendChild(grid);
    }

    // --- BORROW / RETURN LOGIC ---
    window.borrowBook = async (id, title, author) => {
        try {
            const response = await fetch('/api/borrow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, author })
            });
            const data = await response.json();

            if (response.ok) {
                alert(data.success || "Book borrowed successfully!");
                location.reload();
            } else {
                alert(data.error || "Failed to borrow book.");
            }
        } catch (error) {
            alert("Error trying to borrow the book.");
        }
    };

    window.returnBook = async (borrowId) => {
        if (!confirm("Are you sure you want to return this book?")) return;
        try {
            const response = await fetch('/api/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ borrow_id: borrowId })
            });
            if (response.ok) location.reload();
        } catch (error) {
            alert("Error trying to return the book.");
        }
    };

    // --- WISHLIST LOGIC ---
    window.addWishlist = async (id, title, author, preview_link) => {
        try {
            const response = await fetch('/api/wishlist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, author, preview_link })
            });
            const data = await response.json();
            if (response.ok) alert("Saved to wishlist!");
            else alert(data.error || "Failed to add to wishlist.");
        } catch (error) {
            alert("Error saving to wishlist.");
        }
    };

    window.removeWishlist = async (wishId) => {
        try {
            const response = await fetch('/api/wishlist/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wish_id: wishId })
            });
            if (response.ok) location.reload();
        } catch(e) {}
    };

    // Quick Book Preview from recommendation horizontal scroll
    window.openBookPreview = (id, title, author, link) => {
        // Option to borrow or read
        const openReader = confirm(`Read a preview of "${title}" now? (Cancel if you just want to borrow it)`);
        if(openReader) {
            window.location.href = `/read/${id}`;
        } else {
            if(confirm(`Would you like to borrow "${title}" by ${author} and earn 10 reward points?`)) {
                window.borrowBook(id, title, author);
            }
        }
    };

    // --- CHATBOT FUNCTIONALITY ---
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = chatInput.value.trim();
            if (!question) return;

            addChatBubble(chatHistory, question, 'user');
            chatInput.value = '';
            const typingId = 'typing-' + Date.now();
            addChatBubble(chatHistory, '...', 'bot', typingId);

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question })
                });
                const data = await response.json();
                
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();

                if (response.ok) addChatBubble(chatHistory, data.response, 'bot');
                else addChatBubble(chatHistory, "Sorry, error.", 'bot');
            } catch (error) {
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();
            }
        });
    }

    function addChatBubble(container, text, type, id = null) {
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble msg-${type}`;
        if (id) bubble.id = id;
        
        if (type === 'club') {
            // Text is expected to be HTML for club messages
            bubble.innerHTML = text;
        } else {
            bubble.textContent = text;
        }
        
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }

    // --- CLUBS functionality ---
    const btnLoadClubs = document.getElementById('btn-load-clubs');
    const clubsContainer = document.getElementById('clubs-container');
    const clubsListView = document.getElementById('clubs-list-view');
    const clubChatView = document.getElementById('club-chat-view');
    const activeClubName = document.getElementById('active-club-name');
    const activeClubId = document.getElementById('active-club-id');
    const clubChatHistory = document.getElementById('club-chat-history');
    const clubChatForm = document.getElementById('club-chat-form');
    const clubChatInput = document.getElementById('club-chat-input');
    
    let chatInterval = null;

    if (btnLoadClubs) {
        btnLoadClubs.addEventListener('click', loadClubs);
        // auto load on start
        loadClubs();
        btnLoadClubs.style.display = 'none'; // hide the button after loading
    }
    
    async function loadClubs() {
        if (!clubsContainer) return;
        clubsContainer.innerHTML = '<div class="spinner" style="display:block;"></div>';
        try {
            const res = await fetch('/api/clubs');
            const data = await res.json();
            
            // fetch my clubs
            const myRes = await fetch('/api/clubs/my');
            const myData = await myRes.json();
            const myClubIds = (myData.clubs || []).map(c => c.id);

            clubsContainer.innerHTML = '';
            if(!data.clubs || data.clubs.length === 0) {
                clubsContainer.innerHTML = '<div class="empty-state">No clubs found.</div>';
                return;
            }

            data.clubs.forEach(club => {
                const isMember = myClubIds.includes(club.id);
                const card = document.createElement('div');
                card.className = 'club-card';
                card.innerHTML = `
                    <h3 class="club-header">${club.name}</h3>
                    <p class="club-desc">${club.description || 'A community of readers.'}</p>
                    ${isMember 
                        ? `<button class="btn btn-primary" onclick="openClubChat('${club.id}', '${club.name}')">Enter Chat</button>`
                        : `<button class="btn btn-secondary" onclick="joinClub('${club.id}')">Join Club (+50 pts)</button>`
                    }
                `;
                clubsContainer.appendChild(card);
            });
        } catch(e) {
            console.error(e);
            clubsContainer.innerHTML = '<div class="empty-state">Failed to load clubs.</div>';
        }
    }

    window.joinClub = async (clubId) => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/join`, { method: 'POST' });
            if(res.ok) {
                // Award points via internal reward api
                await fetch('/api/rewards/add', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({points: 50})
                });
                alert("Joined club successfully! You earned 50 points.");
                loadClubs();
                // reload page to update rewards badge
                location.reload();
            }
        } catch(e) {
            alert("Error joining club.");
        }
    };

    window.openClubChat = (clubId, clubName) => {
        clubsListView.style.display = 'none';
        clubChatView.style.display = 'block';
        activeClubName.textContent = clubName;
        activeClubId.value = clubId;
        
        loadClubMessages(clubId);
        // poll every 3 seconds
        chatInterval = setInterval(() => loadClubMessages(clubId), 3000);
    };

    window.closeClubChat = () => {
        clubsListView.style.display = 'block';
        clubChatView.style.display = 'none';
        if(chatInterval) clearInterval(chatInterval);
    };

    async function loadClubMessages(clubId) {
        try {
            const res = await fetch(`/api/clubs/${clubId}/messages`);
            const data = await res.json();
            clubChatHistory.innerHTML = '';
            
            if(data.messages && data.messages.length > 0) {
                data.messages.forEach(msg => {
                    const senderName = msg.users ? msg.users.name : 'Unknown';
                    const content = `<div class="msg-sender">${senderName}</div><div>${msg.message}</div>`;
                    addChatBubble(clubChatHistory, content, 'club');
                });
            } else {
                clubChatHistory.innerHTML = '<div class="empty-state" style="padding:1rem;">No messages yet. Start the conversation!</div>';
            }
        } catch(e) {
            console.error(e);
        }
    }

    if(clubChatForm) {
        clubChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clubId = activeClubId.value;
            const msg = clubChatInput.value.trim();
            if(!msg || !clubId) return;

            clubChatInput.value = '';
            try {
                await fetch(`/api/clubs/${clubId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg })
                });
                loadClubMessages(clubId);
            } catch(e) {
                alert("Failed to send message.");
            }
        });
    }

});

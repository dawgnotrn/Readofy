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
            // parse ISO string to js date
            const borrowDate = new Date(borrowStr);
            // add 14 days
            const dueDate = new Date(borrowDate.getTime() + (14 * 24 * 60 * 60 * 1000));
            const now = new Date();
            const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                el.innerHTML = '<span class="badge-overdue">Overdue by ' + Math.abs(diffDays) + ' days</span>';
            } else {
                el.innerHTML = '<span style="color:var(--text-secondary); margin-left:8px; font-weight:500;">Due in ' + diffDays + ' days</span>';
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

            // Show loading
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
                searchResults.innerHTML = `<div class="empty-state" style="color:var(--btn-danger)">Error searching books. Please try again.</div>`;
                console.error("Search error:", error);
            }
        });
    }

    function renderBooks(books) {
        searchResults.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'books-grid';

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            
            // Generate valid JSON strings for inline onclick handlers carefully escaping quotes
            const escapedTitle = book.title.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const escapedAuthor = book.author.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const escapedId = book.id.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const escapedLink = book.preview_link ? book.preview_link.replace(/'/g, "&#39;").replace(/"/g, "&quot;") : '#';

            card.innerHTML = `
                <img src="${book.thumbnail}" alt="Cover of ${escapedTitle}" class="book-cover">
                <div class="book-info">
                    <h3 class="book-title">${escapedTitle}</h3>
                    <p class="book-author">${escapedAuthor}</p>
                    <div class="book-desc">${book.description}</div>
                    <div style="display: flex; gap: 0.5rem; margin-top: auto;">
                        <button class="btn btn-primary" style="flex: 1;" onclick="borrowBook('${escapedId}', '${escapedTitle}', '${escapedAuthor}')">
                            Borrow
                        </button>
                        <button class="btn btn-secondary" style="flex: 1;" onclick="addWishlist('${escapedId}', '${escapedTitle}', '${escapedAuthor}', '${escapedLink}')">
                            ❤️ Save
                        </button>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <a href="${escapedLink}" target="_blank" class="btn btn-secondary btn-block" style="text-align: center;">
                            Read Preview
                        </a>
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, title, author })
            });
            const data = await response.json();

            if (response.ok) {
                alert("Book borrowed safely! Please refresh page to see in your list.");
                location.reload();
            } else {
                alert(data.error || "Failed to borrow book.");
            }
        } catch (error) {
            console.error("Borrow error:", error);
            alert("Error trying to borrow the book.");
        }
    };

    window.returnBook = async (borrowId) => {
        if (!confirm("Are you sure you want to return this book?")) return;

        try {
            const response = await fetch('/api/return', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ borrow_id: borrowId })
            });
            const data = await response.json();

            if (response.ok) {
                location.reload();
            } else {
                alert(data.error || "Failed to return book.");
            }
        } catch (error) {
            console.error("Return error:", error);
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
            if (response.ok) {
                alert("Saved to wishlist! Refresh to see it in your sidebar.");
            } else {
                alert(data.error || "Failed to add to wishlist.");
            }
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
            if (response.ok) {
                location.reload();
            }
        } catch (error) {
            alert("Error removing from wishlist.");
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

            // Add user message to UI
            addChatBubble(question, 'user');
            chatInput.value = '';
            
            // Add thinking indicator
            const typingId = 'typing-' + Date.now();
            addChatBubble('...', 'bot', typingId);

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ question })
                });
                const data = await response.json();
                
                // Remove typing indicator
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();

                if (response.ok) {
                    addChatBubble(data.response, 'bot');
                } else {
                    addChatBubble("Sorry, I encountered an error. Check console.", 'bot');
                }

            } catch (error) {
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();
                addChatBubble("Network error connecting to chatbot.", 'bot');
                console.error("Chat error:", error);
            }
        });
    }

    function addChatBubble(text, sender, id = null) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble chat-${sender}`;
        if (id) bubble.id = id;
        
        // Convert URLs or line breaks if necessary, but keep it simple text
        bubble.textContent = text;
        
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // --- AI RECOMMENDATIONS ---
    const btnRecommend = document.getElementById('btn-recommend');
    if(btnRecommend && chatInput && chatForm) {
        btnRecommend.addEventListener('click', () => {
            const titles = Array.from(document.querySelectorAll('.borrowed-info h4')).map(h => h.textContent);
            let prompt = "Please recommend me 3 interesting books to read.";
            if(titles.length > 0) {
                prompt = `Based on the fact that I recently borrowed "${titles.join('", "')}", what are 3 similar interesting books you would recommend? Give a short and sweet list.`;
            }
            chatInput.value = prompt;
            chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
    }
});

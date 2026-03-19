import requests

def search_books(query):
    """
    Search for books using the Google Books API.
    Returns a list of book dictionaries containing title, author, description, and thumbnail.
    """
    if not query:
        return []
        
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}"
    response = requests.get(url)
    
    if response.status_code != 200:
        return []
        
    data = response.json()
    books = []
    
    for item in data.get('items', []):
        volume_info = item.get('volumeInfo', {})
        
        # Extract required fields with fallbacks
        title = volume_info.get('title', 'Unknown Title')
        authors = volume_info.get('authors', ['Unknown Author'])
        author = ", ".join(authors) if isinstance(authors, list) else authors
        description = volume_info.get('description', 'No description available.')
        image_links = volume_info.get('imageLinks', {})
        thumbnail = image_links.get('thumbnail', 'https://via.placeholder.com/128x192.png?text=No+Cover')
        preview_link = volume_info.get('previewLink', '#')
        
        books.append({
            'id': item.get('id'),
            'title': title,
            'author': author,
            'description': description,
            'thumbnail': thumbnail,
            'preview_link': preview_link
        })
        
    return books

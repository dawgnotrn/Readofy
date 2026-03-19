-- Create Users Table
CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Create BorrowedBooks Table
CREATE TABLE BorrowedBooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    book_title TEXT NOT NULL,
    borrow_date TIMESTAMP DEFAULT now(),
    book_author TEXT,
    google_books_id TEXT
);

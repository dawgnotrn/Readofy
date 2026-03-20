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

-- Create BookClubs Table
CREATE TABLE BookClubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES Users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now()
);

-- Create ClubMembers Table
CREATE TABLE ClubMembers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES BookClubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT now(),
    UNIQUE(club_id, user_id)
);

-- Create ClubMessages Table
CREATE TABLE ClubMessages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES BookClubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Create UserRewards Table
CREATE TABLE UserRewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE UNIQUE,
    points INTEGER DEFAULT 0,
    level VARCHAR(50) DEFAULT 'Novice Reader',
    updated_at TIMESTAMP DEFAULT now()
);

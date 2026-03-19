# 📚 Welcome to Readofy!

**Readofy** is your own Smart Library Management System! You can use this to search for books, save them to an active Wishlist, manage your borrowed books, and even chat with an AI Librarian.

---

## 🚀 Quick Setup Guide

When you download this project onto your PC, follow these simple steps using **VS Code** to get it running:

### Step 1: Install Python

If you don't already have Python installed on your PC, download and install it from [python.org](https://www.python.org/downloads/).
_(Important: Make sure to check the box that says "Add Python.exe to PATH" during installation!)_

### Step 2: Open the Project in VS Code

1. Open the `library_project` folder in Visual Studio Code.
2. Open the built-in Terminal in VS Code by going to **Terminal -> New Terminal** at the top menu.

### Step 3: Configure API Keys

The app needs a few secret keys to run its database and AI features.

1. Look in the left sidebar file explorer and find a file named `.env.example`.
2. Right-click and rename it to exactly `.env`.
3. Open the `.env` file and paste in the `SUPABASE_KEY` and `OPENROUTER_API_KEY`.

### Step 4: Install Dependencies

In the VS Code Terminal, copy and paste this command and hit Enter:

```sh
pip install -r requirements.txt
```

_(Wait a moment for everything to safely install)._

### Step 5: Start the App! 🎉

You are ready to go! Whenever you want to launch the library, just type this into the terminal:

```sh
python backend/app.py
```

Leave the terminal running, and just hold down **Ctrl** and click on the link that appears in the terminal:
**[http://127.0.0.1:5000](http://127.0.0.1:5000)**

Enjoy exploring your library! 📖

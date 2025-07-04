# My Anime List - A Modern Viewer

This project is a modern, feature-rich web application designed to provide a superior user experience for viewing, managing, and organizing your MyAnimeList (MAL) data. Built with Next.js and Material UI, it offers a fast, responsive, and visually appealing alternative to the original website's list view.

The primary goal is to take your standard MAL export and bring it to life with a clean interface, powerful sorting capabilities, and quality-of-life features that make tracking your anime a pleasure.

## ✨ Key Features & Differentials

This application was built from the ground up to improve upon the standard list-viewing experience.

- **Modern & Responsive UI**: A clean, beautiful interface built with Material UI that works seamlessly on desktop and mobile devices.
- **Light & Dark Mode**: Toggle between a light and dark theme to suit your preference.
- **Advanced Sorting & Filtering**:
    - Sort your list by title, score, status, and more.
    - Filter your list by completion status.
    - Instantly search your entire list by title.
- **Custom Sort Orders**: Create, name, and save your own persistent sort orders. Organize your list exactly how you want using intuitive drag-and-drop or by directly editing an anime's rank number.
- **Rich Editing Experience**:
    - **Quick Edits**: Increment watched episodes with a single click on the anime card.
    - **Detailed Edits**: Click any card to open a full edit dialog where you can change the status, score, watched episodes, and start/finish dates.
    - **Clear Score**: Easily reset an anime's score to zero from the edit dialog.
- **MyAnimeList XML Import**: Get started in seconds by importing your existing list directly from a MAL XML export file. The app intelligently merges new data without creating duplicates.
- **Automatic Cover Art**: The application automatically fetches and caches high-quality cover art for every anime in your list, providing a rich visual experience.
- **Quick Streaming Search**: Click on any anime's title to instantly search for it on JustWatch and find out where it's available to stream.

---

## 🚀 Getting Started with Docker

The easiest and recommended way to run this application is with Docker. This ensures the environment is consistent and allows the app to run as a persistent background service on your machine.

### Prerequisites

- You must have **Docker Desktop** installed and running on your computer.

### Running the Application

1.  **Clone or download the project files** to a directory on your computer. Ensure you have the `Dockerfile`, `.dockerignore`, and `docker-compose.yml` files in the root directory.

2.  **Open your terminal** (like PowerShell, Command Prompt, or Terminal on Mac/Linux) and navigate to the project's root directory.

3.  **Build the Docker image** by running the following command. This will read the `Dockerfile`, install all dependencies, and build the Next.js application.
    ```bash
    docker-compose build
    ```

4.  **Run the container** in detached (background) mode. This command starts the application and ensures it will restart automatically if you reboot your computer.
    ```bash
    docker-compose up -d
    ```

5.  **Done!** The application is now running. You can access it in your web browser by navigating to:
    **[http://localhost:8545](http://localhost:8545)**

---

## 📖 How to Use the Application

### Importing Your MyAnimeList Data

To populate the application with your list, you first need to export it from MyAnimeList.

1.  **Log in** to your account on [MyAnimeList.net](https://myanimelist.net).
2.  Navigate to your anime list.
3.  On the left-hand side, find and click the **"Export"** link.
4.  On the export page, select **"XML"** as the export type and click the **"Export My List"** button. This will download an `animelist_....xml` file to your computer.
5.  In this application, click the green **"Import"** button in the controls panel.
6.  Select the `.xml` file you just downloaded.

The application will process the file, import all your anime, and automatically refresh the view with your complete list.

### Managing Your List

- **Add Anime**: Use the "Add New Anime by Title" input to search for and add a new anime to your list one by one.
- **Edit Anime**: Click anywhere on an anime card to open the detailed edit dialog.
- **Delete Anime**: Click the trash can icon on an anime card or the "Delete Anime" button inside the edit dialog.
- **Change Sort Order**: Use the "Sort By" dropdown to select a default sort or one of your custom-named sorts.
- **Create Custom Sorts**: Select "Add New Sort" from the "Sort By" dropdown to create a new list that you can organize via drag-and-drop.

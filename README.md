# Vibra - What's Your Vibe?

Vibra is a full-stack web application that analyzes your mood from text and curates a personalized Spotify playlist to match your vibe. Simply type in how you're feeling, a line from a song, or any text, and let Vibra translate it into music.

## ✨ Features

* **Advanced Mood Analysis:** Utilizes a fine-tuned Machine Learning model to detect the dominant emotion from your text input (e.g., Joy, Sadness, Anger, Calm).
* **Dynamic Visual Feedback:** Displays a relevant GIF and an inspirational quote that matches your detected mood.
* **Seamless Spotify Integration:**
    * Securely connect your Spotify account using OAuth 2.0.
    * Get a list of recommended tracks tailored to your specific vibe.
    * Create a new, private playlist on your Spotify account with one click.
* **Customizable Playlists:** Adjust the number of tracks for your new playlist.
* **Responsive Design:** A beautiful, animated, and mobile-friendly user interface built with React and Framer Motion.
* **User Accounts:** Simple and secure user registration and login using JWT.

## 🛠 Tech Stack

Vibra is built with a modern MERN-like stack, with a Python-based microservice for machine learning.

| Area               | Technology                                             |
| :----------------- | :----------------------------------------------------- |
| **Frontend** | React, TypeScript, Axios, Framer Motion, Lucide React  |
| **Backend** | Node.js, Express, Mongoose                             |
| **Database** | MongoDB                                                |
| **Authentication** | JSON Web Tokens (JWT)                                  |
| **Machine Learning**| Python, Flask, Hugging Face Transformers               |
| **APIs** | Spotify Web API, Giphy API                             |

## 📂 Project Structure

The project is organized as a monorepo with two main folders: `vibra-frontend` and `vibra-backend`.

`├── vibra-backend/ ├── ml/ # Python ML service for emotion analysis ├── models/ # Mongoose schemas (User, Favorite, etc.) ├── middleware/ # Express middleware (auth, error handling) ├── routes/ # API routes (auth, spotify, mood) ├── app.js # Express app setup └── package.json ├── vibra-frontend/ ├── public/ ├── src/ ├── components/ # React components for each screen ├── utils/ # API helpers, sound manager ├── App.tsx # Main app component with routing ├── index.tsx └── package.json`


## 🚀 Getting Started

Follow these instructions to get a local copy of Vibra up and running.

### Prerequisites

* **Node.js**: v18.x or later
* **npm**: v9.x or later
* **Python**: v3.9 or later
* **MongoDB**: An active MongoDB instance (local or a cloud service like MongoDB Atlas).

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/mecartin/vibra.git](https://github.com/mecartin/vibra.git)
    cd vibra
    ```

2.  **Backend Setup:**
    * Navigate to the backend directory:
        ```bash
        cd vibra-backend
        ```
    * Install dependencies:
        ```bash
        npm install
        ```
    * Create a `.env` file in the `vibra-backend` root. Use the template below and fill in your credentials:
        ```env
        # vibra-backend/.env

        # Server Configuration
        PORT=5000

        # MongoDB Connection
        MONGO_URI=your_mongodb_connection_string

        # JWT Authentication
        JWT_SECRET=your_super_secret_jwt_key

        # Spotify API Credentials
        SPOTIFY_CLIENT_ID=your_spotify_client_id
        SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
        SPOTIFY_REDIRECT_URI=http://localhost:5000/api/spotify/callback

        # Frontend URL for redirects
        FRONTEND_URL=http://localhost:3000

        # Giphy API Key
        GIPHY_API_KEY=your_giphy_api_key

        # ML Server URL
        ML_API_URL=[http://127.0.0.1:5001/analyze](http://127.0.0.1:5001/analyze)
        ```
    * **Get Spotify Credentials:** Create an app on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/). Add `http://localhost:5000/api/spotify/callback` to the list of Redirect URIs in your Spotify app settings.
    * **Get Giphy Credentials:** Create an app on the [Giphy Developers portal](https://developers.giphy.com/).

3.  **Machine Learning Server Setup:**
    * Navigate to the ML directory from `vibra-backend`:
        ```bash
        cd ml
        ```
    * Install Python dependencies:
        ```bash
        pip install -r requirements.txt
        ```

4.  **Frontend Setup:**
    * Navigate to the frontend directory from the root `vibra` directory:
        ```bash
        cd vibra-frontend
        ```
    * Install dependencies:
        ```bash
        npm install
        ```
    * Create a `.env` file in the `vibra-frontend` root and add the following:
        ```env
        # vibra-frontend/.env
        REACT_APP_API_URL=http://localhost:5000
        ```

### Running the Application

You need to run three separate processes in three different terminal windows.

1.  **Terminal 1: Run the ML Server** (from `vibra-backend/ml`)
    ```bash
    # Make sure you are in the vibra-backend/ml directory
    python emotion_server.py
    ```
    This will start the Flask server, typically on port 5001.

2.  **Terminal 2: Run the Backend Server** (from `vibra-backend`)
    ```bash
    # Make sure you are in the vibra-backend directory
    npm start
    ```
    This will start the Node.js server, typically on port 5000.

3.  **Terminal 3: Run the Frontend App** (from `vibra-frontend`)
    ```bash
    # Make sure you are in the vibra-frontend directory
    npm start
    ```
    This will open the Vibra application in your browser at `http://localhost:3000`.

## ⚙️ API Endpoints

The backend exposes the following RESTful API endpoints:

| Method | Endpoint                             | Description                                            |
| :----- | :----------------------------------- | :----------------------------------------------------- |
| `POST` | `/api/auth/register`                 | Register a new user.                                   |
| `POST` | `/api/auth/login`                    | Log in an existing user.                               |
| `POST` | `/api/mood/analyze`                  | Analyze text to determine the mood.                    |
| `GET`  | `/api/spotify/login/url`             | Get the Spotify authorization URL.                     |
| `GET`  | `/api/spotify/callback`              | Handles the OAuth callback from Spotify.               |
| `GET`  | `/api/spotify/status`                | Check if the user's Spotify is connected.              |
| `POST` | `/api/spotify/recommendations`       | Get track recommendations based on a mood.             |
| `POST` | `/api/spotify/create-playlist`       | Create a new playlist on the user's Spotify account.   |
| `POST` | `/api/spotify/disconnect`            | Disconnect the user's Spotify account.                 |
| `GET`  | `/api/content/gif/:mood`             | Get a GIF for a specific mood.                         |
| `GET`  | `/api/content/quote/:mood`           | Get a quote for a specific mood.                       |

## 💡 Future Improvements

* **Deeper Spotify Integration:** Analyze the user's top artists or recently played tracks to further personalize recommendations.
* **Save & View Playlists:** Allow users to see a history of the playlists they've created with Vibra.
* **Mood History:** Track a user's mood over time and display insights.
* **Share Functionality:** Let users share their created playlists or vibe results with friends.

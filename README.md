

# 🧠 Psy-Connect


A mental health support platform that uses **AI-powered emotion detection** and provides personalized recommendations based on the user’s emotional state.  

---

## 🔑 Key Features

- 💬 **Real-Time Emotion Detection** — Capture webcam feed, process it with a Python ML model (Flask API), and detect emotions live.  
- 🏗️ **Modular Full-Stack Architecture** — REST APIs built with **Express.js + Node.js**, with MongoDB + Mongoose ODM for schema validation and data modeling.  
- 🔒 **Secure Authentication** — JWT-based login, password encryption with **bcrypt**, and protected routes for safe access.  
- 📤 **File & Data Handling** — Smooth integration of user uploads and data logs with scalable storage.  
- ⚡ **Fast Frontend** — Built using **React (Vite) + Tailwind CSS** for a responsive and modern UI.  
- 🔄 **Async State & API Syncing** — Efficient communication with backend services using **Axios**.  
- 🎯 **Personalized Recommendations** — Based on detected emotions, provide activities, playlists, and self-care tips.  

---

## 🧰 Tech Stack

| Layer            | Tools & Frameworks |
|------------------|--------------------|
| **Frontend**     | React.js (Vite), Tailwind CSS |
| **Backend**      | Node.js, Express.js, REST API |
| **Database**     | MongoDB (Mongoose ODM) |
| **Auth & Secure**| JWT, bcrypt, dotenv, CORS |
| **ML Service**   | Python, Flask (Emotion Detection) |
| **State & HTTP** | Axios |
| **Version Control** | Git, GitHub |

---

## ⚡ AWS Rekognition Setup

1. **Create or sign in to an AWS account:** https://console.aws.amazon.com/
2. **Open IAM:** https://console.aws.amazon.com/iam/
3. **Do NOT use root access keys.**
4. **Create a dedicated IAM user** for this application (e.g. `psy-connect-rekognition`).
5. **Give least-privilege permission:** Create a custom inline policy that ONLY allows `rekognition:DetectFaces`.
6. **Create an access key** for this user.
7. **Copy the Access Key ID.**
8. **Copy the Secret Access Key immediately** (AWS does not allow recovering the secret later).
9. **Put them in `server/.env`.**
10. **Set the AWS Region:** `AWS_REGION=ap-south-1`
11. Start the project using `npm run dev`.

---

## ⚡ Installation & Setup

### 1️⃣ Clone the Repository
git clone https://github.com/codecrafter34/Psy-Connect.git
cd Psy-Connect
### 2️⃣ Install Dependencies
npm install
### 3️⃣ Start Development Server
npm run dev
### 4️⃣ Backend Setup
cd backend
npm install
npm run start
### 5️⃣ ML Service (Python)
cd ml-service
pip install -r requirements.txt
python app.py


🚀 Future Improvements
📱 Mobile-friendly responsive design

🎵 Spotify API integration for mood-based playlists

🧘 Smarter recommendations via AI models
## 📸 Screenshots  


 





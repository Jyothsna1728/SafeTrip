# SafeTrip — Smart Travel & Safety Companion

> **Explore. Travel. Stay Safe.**

SafeTrip is a modern, full-stack travel discovery and safety companion web application. It connects real destination search with live points of interest (attractions, hotels, restaurants, hospitals, and police stations) displayed on an interactive OpenStreetMap Leaflet map, while offering user trip planning, bookmarking, safety check-ins, community hazard reports, emergency discovery, and an AI companion powered by Groq.

---

## 🌟 Key Features

1. **Destination Exploration**:
   - Search any city (e.g. Hyderabad, Vijayawada, Bengaluru, Chennai, Mumbai, Delhi, etc.) or click **📍 Use My Current Location**.
   - Strict separation of **Current GPS Location** and **Explore Location** (no misleading distance calculations across unrelated cities).

2. **Flagship Split & Result Focus Layouts**:
   - **Split View**: 55% Result List / 45% Interactive Leaflet Map on desktop; intuitive **List | Map** toggle on mobile.
   - **Result Focus**: Full-width 3-column responsive place cards.
   - **Map Focus**: 100% full-screen interactive Leaflet map.
   - Bidirectional **Card ↔ Marker Synchronization**: clicking/hovering a place card highlights and zooms to its pin on the map; clicking a pin scrolls and highlights the card.

3. **Category Navigation & Verified Filters**:
   - 🏛️ **Attractions**: Monuments, heritage sights, and landmarks with genuine Wikipedia summaries and photos.
   - 🏨 **Hotels**: Accommodations, resorts, guest houses
   - 🍴 **Restaurants**: Dining, cafes, cuisines
   - 🏥 **Hospitals**: Verified medical facilities (*Zero laboratories*)
   - 👮 **Police Stations**: Official law enforcement outposts

4. **Safety Mode & Emergency Assistance**:
   - **Safety Mode**: Quickly filters the explore map to prioritize hospitals and police stations.
   - **🚨 Emergency**: Access medical or police assistance around the explore destination or your physical GPS location, plus direct dialing of user-configured emergency contacts.
   - **External Directions**: One-click Google Maps directions to any place via latitude/longitude.

5. **Personal Trip Planning & Bookmarks**:
   - **My Saved Places**: Bookmark places organized by category tabs.
   - **My Trips**: Create destination itineraries with vertical journey timeline and attach places.
   - **✓ I'm Safe Check-in**: One-click safety status logging with timestamp and GPS coordinates.
   - **Community Safety Reports**: Crowdsourced warnings for scams, unsafe areas, or road hazards.

6. **General-Purpose & Travel AI Assistant (Powered by Groq)**:
   - Powered by Groq's high-speed LLMs (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`).
   - Answers coding, general knowledge, study help, as well as travel advice and packing checklists.

---

## 🛠️ Technology Stack

### Backend
- **Java 8** (`<java.version>1.8</java.version>`)
- **Spring Boot 2.7.18**
- **Spring Data JPA** & **Spring Security** (Stateless JWT authentication)
- **MySQL 8** (Direct database storage for users, trips, check-ins, bookmarks, reports)
- **Standard Java POJOs** (Explicit constructors, getters, setters — *No Lombok*)

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** (Custom travel & safety design system)
- **Leaflet** & **React Leaflet** (OpenStreetMap tiles & custom SVG markers)
- **Axios** with JWT request/response interceptors
- **Lucide React** icons

---

## 🚀 Getting Started

### 1. Backend Setup

#### Prerequisites
- Java 8 JDK
- Maven 3.6+
- MySQL 8.0+

#### Database Configuration
1. Start your local MySQL service:
   ```sql
   CREATE DATABASE IF NOT EXISTS safe_trip;
   ```
2. Configure credentials in `backend/src/main/resources/application.properties` or environment variables:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/safe_trip?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
   spring.datasource.username=root
   spring.datasource.password=your_password
   
   # Places API Key (Get a free key at https://www.geoapify.com/ - 3,000 free req/day)
   safetrip.places.api-key=your_geoapify_key
   
   # Groq AI Assistant (Free API key at https://console.groq.com/)
   safetrip.groq.api-key=your_groq_api_key
   safetrip.groq.model=openai/gpt-oss-120b
   safetrip.groq.url=https://api.groq.com/openai/v1/chat/completions
   ```

#### Run Backend
```bash
cd backend
mvn clean spring-boot:run
```
The backend will start at `http://localhost:8080`.

---

### 2. Frontend Setup

#### Prerequisites
- Node.js 18+
- npm

#### Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

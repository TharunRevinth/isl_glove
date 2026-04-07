# ISL Pro | Humane Sign Language Dashboard

A professional, high-fidelity web interface designed for real-time Indian Sign Language (ISL) interpretation using a smart glove system (ESP32-based).

## ✨ Features
- **Real-time Interpretation**: Instantly maps glove sensor data to meaningful words.
- **Visual Coaching System**: An interactive "Academy" mode with a 3D-like hand visualizer to help users learn gestures.
- **Premium Aesthetics**: Smooth view transitions, custom CSS animations, and a polished UI.
- **Dynamic Themes**: Seamless switching between Light and Dark modes with a custom Sun/Moon slider.
- **Voice Output**: Integrated text-to-speech for audible interpretation.
- **Wearable Integration**: Built-in Web Bluetooth (BLE) support for connecting directly to the ISL Pro Glove.

## 🛠️ Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript.
- **Icons**: Lucide Icons.
- **Fonts**: Outfit (Google Fonts).
- **Firmware**: Arduino/C++ (ESP32 WROOM).

## 🚀 Getting Started
1. Open `index.html` in a modern browser (Chrome/Edge recommended for BLE support).
2. Click **CONNECT BLE** to link your glove.
3. Switch to **Academy** mode to practice gestures.

## 📁 Project Structure
- `index.html`: Main application entry point.
- `style.css`: Premium design system and animations.
- `app.js`: Core application logic and BLE communication.
- `glove_esp32.ino`: Firmware source code for the ESP32 glove.

---
*Built with ❤️ for inclusive communication.*

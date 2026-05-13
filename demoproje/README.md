# IoT Smart Building Management System

A comprehensive IoT-based building management system dashboard built with React, Vite, and Tailwind CSS. The system provides real-time monitoring of visitors, sensor data (temperature, humidity, gas levels), and security camera events.

![Dashboard Preview](https://via.placeholder.com/800x450.png?text=IoT+Smart+Building+Dashboard)

## Features

- **Visitor Tracking:** Monitor daily/weekly visitor counts and detailed entry logs.
- **Sensor Monitoring:** View real-time temperature, humidity, and gas sensor data from multiple edge devices (ESP32). Includes anomaly detection.
- **Security Camera Integration:** Track security events and flagged individuals using inner and outer building cameras (Raspberry Pi Edge Servers).
- **AI Assistant Integration:** Natural language interface for querying building statistics and event logs.
- **System Settings & Status:** Monitor hardware status, ping times, and synchronize data across the system.
- **Responsive Design:** Modern UI designed with Tailwind CSS, supporting both desktop and mobile views.

## Tech Stack

- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **Routing:** React Router DOM

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/iot-smart-building.git
cd iot-smart-building
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Configure Environment Variables
Copy the example environment file and update it with your own settings (if using a real backend):
\`\`\`bash
cp .env.example .env
\`\`\`
*Note: The system is currently configured to run in Demo mode with mock data.*

4. Start the development server
\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:5173`.

## Demo Mode

This project is currently set up to run using local mock data and a simulated backend client. It is safe for demonstration purposes and does not require active API keys or database connections to run. 

To log in to the demo dashboard, use the following credentials:
- **Email:** `admin@smartbuilding.io`
- **Password:** `demo1234`

## Project Structure

- `/src/components` - Reusable UI components and layout elements
- `/src/pages` - Main dashboard views (Dashboard, Sensors, Visitors, Security, etc.)
- `/src/lib` - Utility functions, constants, and mock data/client setup
- `/src/hooks` - Custom React hooks (e.g., authentication)
- `/public` - Static assets and mock images
- `/sql` - Database schema definitions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

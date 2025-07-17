# Loyalty Program App

A feature-rich loyalty program platform supporting role-based access control, QR code functionality, points transactions, event and promotion management. Built with a modern React frontend and Node.js backend.

## Features

- **User Roles:** Regular users, Cashiers, Managers, Event Organizers, and Superusers.
- **Points System:** Accumulate, redeem, and transfer loyalty points with full transaction history and QR code identification.
- **Event Management:** Organizers can create and manage events, RSVP attendees, and award participation points.
- **Promotions:** Create and manage promotional campaigns visible to users during eligible transactions.
- **User Management:** Admin-level role-based dashboards for filtering, searching, and updating users.
- **Responsive UI:** Fully responsive and accessible interface with smooth navigation using React Router.
- **QR Code Support:** Dynamic QR code generation for user identification and redemption processing.
- **Pagination and Filtering:** All list views support pagination, filters, and sorting for scalability.
- **Authentication:** Secure login, role switching, password management, and profile editing.

## Tech Stack

- **Frontend:** React.js, React Router
- **Backend:** Node.js, Express.js, Prisma, SQLite3

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Git

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/lanthony42/loyalty-program-app.git
    cd loyalty-program-app
    ```

2. Install backend dependencies:

    ```bash
    cd backend
    npm install
    ```

3. Install frontend dependencies:

    ```bash
    cd ../frontend
    npm install
    ```

4. Seed the database (optional):

    ```bash
    cd ../backend
    npm run seed
    ```
  
5. Run the backend server:

    ```bash
    npm start
    ```
  
6. Run the frontend server (separate terminal):

    ```bash
    cd ../frontend
    npm start
    ```

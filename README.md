# Online Voting System

A secure and modern online voting system with voter verification, OTP authentication, vote casting, receipts, and live election results.

## Features

* Voter ID verification
* Phone and email OTP authentication
* One vote per voter
* Candidate selection and confirmation
* Vote receipt with transaction hash
* Live election results
* Voter turnout tracking
* Local SQLite database
* LocalStorage fallback
* Database reset for testing

## Tech Stack

* React 19
* Vite
* Tailwind CSS
* Express.js
* SQLite
* Node.js

## Getting Started

Make sure you have Node.js installed.

```bash
git clone https://github.com/weirdsmirk/OnlineVotingSystem.git
cd OnlineVotingSystem
npm install
```

Start the application:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3001
```

The database is stored locally as:

```text
database.sqlite
```

## Demo Login

The project includes sample voter accounts for testing the complete voting flow.

### Voter 1

```text
Voter ID: VUP47392
Name: Aarav Sharma

Phone OTP: 482910
Email OTP: 736251
```

### Voter 2

```text
Voter ID: VDL81620
Name: Isha Patel

Phone OTP: 193047
Email OTP: 528374
```

### Voter 3

```text
Voter ID: VKA30517
Name: Rohan Gupta

Phone OTP: 847362
Email OTP: 019283
```

### Voter 4

```text
Voter ID: VTN92746
Name: Meera Nair

Phone OTP: 571038
Email OTP: 294716
```

### Voter 5

```text
Voter ID: VRJ54803
Name: Vikram Singh

Phone OTP: 638492
Email OTP: 815037
```

### Voter 6

```text
Voter ID: VWB61938
Name: Ananya Das

Phone OTP: 420185
Email OTP: 963574
```

## Demo Candidates

The following candidates are included in the default database:

```text
1. BJP (Bharatiya Janata Party)
2. AAP (Aam Aadmi Party)
3. INC (Indian National Congress)
4. NOTA (None of the Above)
5. SP (Samajwadi Party)
```

These are demo records included for testing the application and do not represent an actual election.

## Voting Flow

1. Enter a registered Voter ID.
2. Verify the voter.
3. Enter the phone and email OTPs.
4. Select a candidate.
5. Confirm the vote.
6. Receive a vote receipt and transaction hash.
7. View the updated election results.

Each voter can cast only one vote.

## Database

The application uses SQLite for local data storage.

The database contains:

* Candidates
* Registered voters
* Users
* Votes
* Vote timestamps

The database is created and seeded automatically when the backend starts.

To reset the demo data:

```text
POST /api/reset
```

You can also delete `database.sqlite` and restart the application to create a fresh database.

## API

```text
GET  /data
POST /data
POST /api/reset
```

`GET /data` returns the current database state, while `POST /data` saves changes back to SQLite.

## Project Structure

```text
OnlineVotingSystem/
├── database.sqlite
├── server.js
├── src/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Note

This project is a local/demo voting system created for learning and experimentation. It is not designed or certified for use in real elections.

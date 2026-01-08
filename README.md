# 🎮 Tic Tac Toe - Real-Time Multiplayer Game

A modern, real-time multiplayer Tic Tac Toe game built with Spring Boot and vanilla JavaScript. Features include AI opponent, live multiplayer with WebSocket support, in-game chat, and spectator mode.
🌐 **Live Demo**: [Play Now](http://tictactoe-game-frontend.s3-website.eu-central-1.amazonaws.com/)


## ✨ Features

### Game Modes
- **Single Player**: Play against an intelligent AI opponent
- **Multiplayer**: Challenge friends with shareable game links
- **Spectator Mode**: Watch ongoing games in real-time

### Core Functionality
- 🎯 Real-time game synchronization via WebSocket
- 💬 In-game chat system for multiplayer matches
- 🤖 Smart AI opponent with strategic gameplay
- 🔄 Rematch functionality with both players' consent
- 👁️ Spectator mode for viewing active games
- 📱 Responsive design for desktop and mobile devices
- 🎨 Modern, visually appealing UI with smooth animations

## 🛠️ Tech Stack

### Backend
- **Java 21**
- **Spring Boot 3.2.0**
- **Spring WebSocket** (STOMP protocol)
- **Maven** for dependency management

### Frontend
- **HTML5**
- **CSS3** with modern styling and animations
- **Vanilla JavaScript**
- **SockJS** for WebSocket client connection
- **STOMP.js** for messaging protocol

## 🚀 Getting Started

### Prerequisites
- Java 21 or higher
- Maven 3.6+
- A modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tuckens/TicTacToe-AWS-EB.git
   cd TicTacToe-AWS-EB
   ```

2. **Build the project**
   ```bash
   mvn clean package
   ```

3. **Run the application**
   ```bash
   java -jar target/tictactoe-api-1.0.0.jar
   ```
   
   Or use Maven:
   ```bash
   mvn spring-boot:run
   ```

4. **Access the game**
   - Open your browser and navigate to `http://localhost:5000`
   - The frontend files should be served from the `frontend/` directory

### Configuration

The server runs on port `5000` by default. You can modify this in `src/main/resources/application.properties`:

```properties
server.port=5000
spring.web.cors.allowed-origins=*
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
```

## 📖 API Documentation

### REST Endpoints

#### Create New Game
```http
POST /api/game/new?aiMode={boolean}
```
Creates a new game instance.
- **Parameters**: 
  - `aiMode` (optional): `true` for single-player mode, `false` for multiplayer
- **Response**: `GameResponse` with game ID and initial board state

#### Make a Move
```http
POST /api/game/{gameId}/move
Content-Type: application/json

{
  "row": 0,
  "column": 0,
  "player": "X"
}
```
Makes a move in the specified game.
- **Path Parameters**: `gameId` - Unique identifier for the game
- **Body**: Move coordinates and player symbol
- **Response**: Updated game state

#### Get Game State
```http
GET /api/game/{gameId}
```
Retrieves the current state of a game.
- **Path Parameters**: `gameId` - Unique identifier for the game
- **Response**: Current game state including board and status

#### Get Full Game Object
```http
GET /api/game/{gameId}/state
```
Retrieves the complete game object including player presence information.

### WebSocket Endpoints

#### Connection
```
ws://localhost:5000/ws-tictactoe
```
WebSocket endpoint using SockJS for browser compatibility.

#### Message Mappings

**Join Game**
- **Destination**: `/app/join/{gameId}`
- **Payload**:
  ```json
  {
    "player": "X" | "O" | "Spectator",
    "sessionId": "unique-session-id"
  }
  ```
- **Subscribe to**: `/topic/game/{gameId}`

**Make Move**
- **Destination**: `/app/move/{gameId}`
- **Payload**:
  ```json
  {
    "row": 0,
    "column": 0,
    "player": "X" | "O"
  }
  ```

**Request Rematch**
- **Destination**: `/app/rematch/{gameId}`
- **Payload**:
  ```json
  {
    "player": "X" | "O"
  }
  ```

**Send Chat Message**
- **Destination**: `/app/chat/{gameId}`
- **Payload**:
  ```json
  {
    "player": "Player X",
    "message": "Hello!"
  }
  ```
- **Subscribe to**: `/topic/game/{gameId}/chat`

## 🎯 How to Play

### Single Player Mode
1. Toggle "Play against AI" switch ON
2. Click "New Game" to start
3. Make your moves by clicking on the board
4. The AI will automatically respond

### Multiplayer Mode
1. Click "Invite Friend" button
2. Share the generated link with your friend
3. Both players join the game automatically
4. Take turns making moves
5. Use the chat feature to communicate

### Spectator Mode
1. Join a game using a link where both player slots are already taken
2. Watch the game in real-time
3. Use chat to interact with players
4. Note: Spectators cannot make moves

## 📁 Project Structure

```
TicTacToe/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/tictactoe/
│       │       ├── config/
│       │       │   └── WebSocketConfig.java       # WebSocket configuration
│       │       ├── controller/
│       │       │   ├── GameController.java        # REST endpoints
│       │       │   └── LiveGameController.java    # WebSocket handlers
│       │       ├── dto/
│       │       │   ├── ChatMessage.java
│       │       │   ├── GameResponse.java
│       │       │   ├── JoinRequest.java
│       │       │   ├── JoinResponse.java
│       │       │   └── MoveRequest.java
│       │       ├── model/
│       │       │   ├── AIPlayer.java              # AI logic
│       │       │   ├── Board.java                 # Board representation
│       │       │   ├── Game.java                  # Game state management
│       │       │   ├── GameStatus.java            # Game status enum
│       │       │   └── Player.java                # Player enum
│       │       ├── service/
│       │       │   └── GameService.java           # Game service layer
│       │       └── TicTacToeApplication.java      # Main application
│       └── resources/
│           └── application.properties             # Application configuration
├── frontend/
│   ├── index.html                                 # Main HTML file
│   ├── game.js                                    # Frontend game logic
│   ├── styles.css                                 # Styling
│   └── bucket-policy.json                         # AWS S3 policy
├── pom.xml                                        # Maven configuration
├── Procfile                                       # AWS Elastic Beanstalk deployment config
└── README.md                                      # This file
```

## 🚢 Deployment

### AWS Elastic Beanstalk & EC2

This application is deployed on **AWS Elastic Beanstalk** with **EC2** instances. The backend runs on port 5000.

#### Deployment Steps

1. **Build the application**
   ```bash
   mvn clean package
   ```
   This creates an executable JAR file (`tictactoe-api-1.0.0.jar`) in the `target/` directory.

2. **Deploy to Elastic Beanstalk**
   - Create an Elastic Beanstalk environment configured for Java applications
   - Upload the JAR file or configure automatic deployment from your repository
   - Ensure the environment is configured to use Java 21
   - Set the server port to 5000 in your environment configuration

3. **Configure EC2 Instance**
   - The EC2 instance should have Java 21 installed
   - Ensure port 5000 is open in the security group
   - For WebSocket support, ensure proper configuration in the load balancer

4. **Frontend Deployment**
   - The frontend files can be deployed to AWS S3 and served via CloudFront
   - Or served directly from the Spring Boot application by placing them in `src/main/resources/static/`
   - Update the `BASE_URL` in `frontend/game.js` to match your deployment URL

#### Procfile Configuration
The `Procfile` is used for Elastic Beanstalk deployment:
```
web: java -jar tictactoe-api-1.0.0.jar --server.port=5000
```

#### AWS Services Used
- **Elastic Beanstalk**: Application hosting and environment management
- **EC2**: Compute instances for running the Spring Boot application
- **S3** (optional): Static frontend file hosting
- **CloudFront** (optional): CDN for frontend assets

#### Environment Variables
Make sure to configure the following in your Elastic Beanstalk environment:
- `SERVER_PORT=5000` (if different from default)
- CORS settings in `application.properties` are configured for your domain

## 🧪 Game Rules

1. Players take turns placing their mark (X or O) on a 3x3 grid
2. The first player to get three marks in a row (horizontally, vertically, or diagonally) wins
3. If all nine squares are filled and no player has three in a row, the game is a draw
4. In multiplayer mode, players must wait for their opponent's turn
5. Spectators can watch but cannot make moves

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Created with ❤️ by **Dariusz Lubelski**

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- STOMP.js and SockJS for WebSocket support
- All contributors and testers

---

⭐ If you like this project, please give it a star on GitHub!

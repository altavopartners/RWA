✅ Prerequisites
Make sure the following are installed:
● Git
● Node.js (v18 recommended)
● Docker & Docker Compose
● npm or yarn
🚀 1. Clone the Repo
git clone https://github.com/altavopartners/RWA.git
cd RWA
🌱 2. Checkout the develop Branch
git checkout develop
⚙️
3. Environment Setup
Create a .env file in the root directory with the following:
ini
Copy code
# .env
HEDERA_OPERATOR_ID=your-hedera-id
HEDERA_OPERATOR_KEY=your-hedera-private-key
WEB3STORAGE_API_TOKEN=your-web3-token
DATABASE_URL=postgres://postgres:postgres@postgres:5432/hexport
Ask the team lead for the actual values or testing credentials.
🐳 4. Start the App with Docker
docker-compose up --build
● Frontend: http://localhost:3000
● Backend: http://localhost:4000
● Postgres: running inside Docker
🧪 5. Development Workflow
●Create a new feature branch from develop: git checkout -b feature/<your-feature-name>
● Push your changes and open a pull request to develop.
🛠️
6. Rebuilding After Changes
If you make changes to Dockerfile or docker-compose.yml, rebuild with:
docker-compose up --build
📁 Folder Structure (example)
/client => Next.js Frontend
/server => Node.js Backend
/docker => Docker configs

Docker Integration Walkthrough
I have integrated Docker into the fighter_league project by adding Dockerfiles for the backend and frontend, and orchestrating them with 
docker-compose.yml
.

Changes Made
Backend: Added 
Dockerfile
 and 
.dockerignore
. configured to run on port 3000.
Frontend: Added 
Dockerfile
 (multi-stage build with Nginx) and 
nginx.conf
. Configured to run on port 8080 (mapped to container port 80).
Orchestration: Created 
docker-compose.yml
 to run Postgres, Backend, and Frontend together.
How to Run
Start Services: Run the following command in the root of your project:

docker compose up --build -d
Verify Status: Check if containers are running:

docker compose ps
Access Application:

Frontend: http://localhost:8080
Backend API: http://localhost:3000
Configuration Details
Database: A PostgreSQL container is spun up with persistent volume postgres_data. Default credentials are set in 
docker-compose.yml
 (Change these for production!).
Environment Variables: Development defaults are set in 
docker-compose.yml
.
TIP

If you make changes to the code, you can rebuild specific services: docker compose up --build -d backend or docker compose up --build -d frontend